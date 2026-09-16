import { and, eq, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import {
  paymentAccounts,
  paymentTransactions,
  paymentRefunds,
  paymentProviderEvents,
  paymentReconciliations,
  paymentReconciliationItems,
  accountsReceivable,
  orders,
  customorders,
  chartOfAccounts,
  journalEntries,
  journalEntryLines,
} from '../../database/schema/index.js';
import { toMoney, toNum } from '../../shared/utils/money.js';
import { DEFAULT_CHART_OF_ACCOUNTS, ACCOUNT_KEYWORDS } from '../../shared/constants/finance.constants.js';

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Chart of Accounts helpers (local to avoid circular imports) ────────────

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

// ─── Journal posting (local to avoid circular imports) ──────────────────────

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
    const { assertDateNotInClosedPeriod } = await import('../accounting/accounting.service.js');
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

// ─── Payment Account Queries ────────────────────────────────────────────────

export const insertPaymentAccount = (values: typeof paymentAccounts.$inferInsert) =>
  db.insert(paymentAccounts).values(values).returning();

export const findPaymentAccountById = (id: number) =>
  db.query.paymentAccounts.findFirst({ where: eq(paymentAccounts.id, id) });

export const findPaymentAccounts = (where?: ReturnType<typeof sql>) =>
  db.query.paymentAccounts.findMany({ where, orderBy: (t, { asc }) => [asc(t.name)] });

export const updatePaymentAccountById = (id: number, patch: Record<string, unknown>) =>
  db.update(paymentAccounts).set(patch).where(eq(paymentAccounts.id, id));

// ─── Payment Transaction Queries ────────────────────────────────────────────

export const insertPaymentTransaction = (client: DbClient, values: typeof paymentTransactions.$inferInsert) =>
  client.insert(paymentTransactions).values(values).returning();

export const findPaymentTransactionById = (id: number) =>
  db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, id) });

export const findPaymentTransactions = (where?: ReturnType<typeof sql>, opts?: { limit?: number; offset?: number }) =>
  db.query.paymentTransactions.findMany({ where, orderBy: (t, { desc }) => [desc(t.initiatedAt)], limit: opts?.limit, offset: opts?.offset });

export const countPaymentTransactions = (where?: ReturnType<typeof sql>) =>
  db.select({ count: sql<number>`count(*)` }).from(paymentTransactions).where(where ?? sql`1=1`);

export const updatePaymentTransactionById = (id: number, patch: Record<string, unknown>) =>
  db.update(paymentTransactions).set(patch).where(eq(paymentTransactions.id, id));

export const findPaymentTransactionsByAccount = (accountId: number) =>
  db.query.paymentTransactions.findMany({ where: eq(paymentTransactions.paymentAccountId, accountId) });

export const findPaymentTransactionsByProviderEventId = (transactionId: string) =>
  db.query.paymentTransactions.findFirst({
    where: (t, { or, eq: e }) => or(e(t.transactionId, transactionId), e(t.providerTransactionId, transactionId)),
  });

// ─── Payment Provider Events Queries ────────────────────────────────────────

export const findProviderEventByEventId = (eventId: string) =>
  db.query.paymentProviderEvents.findFirst({ where: eq(paymentProviderEvents.eventId, eventId) });

export const findProviderEventById = (id: number) =>
  db.query.paymentProviderEvents.findFirst({ where: eq(paymentProviderEvents.id, id) });

export const insertProviderEvent = (values: typeof paymentProviderEvents.$inferInsert) =>
  db.insert(paymentProviderEvents).values(values).returning();

export const updateProviderEventById = (id: number, patch: Record<string, unknown>) =>
  db.update(paymentProviderEvents).set(patch).where(eq(paymentProviderEvents.id, id));

export const countUnprocessedProviderEvents = () =>
  db.select({ count: sql<number>`count(*)` }).from(paymentProviderEvents).where(eq(paymentProviderEvents.processed, false));

// ─── Payment Refund Queries ─────────────────────────────────────────────────

export const findPaymentRefundsByTransactionId = (transactionId: number) =>
  db.query.paymentRefunds.findMany({ where: eq(paymentRefunds.transactionId, transactionId) });

export const findPaymentRefundById = (id: number) =>
  db.query.paymentRefunds.findFirst({ where: eq(paymentRefunds.id, id) });

export const insertPaymentRefund = (values: typeof paymentRefunds.$inferInsert) =>
  db.insert(paymentRefunds).values(values).returning();

export const updatePaymentRefundById = (id: number, patch: Record<string, unknown>) =>
  db.update(paymentRefunds).set(patch).where(eq(paymentRefunds.id, id));

export const findPaymentRefunds = (where?: ReturnType<typeof sql>, opts?: { limit?: number; offset?: number }) =>
  db.query.paymentRefunds.findMany({ where, orderBy: (t, { desc }) => [desc(t.createdAt)], limit: opts?.limit, offset: opts?.offset });

