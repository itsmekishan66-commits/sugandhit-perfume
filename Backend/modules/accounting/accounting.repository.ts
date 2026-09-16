import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import {
  accountsPayable,
  accountsPayablePayments,
  accountingPeriods,
  auditLogs,
  chartOfAccounts,
  expenseRecords,
  incomeRecords,
  journalEntries,
  journalEntryLines,
  paymentAccounts,
  paymentTransactions,
  vendors,
} from '../../database/schema/index.js';

export type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export const transaction = <T>(fn: (tx: DbClient) => Promise<T>): Promise<T> => db.transaction(fn);

export const findAllAccounts = () =>
  db.query.chartOfAccounts.findMany({ orderBy: (t, { asc }) => [asc(t.code)] });

export const findAccountById = (id: number, client?: DbClient) =>
  (client ?? db).query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, id) });

export const findAccountByCode = (code: string, client?: DbClient) =>
  (client ?? db).query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.code, code) });

export const findAccountByName = (name: string, client?: DbClient) =>
  (client ?? db).query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.name, name) });

export const findAccountByNameInsensitive = (name: string) =>
  db.query.chartOfAccounts.findFirst({
    where: sql`lower(${chartOfAccounts.name}) = ${name.toLowerCase()}`,
  });

export const findAccountsByKeyword = (keyword: string, client?: DbClient) =>
  (client ?? db).query.chartOfAccounts.findMany({
    where: (t, { ilike }) => ilike(t.name, keyword.replace(/_/g, ' ')),
  });

export const insertChartAccount = (values: typeof chartOfAccounts.$inferInsert, client?: DbClient) =>
  (client ?? db).insert(chartOfAccounts).values(values).returning();

export const updateChartAccountById = (id: number, patch: Record<string, unknown>) =>
  db.update(chartOfAccounts).set(patch).where(eq(chartOfAccounts.id, id));

export const countJournalLinesForAccount = (accountId: number) =>
  db.select({ count: sql<number>`count(*)` }).from(journalEntryLines).where(eq(journalEntryLines.accountId, accountId));

export const getJournalLineTotalsForAccount = (accountId: number) =>
  db
    .select({
      debit: sql<string>`coalesce(sum(${journalEntryLines.debit}),0)`,
      credit: sql<string>`coalesce(sum(${journalEntryLines.credit}),0)`,
    })
    .from(journalEntryLines)
    .where(eq(journalEntryLines.accountId, accountId));

export const findJournalEntryById = (id: number) =>
  db.query.journalEntries.findFirst({ where: eq(journalEntries.id, id) });

export const insertJournalEntry = (values: typeof journalEntries.$inferInsert, client?: DbClient) =>
  (client ?? db).insert(journalEntries).values(values).returning();

export const insertJournalEntryLines = (values: (typeof journalEntryLines.$inferInsert)[], client?: DbClient) =>
  (client ?? db).insert(journalEntryLines).values(values).returning();

export const updateJournalEntryById = (id: number, patch: Record<string, unknown>, client?: DbClient) =>
  (client ?? db).update(journalEntries).set(patch).where(eq(journalEntries.id, id));

export const findJournalEntries = (opts: { from?: number; to?: number; limit: number; offset: number }) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(journalEntries.entryDate, opts.from));
  if (opts.to) conditions.push(lte(journalEntries.entryDate, opts.to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.query.journalEntries.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.entryDate)],
    limit: opts.limit,
    offset: opts.offset,
  });
};

export const countJournalEntries = (opts: { from?: number; to?: number }) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(journalEntries.entryDate, opts.from));
  if (opts.to) conditions.push(lte(journalEntries.entryDate, opts.to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select({ count: sql<number>`count(*)` }).from(journalEntries).where(where ?? sql`1=1`);
};

export const findJournalLinesByEntryId = (entryId: number) =>
  db.query.journalEntryLines.findMany({ where: eq(journalEntryLines.journalEntryId, entryId) });

export const selectLedgerRows = (accountId: number, from?: number, to?: number) => {
  const conditions: ReturnType<typeof sql>[] = [eq(journalEntries.status, 'posted')];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));
  return db
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
    .where(and(eq(journalEntryLines.accountId, accountId), ...conditions))
    .orderBy(asc(journalEntries.entryDate));
};

export const getLineSumsForAccount = (accountId: number, from?: number, to?: number) => {
  const conditions: ReturnType<typeof sql>[] = [eq(journalEntries.status, 'posted')];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));
  return db
    .select({
      debit: sql<string>`coalesce(sum(${journalEntryLines.debit}),0)`,
      credit: sql<string>`coalesce(sum(${journalEntryLines.credit}),0)`,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(eq(journalEntryLines.accountId, accountId), ...conditions));
};

