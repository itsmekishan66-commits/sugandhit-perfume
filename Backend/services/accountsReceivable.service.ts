import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { accountsReceivable, accountsReceivablePayments, users } from '../models/schema/index.js';
import { createAuditLog } from './audit.service.js';
import { postJournal, findAccount } from './journal.service.js';
import { toMoney, toNum, sum } from '../utils/money.js';

export const listReceivables = async (opts: { from?: number; to?: number; status?: string; customerId?: number; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(accountsReceivable.invoiceDate, opts.from));
  if (opts.to) conditions.push(lte(accountsReceivable.invoiceDate, opts.to));
  if (opts.status) conditions.push(eq(accountsReceivable.status, opts.status));
  if (opts.customerId) conditions.push(eq(accountsReceivable.customerId, opts.customerId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.query.accountsReceivable.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.invoiceDate)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(accountsReceivable).where(where ?? sql`1=1`);

  const enriched = await Promise.all(items.map(enrichReceivable));
  const totalOutstanding = await getTotalOutstanding();
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit, totalOutstanding };
};

export const enrichReceivable = async (r: typeof accountsReceivable.$inferSelect) => {
  const customer = r.customerId ? await db.query.users.findFirst({ where: eq(users.id, r.customerId) }) : null;
  const payments = await db.query.accountsReceivablePayments.findMany({
    where: eq(accountsReceivablePayments.receivableId, r.id),
    orderBy: (t, { desc }) => [desc(t.appliedAt)],
  });
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
    customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } : null,
    payments: payments.map((p) => ({ ...p, amount: toNum(p.amount) })),
    daysOverdue,
    status: effectiveStatus,
  };
};

export const receivableAging = async () => {
  const rows = await db.query.accountsReceivable.findMany({});
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };
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

export const receivableCustomerStatement = async (customerId: number) => {
  const rows = await db.query.accountsReceivable.findMany({
    where: eq(accountsReceivable.customerId, customerId),
    orderBy: (t, { asc }) => [asc(t.invoiceDate)],
  });
  const enriched = await Promise.all(rows.map(enrichReceivable));
  return {
    customerId,
    balance: sum(enriched.map((r) => r.outstandingAmount)),
    receivables: enriched,
  };
};

export const adjustReceivable = async (id: number, mode: 'adjust' | 'write_off', amount?: number, reason = '', actorId?: number, ip?: string) => {
  const rec = await db.query.accountsReceivable.findFirst({ where: eq(accountsReceivable.id, id) });
  if (!rec) throw new Error('Receivable not found.');
  const now = Date.now();

  const result = await db.transaction(async (tx) => {
    if (mode === 'adjust') {
      const adjustment = toNum(amount ?? 0);
      const outstanding = toNum(rec.outstandingAmount);
      const newOutstanding = Math.round((outstanding - adjustment) * 100) / 100;
      if (newOutstanding < 0) throw new Error('Adjustment exceeds outstanding balance.');
      await tx.update(accountsReceivable).set({
        refundAmount: toMoney(toNum(rec.refundAmount) + adjustment),
        outstandingAmount: toMoney(newOutstanding),
        status: newOutstanding <= 0 ? 'paid' : rec.status,
        updatedAt: now,
      }).where(eq(accountsReceivable.id, id));

      const arAccount = (await findAccount('Accounts Receivable')) ?? (await ensureDefault('Accounts Receivable'));
      const refundAccount = (await findAccount('Refunds')) ?? (await ensureDefault('Refunds'));
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
      await tx.update(accountsReceivable).set({
        status: 'written_off',
        writeOffReason: reason,
        outstandingAmount: '0',
        updatedAt: now,
      }).where(eq(accountsReceivable.id, id));
      const arAccount = (await findAccount('Accounts Receivable')) ?? (await ensureDefault('Accounts Receivable'));
      const miscAccount = (await findAccount('Miscellaneous Expense')) ?? (await ensureDefault('Miscellaneous Expense'));
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
  const rows = await db.query.accountsReceivable.findMany({});
  return sum(rows.map((r) => toNum(r.outstandingAmount)));
};

const ensureDefault = async (name: string) => {
  const { ensureAccountExists } = await import('./journal.service.js');
  return ensureAccountExists(name);
};

export const createReceivableForOrder = async (input: {
  customerId: number;
  orderId?: number;
  customOrderId?: number;
  invoiceRef: string;
  originalAmount: number;
  invoiceDate?: number;
  dueDate?: number;
}) => {
  const existing = await db.query.accountsReceivable.findFirst({
    where: and(
      input.orderId ? eq(accountsReceivable.orderId, input.orderId) : sql`1=1`,
      input.customOrderId ? eq(accountsReceivable.customOrderId, input.customOrderId) : sql`1=1`,
      eq(accountsReceivable.status, 'unpaid')
    ),
  });
  if (existing) return existing;
  const now = input.invoiceDate ?? Date.now();
  const [rec] = await db.insert(accountsReceivable).values({
    customerId: input.customerId,
    orderId: input.orderId ?? null,
    customOrderId: input.customOrderId ?? null,
    invoiceRef: input.invoiceRef,
    invoiceDate: now,
    dueDate: input.dueDate ?? now + 15 * 86400000,
    originalAmount: toMoney(input.originalAmount),
    outstandingAmount: toMoney(input.originalAmount),
    status: 'unpaid',
    createdAt: now,
    updatedAt: now,
  }).returning();
  return rec;
};