export const countPaymentRefunds = (where?: ReturnType<typeof sql>) =>
  db.select({ count: sql<number>`count(*)` }).from(paymentRefunds).where(where ?? sql`1=1`);

// ─── Payment Reconciliation Queries ─────────────────────────────────────────

export const findReconciliationInProgress = (accountId: number) =>
  db.query.paymentReconciliations.findFirst({
    where: and(eq(paymentReconciliations.paymentAccountId, accountId), eq(paymentReconciliations.status, 'in_progress')),
  });

export const insertReconciliation = (values: typeof paymentReconciliations.$inferInsert) =>
  db.insert(paymentReconciliations).values(values).returning();

export const findReconciliationById = (id: number) =>
  db.query.paymentReconciliations.findFirst({ where: eq(paymentReconciliations.id, id) });

export const findReconciliations = (where?: ReturnType<typeof sql>) =>
  db.query.paymentReconciliations.findMany({ where, orderBy: (t, { desc }) => [desc(t.createdAt)] });

export const updateReconciliationById = (id: number, patch: Record<string, unknown>) =>
  db.update(paymentReconciliations).set(patch).where(eq(paymentReconciliations.id, id));

// ─── Payment Reconciliation Items Queries ───────────────────────────────────

export const findReconciliationItemByRef = (reconciliationId: number, externalRef: string) =>
  db.query.paymentReconciliationItems.findFirst({
    where: and(eq(paymentReconciliationItems.reconciliationId, reconciliationId), eq(paymentReconciliationItems.externalRef, externalRef)),
  });

export const findReconciliationItemById = (id: number) =>
  db.query.paymentReconciliationItems.findFirst({ where: eq(paymentReconciliationItems.id, id) });

export const insertReconciliationItem = (values: typeof paymentReconciliationItems.$inferInsert) =>
  db.insert(paymentReconciliationItems).values(values).returning();

export const updateReconciliationItemById = (id: number, patch: Record<string, unknown>) =>
  db.update(paymentReconciliationItems).set(patch).where(eq(paymentReconciliationItems.id, id));

export const findReconciliationItems = (reconciliationId: number) =>
  db.query.paymentReconciliationItems.findMany({
    where: eq(paymentReconciliationItems.reconciliationId, reconciliationId),
    orderBy: (t, { asc }) => [asc(t.id)],
  });

export const findReconciliationItemByExternalRef = (reconciliationId: number, externalRef: string) =>
  db.query.paymentReconciliationItems.findFirst({
    where: and(
      eq(paymentReconciliationItems.reconciliationId, reconciliationId),
      eq(paymentReconciliationItems.externalRef, externalRef),
    ),
  });

// ─── Order / Custom Order Queries (for manual payment) ──────────────────────

export const findOrderById = (id: number) =>
  db.query.orders.findFirst({ where: eq(orders.id, id) });

export const findCustomOrderById = (id: number) =>
  db.query.customorders.findFirst({ where: eq(customorders.id, id) });

export const findUserById = (id: number) =>
  db.query.users.findFirst({ where: (t, { eq: e }) => e(t.id, id) });

// ─── Accounts Receivable Queries ────────────────────────────────────────────

export const findAccountsReceivable = (where?: ReturnType<typeof sql>) =>
  db.query.accountsReceivable.findFirst({ where });

export const insertAccountsReceivable = (values: typeof accountsReceivable.$inferInsert) =>
  db.insert(accountsReceivable).values(values).returning();

export const updateAccountsReceivableById = (id: number, patch: Record<string, unknown>) =>
  db.update(accountsReceivable).set(patch).where(eq(accountsReceivable.id, id));

export const getAllAccountsReceivable = () =>
  db.query.accountsReceivable.findMany({});

export const getAllAccountsPayable = () =>
  db.query.accountsPayable.findMany({});

// ─── Payment Transaction Raw Select (for dashboard/reconciliation) ───────────

export const selectPaymentTransactionsForReconciliation = (where: ReturnType<typeof sql>) =>
  db
    .select({
      reconciliationStatus: paymentTransactions.reconciliationStatus,
      status: paymentTransactions.status,
      amount: paymentTransactions.netAmount,
      transactionId: paymentTransactions.id,
    })
    .from(paymentTransactions)
    .where(where);

// ─── Payment Account Count (for link status) ────────────────────────────────

export const countPaymentAccounts = () =>
  db.select({ count: sql<number>`count(*)` }).from(paymentAccounts);

// ─── Transaction in a range for reconciliation ──────────────────────────────

export const findPaymentTransactionsInRange = (accountId: number, from: number, to: number) =>
  db.query.paymentTransactions.findMany({
    where: and(eq(paymentTransactions.paymentAccountId, accountId), sql`${paymentTransactions.initiatedAt} >= ${from} AND ${paymentTransactions.initiatedAt} <= ${to}`),
  });

export const transaction = <T>(fn: (tx: DbClient) => Promise<T>): Promise<T> =>
  db.transaction(fn);