export const selectCashFlowLines = (accountIds: number[], from?: number, to?: number) => {
  const conditions: ReturnType<typeof sql>[] = [eq(journalEntries.status, 'posted')];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));
  return db
    .select({
      entryId: journalEntries.id,
      entryNumber: journalEntries.entryNumber,
      entryDate: journalEntries.entryDate,
      description: journalEntries.description,
      referenceType: journalEntries.referenceType,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(inArray(journalEntryLines.accountId, accountIds), ...conditions))
    .orderBy(asc(journalEntries.entryDate));
};

export const getOpeningCashBalanceAggregate = (accountIds: number[], from?: number) => {
  const conditions: ReturnType<typeof sql>[] = [
    eq(journalEntries.status, 'posted'),
    inArray(journalEntryLines.accountId, accountIds),
  ];
  if (from) conditions.push(lte(journalEntries.entryDate, from));
  return db
    .select({
      debit: sql<string>`coalesce(sum(${journalEntryLines.debit}),0)`,
      credit: sql<string>`coalesce(sum(${journalEntryLines.credit}),0)`,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(...conditions));
};

export const findPeriodsOrderedByStartDesc = () =>
  db.query.accountingPeriods.findMany({ orderBy: (t, { desc }) => [desc(t.startDate)] });

export const findPeriodById = (id: number) =>
  db.query.accountingPeriods.findFirst({ where: eq(accountingPeriods.id, id) });

export const findOpenPeriodOverlapping = (endDate: number) =>
  db.query.accountingPeriods.findFirst({
    where: and(eq(accountingPeriods.status, 'open'), lte(accountingPeriods.startDate, endDate)),
  });

export const insertAccountingPeriod = (values: typeof accountingPeriods.$inferInsert) =>
  db.insert(accountingPeriods).values(values).returning();

export const updatePeriodById = (id: number, patch: Record<string, unknown>) =>
  db.update(accountingPeriods).set(patch).where(eq(accountingPeriods.id, id));

export const findOpenPeriodsOrderedByStartAsc = () =>
  db.query.accountingPeriods.findMany({
    where: eq(accountingPeriods.status, 'open'),
    orderBy: (t, { asc }) => [asc(t.startDate)],
  });

export const findClosedPeriods = () =>
  db.query.accountingPeriods.findMany({ where: eq(accountingPeriods.status, 'closed') });

export const insertIncomeRecord = (values: typeof incomeRecords.$inferInsert, client?: DbClient) =>
  (client ?? db).insert(incomeRecords).values(values).returning();

export const updateIncomeRecordById = (id: number, patch: Record<string, unknown>, client?: DbClient) =>
  (client ?? db).update(incomeRecords).set(patch).where(eq(incomeRecords.id, id));

export const findIncomeRecords = (opts: { from?: number; to?: number; accountId?: number; limit: number; offset: number }) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(incomeRecords.date, opts.from));
  if (opts.to) conditions.push(lte(incomeRecords.date, opts.to));
  if (opts.accountId) conditions.push(eq(incomeRecords.accountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.query.incomeRecords.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.date)],
    limit: opts.limit,
    offset: opts.offset,
  });
};

export const countIncomeRecords = (opts: { from?: number; to?: number; accountId?: number }) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(incomeRecords.date, opts.from));
  if (opts.to) conditions.push(lte(incomeRecords.date, opts.to));
  if (opts.accountId) conditions.push(eq(incomeRecords.accountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select({ count: sql<number>`count(*)` }).from(incomeRecords).where(where ?? sql`1=1`);
};

export const sumIncomeRecords = (opts: { from?: number; to?: number }) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(incomeRecords.date, opts.from));
  if (opts.to) conditions.push(lte(incomeRecords.date, opts.to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select({ sum: sql<string>`coalesce(sum(${incomeRecords.amount}),0)` })
    .from(incomeRecords)
    .where(where ?? sql`1=1`);
};

export const insertExpenseRecord = (values: typeof expenseRecords.$inferInsert) =>
  db.insert(expenseRecords).values(values).returning();

export const findExpenseRecordById = (id: number) =>
  db.query.expenseRecords.findFirst({ where: eq(expenseRecords.id, id) });

export const updateExpenseRecordById = (id: number, patch: Record<string, unknown>, client?: DbClient) =>
  (client ?? db).update(expenseRecords).set(patch).where(eq(expenseRecords.id, id));

export const findExpenseRecords = (opts: {
  from?: number;
  to?: number;
  accountId?: number;
  paymentStatus?: string;
  approvalStatus?: string;
  limit: number;
  offset: number;
}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(expenseRecords.date, opts.from));
  if (opts.to) conditions.push(lte(expenseRecords.date, opts.to));
  if (opts.accountId) conditions.push(eq(expenseRecords.accountId, opts.accountId));
  if (opts.paymentStatus) conditions.push(eq(expenseRecords.paymentStatus, opts.paymentStatus));
  if (opts.approvalStatus) conditions.push(eq(expenseRecords.approvalStatus, opts.approvalStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.query.expenseRecords.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.date)],
    limit: opts.limit,
    offset: opts.offset,
  });
};

