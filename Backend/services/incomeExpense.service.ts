import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { incomeRecords, expenseRecords, chartOfAccounts } from '../models/schema/index.js';
import { createAuditLog } from './audit.service.js';
import { postJournal, findAccount } from './journal.service.js';
import { toMoney, toNum } from '../utils/money.js';

export interface IncomeInput {
  date: number;
  source?: string;
  accountId: number;
  amount: number;
  paymentAccountId?: number;
  reference?: string;
  description?: string;
  createdBy?: number;
}

export const createIncome = async (input: IncomeInput, actorId?: number, ip?: string) => {
  const now = Date.now();
  const result = await db.transaction(async (tx) => {
    const [income] = await tx
      .insert(incomeRecords)
      .values({
        date: input.date,
        source: input.source ?? '',
        accountId: input.accountId,
        amount: toMoney(input.amount),
        paymentAccountId: input.paymentAccountId ?? null,
        reference: input.reference ?? '',
        description: input.description ?? '',
        createdBy: actorId ?? null,
        createdAt: now,
      })
      .returning();

    const revenueAccount = await tx.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, input.accountId) });
    if (!revenueAccount) throw new Error('Revenue account not found.');

    const bankAccount = (await findAccount('Bank Account')) ?? (await ensureDefault('Bank Account'));
    const journal = await postJournal({
      entryDate: input.date,
      postingDate: now,
      referenceType: 'income_record',
      referenceId: income.id,
      description: input.description || `Income from ${input.source || 'miscellaneous'}`,
      lines: [
        { accountId: bankAccount.id, debit: toNum(input.amount), credit: 0, description: input.description || input.source || 'Income' },
        { accountId: input.accountId, credit: toNum(input.amount), debit: 0, description: input.description || input.source || 'Income' },
      ],
      createdBy: actorId,
    });
    await tx.update(incomeRecords).set({ journalEntryId: journal.entry.id }).where(eq(incomeRecords.id, income.id));
    return { ...income, journalEntryId: journal.entry.id };
  });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'income.create',
    entityType: 'income_record',
    entityId: result.id,
    newValue: { amount: toNum(input.amount), source: input.source, accountId: input.accountId },
    ip,
  });
  return result;
};

export const listIncome = async (opts: { from?: number; to?: number; accountId?: number; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(incomeRecords.date, opts.from));
  if (opts.to) conditions.push(lte(incomeRecords.date, opts.to));
  if (opts.accountId) conditions.push(eq(incomeRecords.accountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const items = await db.query.incomeRecords.findMany({ where, orderBy: (t, { desc }) => [desc(t.date)], limit, offset: (page - 1) * limit });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(incomeRecords).where(where ?? sql`1=1`);
  const enriched = await Promise.all(items.map(async (i) => {
    const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, i.accountId) });
    return { ...i, _id: String(i.id), amount: toNum(i.amount), accountName: account?.name ?? '' };
  }));
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getIncomeTotal = async (from?: number, to?: number) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (from) conditions.push(gte(incomeRecords.date, from));
  if (to) conditions.push(lte(incomeRecords.date, to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select({ sum: sql<string>`coalesce(sum(${incomeRecords.amount}),0)` }).from(incomeRecords).where(where ?? sql`1=1`);
  return toNum((rows[0] as unknown as { sum: string }).sum);
};

export interface ExpenseInput {
  date: number;
  vendorId?: number;
  vendorName?: string;
  accountId: number;
  amount: number;
  taxAmount?: number;
  paymentAccountId?: number;
  dueDate?: number;
  description?: string;
  attachment?: string;
  createdBy?: number;
}

export const createExpense = async (input: ExpenseInput, actorId?: number, ip?: string) => {
  const now = Date.now();
  const [expense] = await db
    .insert(expenseRecords)
    .values({
      date: input.date,
      vendorId: input.vendorId ?? null,
      vendorName: input.vendorName ?? '',
      accountId: input.accountId,
      amount: toMoney(input.amount),
      taxAmount: toMoney(input.taxAmount ?? 0),
      paymentStatus: 'unpaid',
      paymentAccountId: input.paymentAccountId ?? null,
      dueDate: input.dueDate ?? null,
      description: input.description ?? '',
      attachment: input.attachment ?? '',
      approvalStatus: 'pending',
      createdBy: actorId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'expense.create',
    entityType: 'expense_record',
    entityId: expense.id,
    newValue: { amount: toNum(input.amount), taxAmount: toNum(input.taxAmount ?? 0), accountId: input.accountId },
    ip,
  });
  return { ...expense, amount: toNum(expense.amount), taxAmount: toNum(expense.taxAmount) };
};

export const listExpenses = async (opts: { from?: number; to?: number; accountId?: number; paymentStatus?: string; approvalStatus?: string; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(expenseRecords.date, opts.from));
  if (opts.to) conditions.push(lte(expenseRecords.date, opts.to));
  if (opts.accountId) conditions.push(eq(expenseRecords.accountId, opts.accountId));
  if (opts.paymentStatus) conditions.push(eq(expenseRecords.paymentStatus, opts.paymentStatus));
  if (opts.approvalStatus) conditions.push(eq(expenseRecords.approvalStatus, opts.approvalStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const items = await db.query.expenseRecords.findMany({ where, orderBy: (t, { desc }) => [desc(t.date)], limit, offset: (page - 1) * limit });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(expenseRecords).where(where ?? sql`1=1`);
  const enriched = await Promise.all(items.map(async (e) => {
    const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, e.accountId) });
    return { ...e, _id: String(e.id), amount: toNum(e.amount), taxAmount: toNum(e.taxAmount), accountName: account?.name ?? '' };
  }));
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getExpenseTotal = async (from?: number, to?: number) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (from) conditions.push(gte(expenseRecords.date, from));
  if (to) conditions.push(lte(expenseRecords.date, to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select({ sum: sql<string>`coalesce(sum(${expenseRecords.amount}),0)` }).from(expenseRecords).where(where ?? sql`1=1`);
  return toNum((rows[0] as unknown as { sum: string }).sum);
};

export const approveExpense = async (id: number, approved: boolean, actorId?: number) => {
  const expense = await db.query.expenseRecords.findFirst({ where: eq(expenseRecords.id, id) });
  if (!expense) throw new Error('Expense not found.');
  const now = Date.now();

  const result = await db.transaction(async (tx) => {
    await tx.update(expenseRecords).set({ approvalStatus: approved ? 'approved' : 'rejected', approvedBy: actorId ?? null, updatedAt: now }).where(eq(expenseRecords.id, id));
    if (approved) {
      const expenseAccount = await tx.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts, expense.accountId) });
      if (!expenseAccount) throw new Error('Expense account not found.');
      const apAccount = (await findAccount('Accounts Payable')) ?? (await ensureDefault('Accounts Payable'));
      const journal = await postJournal({
        entryDate: expense.date,
        postingDate: now,
        referenceType: 'expense_record',
        referenceId: id,
        description: expense.description || `Expense ${expense.date}`,
        lines: [
          { accountId: expense.accountId, debit: toNum(expense.amount), credit: 0, description: expense.description || expense.vendorName },
          { accountId: apAccount.id, debit: 0, credit: toNum(expense.amount), description: expense.description || expense.vendorName },
        ],
        createdBy: actorId,
      });
      await tx.update(expenseRecords).set({ journalEntryId: journal.entry.id }).where(eq(expenseRecords.id, id));
    }
    return { ...expense, approvalStatus: approved ? 'approved' : 'rejected' };
  });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'expense.approve',
    entityType: 'expense_record',
    entityId: id,
    newValue: { approved },
  });
  return result;
};

