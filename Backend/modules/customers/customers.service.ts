import db from '../../database/client.js';
import { accountsReceivable } from '../../database/schema/index.js';
import {
  listReceivables as listReceivablesRepo,
  findReceivableById,
  findCustomerById,
  listReceivablePayments,
  listByCustomer,
  listAllReceivables,
  updateReceivable,
  findCartItems,
  upsertCartItem,
  updateCartItem,
  deleteUserCart,
  findWishlistItems,
  insertWishlistItem,
  removeWishlistItem,
} from './customers.repository.js';
import { postJournal, findAccount, ensureAccountExists, createAuditLog } from '../accounting/accounting.service.js';
import { toMoney, toNum, sum } from '../../shared/utils/money.js';
import type { AgingReport, CustomerStatement, ReceivableQuery } from './customers.types.js';

export const enrichReceivable = async (r: typeof accountsReceivable.$inferSelect) => {
  const customer = r.customerId ? await findCustomerById(r.customerId) : null;
  const payments = await listReceivablePayments(r.id);
  const now = Date.now();
  const daysOverdue = r.outstandingAmount && toNum(r.outstandingAmount) > 0 && r.dueDate && now > r.dueDate
    ? Math.floor((now - r.dueDate) / 86400000)
    : 0;
  const effectiveStatus = toNum(r.outstandingAmount) > 0 && r.dueDate && now > r.dueDate ? 'overdue' : r.status;
  return {
    ...r,
    _id: String(r.id),
    originalAmount: toNum(r.originalAmount),
    paidAmount: toNum(r.paidAmount),
    creditApplied: toNum(r.creditApplied),
    refundAmount: toNum(r.refundAmount),
    outstandingAmount: toNum(r.outstandingAmount),
    customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone ?? '' } : null,
    payments: payments.map((p) => ({ ...p, amount: toNum(p.amount) })),
    daysOverdue,
    status: effectiveStatus,
  };
};

export const listReceivables = async (opts: ReceivableQuery = {}) => {
  const { rows, total, page, limit } = await listReceivablesRepo(opts);
  const enriched = await Promise.all(rows.map(enrichReceivable));
  const totalOutstanding = await getTotalOutstanding();
  return { items: enriched, total, page, limit, totalOutstanding };
};

export const receivableAging = async (): Promise<AgingReport> => {
  const rows = await listAllReceivables();
  const buckets: AgingReport = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };
  const now = Date.now();
  for (const r of rows) {
    const outstanding = toNum(r.outstandingAmount);
    if (outstanding <= 0) continue;
    const days = r.dueDate && now > r.dueDate ? Math.floor((now - r.dueDate) / 86400000) : 0;
    if (days <= 0) buckets.current = Math.round((buckets.current + outstanding) * 100) / 100;
    else if (days <= 30) buckets.d30 = Math.round((buckets.d30 + outstanding) * 100) / 100;
    else if (days <= 60) buckets.d60 = Math.round((buckets.d60 + outstanding) * 100) / 100;
    else if (days <= 90) buckets.d90 = Math.round((buckets.d90 + outstanding) * 100) / 100;
    else buckets.d90plus = Math.round((buckets.d90plus + outstanding) * 100) / 100;
  }
  return buckets;
};

export const receivableCustomerStatement = async (customerId: number): Promise<CustomerStatement> => {
  const rows = await listByCustomer(customerId);
  const enriched = await Promise.all(rows.map(enrichReceivable));
  return {
    customerId,
    balance: sum(enriched.map((r) => r.outstandingAmount)),
    receivables: enriched,
  };
};

export const adjustReceivable = async (id: number, mode: 'adjust' | 'write_off', amount?: number, reason = '', actorId?: number, ip?: string) => {
  const rec = await findReceivableById(id);
  if (!rec) throw new Error('Receivable not found.');
  const now = Date.now();

  const result = await db.transaction(async (tx) => {
    if (mode === 'adjust') {
      const adjustment = toNum(amount ?? 0);
      const outstanding = toNum(rec.outstandingAmount);
      const newOutstanding = Math.round((outstanding - adjustment) * 100) / 100;
      if (newOutstanding < 0) throw new Error('Adjustment exceeds outstanding balance.');
      await updateReceivable(
        id,
        {
          refundAmount: toMoney(toNum(rec.refundAmount) + adjustment),
          outstandingAmount: toMoney(newOutstanding),
          status: newOutstanding <= 0 ? 'paid' : rec.status,
          updatedAt: now,
        },
        tx
      );

      const arAccount = (await findAccount('Accounts Receivable')) ?? (await ensureAccountExists('Accounts Receivable'));
      const refundAccount = (await findAccount('Refunds')) ?? (await ensureAccountExists('Refunds'));
      await postJournal({
        entryDate: now,
        postingDate: now,
        referenceType: 'receivable_adj',
        referenceId: id,
        description: `Receivable adjustment ${reason}`,
        lines: [
          { accountId: refundAccount.id, debit: adjustment, credit: 0, description: reason },
          { accountId: arAccount.id, debit: 0, credit: adjustment, description: reason },
        ],
        createdBy: actorId,
      });
    } else {
      await updateReceivable(
        id,
        {
          status: 'written_off',
          writeOffReason: reason,
          outstandingAmount: '0',
          updatedAt: now,
        },
        tx
      );
      const arAccount = (await findAccount('Accounts Receivable')) ?? (await ensureAccountExists('Accounts Receivable'));
      const miscAccount = (await findAccount('Miscellaneous Expense')) ?? (await ensureAccountExists('Miscellaneous Expense'));
      await postJournal({
        entryDate: now,
        postingDate: now,
        referenceType: 'receivable_wo',
        referenceId: id,
        description: `Receivable write-off ${reason}`,
        lines: [
          { accountId: miscAccount.id, debit: toNum(rec.outstandingAmount), credit: 0, description: reason },
          { accountId: arAccount.id, debit: 0, credit: toNum(rec.outstandingAmount), description: reason },
        ],
        createdBy: actorId,
      });
    }
    return rec;
  });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: `receivable.${mode}`,
    entityType: 'accounts_receivable',
    entityId: id,
    newValue: { mode, amount: toNum(amount ?? 0), reason, previousOutstanding: toNum(rec.outstandingAmount) },
    reason,
    ip,
  });

  return result;
};

export const getTotalOutstanding = async () => {
  const rows = await listAllReceivables();
  return sum(rows.map((r) => toNum(r.outstandingAmount)));
};

type CartData = Record<string, Record<string, number>>;

export const addToCart = async (userId: number, itemId: string, size: string, quantity = 1) => {
  await upsertCartItem(userId, itemId, size, Number(quantity));
};

export const updateCart = async (userId: number, itemId: string, size: string, quantity: number) => {
  await updateCartItem(userId, itemId, size, Number(quantity));
};

export const getCart = async (userId: number): Promise<CartData> => {
  const rows = await findCartItems(userId);
  const cartData: CartData = {};
  for (const row of rows) {
    cartData[row.productId] = cartData[row.productId] || {};
    cartData[row.productId][row.size] = row.quantity;
  }
  return cartData;
};

export const clearCart = async (userId: number) => {
  await deleteUserCart(userId);
};

export const getWishlist = async (userId: number): Promise<string[]> => {
  const rows = await findWishlistItems(userId);
  return rows.map((row) => row.productId);
};

export const addToWishlist = async (userId: number, productId: string) => {
  await insertWishlistItem(userId, productId);
};

export const removeFromWishlist = async (userId: number, productId: string) => {
  await removeWishlistItem(userId, productId);
};