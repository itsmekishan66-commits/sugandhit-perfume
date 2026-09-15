import { eq, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { chartOfAccounts, journalEntryLines } from '../models/schema/index.js';
import { seedChartOfAccounts } from './journal.service.js';
import { createAuditLog } from './audit.service.js';
import { toNum } from '../utils/money.js';
import { ACCOUNT_TYPE_LABELS } from '../utils/finance.constants.js';

export interface ChartAccountInput {
  code: string;
  name: string;
  accountType: string;
  normalBalance?: 'debit' | 'credit';
  parentId?: number;
  description?: string;
  createdBy?: number;
}

export const listChartOfAccounts = async () => {
  await seedChartOfAccounts();
  const rows = await db.query.chartOfAccounts.findMany({
    orderBy: (t, { asc }) => [asc(t.code)],
  });
  const enriched = await Promise.all(rows.map(async (a) => {
    const lineCount = await db.select({ count: sql<number>`count(*)` }).from(journalEntryLines).where(eq(journalEntryLines.accountId, a.id));
    const totalDebit = await db.select({ sum: sql<string>`coalesce(sum(${journalEntryLines.debit}),0)` }).from(journalEntryLines).where(eq(journalEntryLines.accountId, a.id));
    const totalCredit = await db.select({ sum: sql<string>`coalesce(sum(${journalEntryLines.credit}),0)` }).from(journalEntryLines).where(eq(journalEntryLines.accountId, a.id));
    const debit = toNum(totalDebit[0]?.sum);
    const credit = toNum(totalCredit[0]?.sum);
    const balance = a.normalBalance === 'debit' ? Math.round((debit - credit) * 100) / 100 : Math.round((credit - debit) * 100) / 100;
    return {
      ...a,
      _id: String(a.id),
      accountTypeLabel: ACCOUNT_TYPE_LABELS[a.accountType] ?? a.accountType,
      journalLineCount: Number(lineCount[0]?.count ?? 0),
      totalDebit: debit,
      totalCredit: credit,
      balance,
      used: Number(lineCount[0]?.count ?? 0) > 0,
    };
  }));
  return enriched;
};

export const createChartAccount = async (input: ChartAccountInput, actorId?: number) => {
  const normalized = input.code.trim().toUpperCase();
  const existingCode = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.code, normalized) });
  if (existingCode) throw new Error('An account with this code already exists.');
  const existingName = await db.query.chartOfAccounts.findFirst({ where: sql`lower(${chartOfAccounts.name}) = ${input.name.trim().toLowerCase()}` });
  if (existingName) throw new Error('An account with this name already exists.');

  const now = Date.now();
  const [account] = await db
    .insert(chartOfAccounts)
    .values({
      code: normalized,
      name: input.name.trim(),
      accountType: input.accountType,
      normalBalance: input.normalBalance ?? 'debit',
      parentId: input.parentId ?? null,
      description: input.description ?? '',
      createdBy: actorId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'chart_of_accounts.create',
    entityType: 'chart_of_accounts',
    entityId: account.id,
    newValue: { code: account.code, name: account.name, accountType: account.accountType },
  });
  return account;
};

export const updateChartAccount = async (id: number, patch: Partial<ChartAccountInput> & { active?: boolean }, actorId?: number) => {
  const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, id) });
  if (!account) throw new Error('Account not found.');
  const cleaned = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined && v !== null));
  await db.update(chartOfAccounts).set({ ...cleaned, updatedAt: Date.now() }).where(eq(chartOfAccounts.id, id));
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'chart_of_accounts.update',
    entityType: 'chart_of_accounts',
    entityId: id,
    previousValue: { name: account.name, accountType: account.accountType },
    newValue: { ...cleaned },
  });
  return db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, id) });
};

export const deactivateChartAccount = async (id: number, actorId?: number) => {
  const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, id) });
  if (!account) throw new Error('Account not found.');
  const usage = await db.select({ count: sql<number>`count(*)` }).from(journalEntryLines).where(eq(journalEntryLines.accountId, id));
  if (Number(usage[0]?.count ?? 0) > 0) {
    throw new Error('Account is used by journal entries and cannot be deleted. Deactivate it instead.');
  }
  await db.update(chartOfAccounts).set({ active: false, updatedAt: Date.now() }).where(eq(chartOfAccounts.id, id));
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'chart_of_accounts.deactivate',
    entityType: 'chart_of_accounts',
    entityId: id,
  });
  return db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, id) });
};