export const payExpense = async (id: number, paymentAccountId: number, actorId?: number, ip?: string) => {
  const expense = await db.query.expenseRecords.findFirst({ where: eq(expenseRecords.id, id) });
  if (!expense) throw new Error('Expense not found.');
  if (expense.approvalStatus !== 'approved') throw new Error('Expense must be approved before payment.');
  if (expense.paymentStatus === 'paid') throw new Error('Expense is already paid.');
  const now = Date.now();

  const result = await db.transaction(async (tx) => {
    await tx.update(expenseRecords).set({ paymentStatus: 'paid', paymentAccountId, updatedAt: now }).where(eq(expenseRecords.id, id));
    const apAccount = (await findAccount('Accounts Payable')) ?? (await ensureDefault('Accounts Payable'));
    const bankAccount = (await findAccount('Bank Account')) ?? (await ensureDefault('Bank Account'));
    const journal = await postJournal({
      entryDate: now,
      postingDate: now,
      referenceType: 'expense_payment',
      referenceId: id,
      description: `Payment of expense ${expense.id}`,
      lines: [
        { accountId: apAccount.id, debit: toNum(expense.amount), credit: 0, description: expense.description || expense.vendorName },
        { accountId: bankAccount.id, debit: 0, credit: toNum(expense.amount), description: expense.description || expense.vendorName },
      ],
      createdBy: actorId,
    });
    await tx.update(expenseRecords).set({ paymentJournalEntryId: journal.entry.id }).where(eq(expenseRecords.id, id));
    return { ...expense, paymentStatus: 'paid' };
  });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'expense.paid',
    entityType: 'expense_record',
    entityId: id,
    newValue: { paymentAccountId },
    ip,
  });
  return result;
};

export const updateExpense = async (id: number, patch: Partial<ExpenseInput>) => {
  const expense = await db.query.expenseRecords.findFirst({ where: eq(expenseRecords.id, id) });
  if (!expense) throw new Error('Expense not found.');
  const cleaned = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
  );
  if (cleaned.amount) cleaned.amount = toMoney(cleaned.amount as number);
  if (cleaned.taxAmount) cleaned.taxAmount = toMoney(cleaned.taxAmount as number);
  await db.update(expenseRecords).set({ ...cleaned, updatedAt: Date.now() }).where(eq(expenseRecords.id, id));
  return db.query.expenseRecords.findFirst({ where: eq(expenseRecords.id, id) });
};

const ensureDefault = async (name: string) => {
  const { ensureAccountExists } = await import('./journal.service.js');
  return ensureAccountExists(name);
};