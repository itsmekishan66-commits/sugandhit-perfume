import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { accountsPayable, accountsPayablePayments, vendors } from '../models/schema/index.js';
import { createAuditLog } from './audit.service.js';
import { postJournal, findAccount } from './journal.service.js';
import { toMoney, toNum, sum } from '../utils/money.js';

export interface PayableInput {
  vendorId: number;
  billRef?: string;
  category?: string;
  billDate: number;
  dueDate: number;
  originalAmount: number;
  notes?: string;
  createdBy?: number;
}

export const createPayable = async (input: PayableInput) => {
  const now = Date.now();
  const [payable] = await db
    .insert(accountsPayable)
    .values({
      vendorId: input.vendorId,
      billRef: input.billRef || `BILL-${now}-${Math.floor(Math.random() * 1000)}`,
      category: input.category ?? '',
      billDate: input.billDate,
      dueDate: input.dueDate,
      originalAmount: toMoney(input.originalAmount),
      outstandingAmount: toMoney(input.originalAmount),
      status: 'unpaid',
      approvalStatus: 'pending',
      notes: input.notes ?? '',
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await createAuditLog({
    actorId: input.createdBy,
    actorRole: 'admin',
    action: 'payable.created',
    entityType: 'accounts_payable',
    entityId: payable.id,
    newValue: { ...payable, originalAmount: toNum(payable.originalAmount) },
  });

  return enrichPayable(payable);
};

export const listPayables = async (opts: { from?: number; to?: number; status?: string; vendorId?: number; approvalStatus?: string; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(accountsPayable.billDate, opts.from));
  if (opts.to) conditions.push(lte(accountsPayable.billDate, opts.to));
  if (opts.status) conditions.push(eq(accountsPayable.status, opts.status));
  if (opts.vendorId) conditions.push(eq(accountsPayable.vendorId, opts.vendorId));
  if (opts.approvalStatus) conditions.push(eq(accountsPayable.approvalStatus, opts.approvalStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.query.accountsPayable.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.billDate)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(accountsPayable).where(where ?? sql`1=1`);
  const enriched = await Promise.all(items.map(enrichPayable));
  const totalOutstanding = sum((await db.query.accountsPayable.findMany({})).map((p) => toNum(p.outstandingAmount)));
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit, totalOutstanding };
};

export const enrichPayable = async (p: typeof accountsPayable.$inferSelect) => {
  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.id, p.vendorId) });
  const payments = await db.query.accountsPayablePayments.findMany({
    where: eq(accountsPayablePayments.payableId, p.id),
    orderBy: (t, { desc }) => [desc(t.paidAt)],
  });
  const now = Date.now();
  const daysOverdue = toNum(p.outstandingAmount) > 0 && now > p.dueDate ? Math.floor((now - p.dueDate) / 86400000) : 0;
  const effectiveStatus = toNum(p.outstandingAmount) > 0 && now > p.dueDate ? 'overdue' : p.status;
  return {
    ...p,
    _id: String(p.id),
    originalAmount: toNum(p.originalAmount),
    paidAmount: toNum(p.paidAmount),
    outstandingAmount: toNum(p.outstandingAmount),
    vendor: vendor ? { id: vendor.id, name: vendor.name, email: vendor.email, phone: vendor.phone } : null,
    payments: payments.map((pay) => ({ ...pay, amount: toNum(pay.amount) })),
    daysOverdue,
    status: effectiveStatus,
  };
};

export const payableAging = async () => {
  const rows = await db.query.accountsPayable.findMany({});
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };
  const now = Date.now();
  for (const p of rows) {
    const outstanding = toNum(p.outstandingAmount);
    if (outstanding <= 0) continue;
    const days = now > p.dueDate ? Math.floor((now - p.dueDate) / 86400000) : 0;
    if (days <= 0) buckets.current = Math.round((buckets.current + outstanding) * 100) / 100;
    else if (days <= 30) buckets.d30 = Math.round((buckets.d30 + outstanding) * 100) / 100;
    else if (days <= 60) buckets.d60 = Math.round((buckets.d60 + outstanding) * 100) / 100;
    else if (days <= 90) buckets.d90 = Math.round((buckets.d90 + outstanding) * 100) / 100;
    else buckets.d90plus = Math.round((buckets.d90plus + outstanding) * 100) / 100;
  }
  return buckets;
};

export const approvePayable = async (id: number, approved: boolean, actorId?: number) => {
  const payable = await db.query.accountsPayable.findFirst({ where: eq(accountsPayable.id, id) });
  if (!payable) throw new Error('Payable not found.');
  await db
    .update(accountsPayable)
    .set({ approvalStatus: approved ? 'approved' : 'rejected', approvedBy: actorId ?? null, updatedAt: Date.now() })
    .where(eq(accountsPayable.id, id));
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'payable.approve',
    entityType: 'accounts_payable',
    entityId: id,
    newValue: { approved },
  });
  return enrichPayable({ ...payable, approvalStatus: approved ? 'approved' : 'rejected' });
};

