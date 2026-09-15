import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { chartOfAccounts, journalEntries, journalEntryLines } from '../models/schema/index.js';
import { DEFAULT_CHART_OF_ACCOUNTS, ACCOUNT_KEYWORDS } from '../utils/finance.constants.js';
import { toMoney, toNum } from '../utils/money.js';

export interface JournalLineInput {
  accountId: number;
  debit?: number | string;
  credit?: number | string;
  description?: string;
  costCenter?: string;
}

export interface JournalEntryInput {
  entryDate: number;
  postingDate?: number;
  referenceType?: string;
  referenceId?: number;
  description?: string;
  lines: JournalLineInput[];
  createdBy?: number;
  status?: 'draft' | 'posted';
}

export const getAccountById = async (id: number) => {
  const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, id) });
  if (!account) throw new Error(`Chart of account #${id} not found.`);
  return account;
};

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const findAccount = async (query: string, client?: DbClient) => {
  if (!query || !query.trim()) return null;
  const exec = client ?? db;
  const trimmed = query.trim();
  const byCode = await exec.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.code, trimmed) });
  if (byCode) return byCode;
  const byName = await exec.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.name, trimmed) });
  if (byName) return byName;
  const keywords = ACCOUNT_KEYWORDS[trimmed] ?? [];
  for (const keyword of keywords) {
    const accounts = await exec.query.chartOfAccounts.findMany({ where: (t, { ilike }) => ilike(t.name, keyword.replace(/_/g, ' ')) });
    if (accounts.length > 0) return accounts[0];
  }
  return null;
};

export const ensureAccountExists = async (name: string, client?: DbClient) => {
  const exec = client ?? db;
  const existing = await findAccount(name, exec);
  if (existing) return existing;
  const def = DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.name === name);
  if (!def) throw new Error(`Unknown default account: ${name}`);
  const conflict = await exec.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.code, def.code) });
  const code = conflict ? `${def.code}-${Date.now() % 1000}` : def.code;
  const inserted = await exec
    .insert(chartOfAccounts)
    .values({
      code,
      name: def.name,
      accountType: def.type,
      normalBalance: def.normalBalance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .returning();
  return inserted[0];
};

export const seedChartOfAccounts = async () => {
  let created = 0;
  for (const def of DEFAULT_CHART_OF_ACCOUNTS) {
    const existing = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.code, def.code) });
    if (!existing) {
      await db.insert(chartOfAccounts).values({
        code: def.code,
        name: def.name,
        accountType: def.type,
        normalBalance: def.normalBalance,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      created += 1;
    }
  }
  return created;
};

const linesBalance = (lines: JournalLineInput[]) =>
  Math.round(lines.reduce((s, l) => s + (toNum(l.debit) - toNum(l.credit)), 0) * 100) / 100;

export interface PostJournalResult {
  entry: typeof journalEntries.$inferSelect;
  lines: typeof journalEntryLines.$inferSelect[];
}