export const countExpenseRecords = (opts: {
  from?: number;
  to?: number;
  accountId?: number;
  paymentStatus?: string;
  approvalStatus?: string;
}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(expenseRecords.date, opts.from));
  if (opts.to) conditions.push(lte(expenseRecords.date, opts.to));
  if (opts.accountId) conditions.push(eq(expenseRecords.accountId, opts.accountId));
  if (opts.paymentStatus) conditions.push(eq(expenseRecords.paymentStatus, opts.paymentStatus));
  if (opts.approvalStatus) conditions.push(eq(expenseRecords.approvalStatus, opts.approvalStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select({ count: sql<number>`count(*)` }).from(expenseRecords).where(where ?? sql`1=1`);
};

export const sumExpenseRecords = (opts: { from?: number; to?: number }) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(expenseRecords.date, opts.from));
  if (opts.to) conditions.push(lte(expenseRecords.date, opts.to));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select({ sum: sql<string>`coalesce(sum(${expenseRecords.amount}),0)` })
    .from(expenseRecords)
    .where(where ?? sql`1=1`);
};

export const insertPayable = (values: typeof accountsPayable.$inferInsert) =>
  db.insert(accountsPayable).values(values).returning();

export const findPayableById = (id: number) =>
  db.query.accountsPayable.findFirst({ where: eq(accountsPayable.id, id) });

export const findPayables = (opts: {
  from?: number;
  to?: number;
  status?: string;
  vendorId?: number;
  approvalStatus?: string;
  limit: number;
  offset: number;
}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(accountsPayable.billDate, opts.from));
  if (opts.to) conditions.push(lte(accountsPayable.billDate, opts.to));
  if (opts.status) conditions.push(eq(accountsPayable.status, opts.status));
  if (opts.vendorId) conditions.push(eq(accountsPayable.vendorId, opts.vendorId));
  if (opts.approvalStatus) conditions.push(eq(accountsPayable.approvalStatus, opts.approvalStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.query.accountsPayable.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.billDate)],
    limit: opts.limit,
    offset: opts.offset,
  });
};

export const countPayables = (opts: {
  from?: number;
  to?: number;
  status?: string;
  vendorId?: number;
  approvalStatus?: string;
}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(accountsPayable.billDate, opts.from));
  if (opts.to) conditions.push(lte(accountsPayable.billDate, opts.to));
  if (opts.status) conditions.push(eq(accountsPayable.status, opts.status));
  if (opts.vendorId) conditions.push(eq(accountsPayable.vendorId, opts.vendorId));
  if (opts.approvalStatus) conditions.push(eq(accountsPayable.approvalStatus, opts.approvalStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select({ count: sql<number>`count(*)` }).from(accountsPayable).where(where ?? sql`1=1`);
};

export const listAllPayables = () =>
  db.query.accountsPayable.findMany({});

export const updatePayableById = (id: number, patch: Record<string, unknown>, client?: DbClient) =>
  (client ?? db).update(accountsPayable).set(patch).where(eq(accountsPayable.id, id));

export const findVendorById = (id: number) =>
  db.query.vendors.findFirst({ where: eq(vendors.id, id) });

export const insertPayablePayment = (values: typeof accountsPayablePayments.$inferInsert, client?: DbClient) =>
  (client ?? db).insert(accountsPayablePayments).values(values).returning();

export const findPaymentsForPayable = (payableId: number) =>
  db.query.accountsPayablePayments.findMany({
    where: eq(accountsPayablePayments.payableId, payableId),
    orderBy: (t, { desc }) => [desc(t.paidAt)],
  });

export const insertAuditLog = (values: typeof auditLogs.$inferInsert) =>
  db.insert(auditLogs).values(values);

export const findAuditLogs = (entityType?: string, entityId?: string | number) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (entityId !== undefined) conditions.push(eq(auditLogs.entityId, String(entityId)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.query.auditLogs.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 200,
  });
};

export const findPaymentAccountById = (id: number) =>
  db.query.paymentAccounts.findFirst({ where: eq(paymentAccounts.id, id) });

export const selectReconciliationRows = (where: ReturnType<typeof sql>) =>
  db
    .select({
      reconciliationStatus: paymentTransactions.reconciliationStatus,
      status: paymentTransactions.status,
      amount: paymentTransactions.netAmount,
      transactionId: paymentTransactions.id,
    })
    .from(paymentTransactions)
    .where(where);