export const payPayable = async (input: { payableId: number; paymentAccountId: number; amount: number; reference?: string; createdBy?: number; ip?: string }) => {
  const payable = await db.query.accountsPayable.findFirst({ where: eq(accountsPayable.id, input.payableId) });
  if (!payable) throw new Error('Payable not found.');
  if (payable.approvalStatus !== 'approved') throw new Error('Bill must be approved before payment.');
  const outstanding = toNum(payable.outstandingAmount);
  if (toNum(input.amount) > outstanding + 0.001) {
    throw new Error(`Payment exceeds outstanding balance of ${outstanding.toFixed(2)}.`);
  }
  const now = Date.now();

  const result = await db.transaction(async (tx) => {
    const [pay] = await tx
      .insert(accountsPayablePayments)
      .values({
        payableId: input.payableId,
        paymentAccountId: input.paymentAccountId,
        amount: toMoney(input.amount),
        reference: input.reference ?? '',
        paidAt: now,
        createdBy: input.createdBy ?? null,
        createdAt: now,
      })
      .returning();

    const newPaid = Math.round((toNum(payable.paidAmount) + toNum(input.amount)) * 100) / 100;
    const newOutstanding = Math.round((outstanding - toNum(input.amount)) * 100) / 100;
    const status = newOutstanding <= 0 ? 'paid' : 'partially_paid';
    await tx.update(accountsPayable).set({ paidAmount: toMoney(newPaid), outstandingAmount: toMoney(Math.max(newOutstanding, 0)), status, updatedAt: now }).where(eq(accountsPayable.id, input.payableId));

    const bankAccount = (await findAccount('Bank Account')) ?? (await ensureDefault('Bank Account'));
    const apAccount = (await findAccount('Accounts Payable')) ?? (await ensureDefault('Accounts Payable'));
    await postJournal({
      entryDate: now,
      postingDate: now,
      referenceType: 'payable_payment',
      referenceId: input.payableId,
      description: `Payment of bill ${payable.billRef}`,
      lines: [
        { accountId: apAccount.id, debit: toNum(input.amount), credit: 0, description: `Payment of ${payable.billRef}` },
        { accountId: bankAccount.id, debit: 0, credit: toNum(input.amount), description: `Payment of ${payable.billRef}` },
      ],
      createdBy: input.createdBy,
    });
    return pay;
  });

  await createAuditLog({
    actorId: input.createdBy,
    actorRole: 'admin',
    action: 'payable.paid',
    entityType: 'accounts_payable',
    entityId: input.payableId,
    newValue: { amount: toNum(input.amount), paymentAccountId: input.paymentAccountId, reference: input.reference },
    ip: input.ip,
  });

  return result;
};

const resolveExpenseAccount = async (category: string, vendorId: number) => {
  const vend = vendorId ? await db.query.vendors.findFirst({ where: eq(vendors.id, vendorId) }) : null;
  const keyword = category || vend?.category || 'Miscellaneous Expense';
  const guessed = {
    rent: 'Rent',
    utility: 'Utilities',
    salary: 'Salaries and Wages',
    marketing: 'Marketing and Promotions',
    'payment gateway': 'Payment Gateway Fees',
    software: 'Software / Subscriptions',
    office: 'Office Expense',
    bank: 'Bank Charges',
    tax: 'Taxes and Licenses',
    delivery: 'Delivery Expense',
    ingredient: 'Ingredient / Stock Cost',
    stock: 'Ingredient / Stock Cost',
    packaging: 'Packaging Cost',
  } as Record<string, string>;
  const name = guessed[keyword.toLowerCase()] ?? 'Miscellaneous Expense';
  return (await findAccount(name)) ?? (await ensureDefault(name));
};

export const payableMaintenance = async (id: number, mode: 'settle' | 'write_off', reason = '', actorId?: number) => {
  const payable = await db.query.accountsPayable.findFirst({ where: eq(accountsPayable.id, id) });
  if (!payable) throw new Error('Payable not found.');
  const outstanding = toNum(payable.outstandingAmount);
  const now = Date.now();

  await db.transaction(async (tx) => {
    if (mode === 'settle') {
      await tx.update(accountsPayable).set({ paidAmount: toMoney(outstanding + toNum(payable.paidAmount)), outstandingAmount: '0', status: 'paid', updatedAt: now }).where(eq(accountsPayable.id, id));
    } else {
      await tx.update(accountsPayable).set({ outstandingAmount: '0', status: 'written_off', notes: reason, updatedAt: now }).where(eq(accountsPayable.id, id));
      const expenseAccount = await resolveExpenseAccount(payable.category, payable.vendorId);
      const apAccount = (await findAccount('Accounts Payable')) ?? (await ensureDefault('Accounts Payable'));
      await postJournal({
        entryDate: now,
        postingDate: now,
        referenceType: 'payable_wo',
        referenceId: id,
        description: `Write-off of ${payable.billRef} ${reason}`,
        lines: [
          { accountId: expenseAccount.id, debit: outstanding, credit: 0, description: reason },
          { accountId: apAccount.id, debit: 0, credit: outstanding, description: reason },
        ],
        createdBy: actorId,
      });
    }
  });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: `payable.${mode}`,
    entityType: 'accounts_payable',
    entityId: id,
    newValue: { mode, reason, previousOutstanding: outstanding },
    reason,
  });
  return enrichPayable({ ...payable, outstandingAmount: '0', status: mode === 'settle' ? 'paid' : 'written_off' });
};

const ensureDefault = async (name: string) => {
  const { ensureAccountExists } = await import('./journal.service.js');
  return ensureAccountExists(name);
};