export const postJournal = async (input: JournalEntryInput, client?: DbClient): Promise<PostJournalResult> => {
  if (input.lines.length < 2) {
    throw new Error('A journal entry requires at least two lines.');
  }
  const totalDebit = Math.round(input.lines.reduce((s, l) => s + toNum(l.debit), 0) * 100) / 100;
  const totalCredit = Math.round(input.lines.reduce((s, l) => s + toNum(l.credit), 0) * 100) / 100;
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Unbalanced journal entry: debits ${totalDebit.toFixed(2)} do not equal credits ${totalCredit.toFixed(2)}.`);
  }
  if (linesBalance(input.lines) !== 0) {
    throw new Error('Invalid journal lines: each line must be a single-sided debit or credit.');
  }

  const status = input.status ?? 'posted';
  if (status !== 'draft') {
    const { assertDateNotInClosedPeriod } = await import('./accountingPeriod.service.js');
    await assertDateNotInClosedPeriod(input.entryDate);
  }

  const now = Date.now();
  const entryNumber = `JE-${input.entryDate}-${Math.floor(Math.random() * 100000)}`;

  const run = async (exec: DbClient) => {
    const [entry] = await exec
      .insert(journalEntries)
      .values({
        entryNumber,
        entryDate: input.entryDate,
        postingDate: status === 'posted' ? input.postingDate ?? now : input.postingDate,
        referenceType: input.referenceType ?? '',
        referenceId: input.referenceId ?? null,
        description: input.description ?? '',
        currency: 'NPR',
        status,
        createdBy: input.createdBy ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const lineValues = input.lines.map((l) => ({
      journalEntryId: entry.id,
      accountId: l.accountId,
      debit: toMoney(l.debit ?? 0),
      credit: toMoney(l.credit ?? 0),
      description: l.description ?? '',
      costCenter: l.costCenter ?? '',
    }));
    const lines = await exec.insert(journalEntryLines).values(lineValues).returning();
    await exec.update(journalEntries).set({ entryNumber: `JE-${entry.id}` }).where(eq(journalEntries.id, entry.id));
    return { entry: { ...entry, entryNumber: `JE-${entry.id}` }, lines };
  };

  if (client) return run(client);
  return db.transaction(async (tx) => run(tx));
};

export const updateEntryNumber = async (id: number) => {
  await db.update(journalEntries).set({ entryNumber: `JE-${id}` }).where(eq(journalEntries.id, id));
};

export const reverseJournal = async (id: number, reason = '', actorId?: number) => {
  const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, id) });
  if (!entry) throw new Error('Journal entry not found.');
  if (entry.status !== 'posted') throw new Error('Only posted entries can be reversed.');

  const lines = await db.query.journalEntryLines.findMany({ where: eq(journalEntryLines.journalEntryId, id) });
  const now = Date.now();
  const reversalLines = lines.map((l) => ({
    accountId: l.accountId,
    debit: toNum(l.credit) > 0 ? toNum(l.credit) : 0,
    credit: toNum(l.debit) > 0 ? toNum(l.debit) : 0,
    description: `Reversal of ${entry.entryNumber}: ${l.description}`,
  }));

  const reversal = await postJournal({
    entryDate: now,
    postingDate: now,
    referenceType: 'reversal',
    referenceId: entry.id,
    description: reason || `Reversal of ${entry.entryNumber}`,
    lines: reversalLines,
    createdBy: actorId,
  });

  await db.update(journalEntries).set({ status: 'reversed', updatedAt: now }).where(eq(journalEntries.id, id));
  return reversal;
};

export const voidJournal = async (id: number) => {
  const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, id) });
  if (!entry) throw new Error('Journal entry not found.');
  if (entry.status !== 'draft') throw new Error('Only draft entries can be voided.');
  await db.update(journalEntries).set({ status: 'voided', updatedAt: Date.now() }).where(eq(journalEntries.id, id));
  return entry;
};

export const listJournalEntries = async (opts: { from?: number; to?: number; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(journalEntries.entryDate, opts.from));
  if (opts.to) conditions.push(lte(journalEntries.entryDate, opts.to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const entries = await db.query.journalEntries.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.entryDate)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(journalEntries).where(where ?? sql`1=1`);
  const items = await Promise.all(
    entries.map(async (e) => {
      const lines = await db.query.journalEntryLines.findMany({ where: eq(journalEntryLines.journalEntryId, e.id) });
      return { ...e, _id: String(e.id), lines };
    })
  );
  return { items, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getJournalEntryDetail = async (id: number) => {
  const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, id) });
  if (!entry) throw new Error('Journal entry not found.');
  const lines = await db.query.journalEntryLines.findMany({ where: eq(journalEntryLines.journalEntryId, id) });
  const accountMap: Record<number, (typeof chartOfAccounts.$inferSelect) | null> = {};
  const lineDetails = await Promise.all(
    lines.map(async (l) => {
      if (!accountMap[l.accountId]) {
        accountMap[l.accountId] = (await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, l.accountId) })) ?? null;
      }
      return { ...l, account: accountMap[l.accountId] };
    })
  );
  return { ...entry, _id: String(entry.id), lines: lineDetails };
};

export const getAccountLedger = async (accountId: number, from?: number, to?: number) => {
  const entryConditions: ReturnType<typeof sql>[] = [eq(journalEntries.status, 'posted')];
  if (from) entryConditions.push(gte(journalEntries.entryDate, from));
  if (to) entryConditions.push(lte(journalEntries.entryDate, to));

  const rows = await db
    .select({
      lineId: journalEntryLines.id,
      entryId: journalEntries.id,
      entryNumber: journalEntries.entryNumber,
      entryDate: journalEntries.entryDate,
      description: journalEntries.description,
      referenceType: journalEntries.referenceType,
      referenceId: journalEntries.referenceId,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
      lineDescription: journalEntryLines.description,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(eq(journalEntryLines.accountId, accountId), ...entryConditions))
    .orderBy(asc(journalEntries.entryDate));

  let balance = 0;
  return rows.map((r) => {
    const debit = toNum(r.debit);
    const credit = toNum(r.credit);
    balance = Math.round((balance + debit - credit) * 100) / 100;
    return { ...r, _id: String(r.lineId), debit, credit, runningBalance: balance };
  });
};