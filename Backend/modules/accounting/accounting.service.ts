import { eq, sql } from 'drizzle-orm';
import { accountsPayable, chartOfAccounts, paymentTransactions } from '../../database/schema/index.js';
import { toMoney, toNum, sum } from '../../shared/utils/money.js';
import { ACCOUNT_KEYWORDS, ACCOUNT_TYPE_LABELS, DEFAULT_CHART_OF_ACCOUNTS } from '../../shared/constants/finance.constants.js';
import {
  countExpenseRecords,
  countIncomeRecords,
  countJournalEntries,
  countJournalLinesForAccount,
  countPayables,
  findAllAccounts,
  findAccountByCode,
  findAccountById,
  findAccountByName,
  findAccountByNameInsensitive,
  findAccountsByKeyword,
  findAuditLogs,
  findClosedPeriods,
  findExpenseRecordById,
  findExpenseRecords,
  findIncomeRecords,
  findJournalEntries,
  findJournalEntryById,
  findJournalLinesByEntryId,
  findOpenPeriodOverlapping,
  findOpenPeriodsOrderedByStartAsc,
  findPayableById,
  findPayables,
  findPaymentAccountById,
  findPaymentsForPayable,
  findPeriodById,
  findPeriodsOrderedByStartDesc,
  findVendorById,
  getJournalLineTotalsForAccount,
  getLineSumsForAccount,
  getOpeningCashBalanceAggregate,
  insertAccountingPeriod,
  insertAuditLog,
  insertChartAccount,
  insertExpenseRecord,
  insertIncomeRecord,
  insertJournalEntry,
  insertJournalEntryLines,
  insertPayable,
  insertPayablePayment,
  listAllPayables,
  selectCashFlowLines,
  selectLedgerRows,
  selectReconciliationRows,
  sumExpenseRecords,
  sumIncomeRecords,
  transaction,
  updateChartAccountById,
  updateExpenseRecordById,
  updateIncomeRecordById,
  updateJournalEntryById,
  updatePayableById,
  updatePeriodById,
  type DbClient,
} from './accounting.repository.js';
import type {
  AuditLogInput,
  ChartAccountInput,
  ExpenseInput,
  ExpenseListOpts,
  IncomeInput,
  IncomeListOpts,
  JournalEntryInput,
  JournalListOpts,
  PayableInput,
  PayableListOpts,
  PayablePayInput,
  PeriodInput,
  PostJournalResult,
} from './accounting.types.js';

const linesBalance = (lines: JournalEntryInput['lines']) =>
  Math.round(lines.reduce((s, l) => s + (toNum(l.debit) - toNum(l.credit)), 0) * 100) / 100;

export const listChartOfAccounts = async () => {
  await seedChartOfAccounts();
  const rows = await findAllAccounts();
  const enriched = await Promise.all(rows.map(async (a) => {
    const lineCount = await countJournalLinesForAccount(a.id);
    const totals = await getJournalLineTotalsForAccount(a.id);
    const debit = toNum(totals[0]?.debit);
    const credit = toNum(totals[0]?.credit);
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
  const existingCode = await findAccountByCode(normalized);
  if (existingCode) throw new Error('An account with this code already exists.');
  const existingName = await findAccountByNameInsensitive(input.name.trim());
  if (existingName) throw new Error('An account with this name already exists.');

  const now = Date.now();
  const [account] = await insertChartAccount({
    code: normalized,
    name: input.name.trim(),
    accountType: input.accountType,
    normalBalance: input.normalBalance ?? 'debit',
    parentId: input.parentId ?? null,
    description: input.description ?? '',
    createdBy: actorId ?? null,
    createdAt: now,
    updatedAt: now,
  });

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
  const account = await findAccountById(id);
  if (!account) throw new Error('Account not found.');
  const cleaned = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined && v !== null));
  await updateChartAccountById(id, { ...cleaned, updatedAt: Date.now() });
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'chart_of_accounts.update',
    entityType: 'chart_of_accounts',
    entityId: id,
    previousValue: { name: account.name, accountType: account.accountType },
    newValue: { ...cleaned },
  });
  return findAccountById(id);
};

export const deactivateChartAccount = async (id: number, actorId?: number) => {
  const account = await findAccountById(id);
  if (!account) throw new Error('Account not found.');
  const usage = await countJournalLinesForAccount(id);
  if (Number(usage[0]?.count ?? 0) > 0) {
    throw new Error('Account is used by journal entries and cannot be deleted. Deactivate it instead.');
  }
  await updateChartAccountById(id, { active: false, updatedAt: Date.now() });
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'chart_of_accounts.deactivate',
    entityType: 'chart_of_accounts',
    entityId: id,
  });
  return findAccountById(id);
};

export const getAccountById = async (id: number) => {
  const account = await findAccountById(id);
  if (!account) throw new Error(`Chart of account #${id} not found.`);
  return account;
};

export const findAccount = async (query: string, client?: DbClient) => {
  if (!query || !query.trim()) return null;
  const trimmed = query.trim();
  const byCode = await findAccountByCode(trimmed, client);
  if (byCode) return byCode;
  const byName = await findAccountByName(trimmed, client);
  if (byName) return byName;
  const keywords = ACCOUNT_KEYWORDS[trimmed] ?? [];
  for (const keyword of keywords) {
    const accounts = await findAccountsByKeyword(keyword, client);
    if (accounts.length > 0) return accounts[0];
  }
  return null;
};

export const ensureAccountExists = async (name: string, client?: DbClient) => {
  const existing = await findAccount(name, client);
  if (existing) return existing;
  const def = DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.name === name);
  if (!def) throw new Error(`Unknown default account: ${name}`);
  const conflict = await findAccountByCode(def.code, client);
  const code = conflict ? `${def.code}-${Date.now() % 1000}` : def.code;
  const inserted = await insertChartAccount(
    {
      code,
      name: def.name,
      accountType: def.type,
      normalBalance: def.normalBalance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    client
  );
  return inserted[0];
};

export const seedChartOfAccounts = async () => {
  let created = 0;
  for (const def of DEFAULT_CHART_OF_ACCOUNTS) {
    const existing = await findAccountByCode(def.code);
    if (!existing) {
      await insertChartAccount({
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
    await assertDateNotInClosedPeriod(input.entryDate);
  }

  const now = Date.now();
  const entryNumber = `JE-${input.entryDate}-${Math.floor(Math.random() * 100000)}`;

  const run = async (exec: DbClient) => {
    const [entry] = await insertJournalEntry(
      {
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
      },
      exec
    );

    const lineValues = input.lines.map((l) => ({
      journalEntryId: entry.id,
      accountId: l.accountId,
      debit: toMoney(l.debit ?? 0),
      credit: toMoney(l.credit ?? 0),
      description: l.description ?? '',
      costCenter: l.costCenter ?? '',
    }));
    const lines = await insertJournalEntryLines(lineValues, exec);
    await updateJournalEntryById(entry.id, { entryNumber: `JE-${entry.id}` }, exec);
    return { entry: { ...entry, entryNumber: `JE-${entry.id}` }, lines };
  };

  if (client) return run(client);
  return transaction(async (tx) => run(tx));
};

export const updateEntryNumber = async (id: number) => {
  await updateJournalEntryById(id, { entryNumber: `JE-${id}` });
};

export const reverseJournal = async (id: number, reason = '', actorId?: number) => {
  const entry = await findJournalEntryById(id);
  if (!entry) throw new Error('Journal entry not found.');
  if (entry.status !== 'posted') throw new Error('Only posted entries can be reversed.');

  const lines = await findJournalLinesByEntryId(id);
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

  await updateJournalEntryById(id, { status: 'reversed', updatedAt: now });
  return reversal;
};

export const voidJournal = async (id: number) => {
  const entry = await findJournalEntryById(id);
  if (!entry) throw new Error('Journal entry not found.');
  if (entry.status !== 'draft') throw new Error('Only draft entries can be voided.');
  await updateJournalEntryById(id, { status: 'voided', updatedAt: Date.now() });
  return entry;
};

export const listJournalEntries = async (opts: JournalListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const entries = await findJournalEntries({ from: opts.from, to: opts.to, limit, offset: (page - 1) * limit });
  const counts = await countJournalEntries({ from: opts.from, to: opts.to });
  const items = await Promise.all(
    entries.map(async (e) => {
      const lines = await findJournalLinesByEntryId(e.id);
      return { ...e, _id: String(e.id), lines };
    })
  );
  return { items, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getJournalEntryDetail = async (id: number) => {
  const entry = await findJournalEntryById(id);
  if (!entry) throw new Error('Journal entry not found.');
  const lines = await findJournalLinesByEntryId(id);
  const accountMap: Record<number, (typeof chartOfAccounts.$inferSelect) | null> = {};
  const lineDetails = await Promise.all(
    lines.map(async (l) => {
      if (!accountMap[l.accountId]) {
        accountMap[l.accountId] = (await findAccountById(l.accountId)) ?? null;
      }
      return { ...l, account: accountMap[l.accountId] };
    })
  );
  return { ...entry, _id: String(entry.id), lines: lineDetails };
};

export const getAccountLedger = async (accountId: number, from?: number, to?: number) => {
  const rows = await selectLedgerRows(accountId, from, to);
  let balance = 0;
  return rows.map((r) => {
    const debit = toNum(r.debit);
    const credit = toNum(r.credit);
    balance = Math.round((balance + debit - credit) * 100) / 100;
    return { ...r, _id: String(r.lineId), debit, credit, runningBalance: balance };
  });
};

export const getAccountBalances = async (from?: number, to?: number) => {
  await seedChartOfAccounts();
  const accounts = await findAllAccounts();
  const result: { account: (typeof chartOfAccounts.$inferSelect); debit: number; credit: number; balance: number }[] = [];

  for (const account of accounts) {
    const rows = await getLineSumsForAccount(account.id, from, to);
    const debit = toNum(rows[0]?.debit);
    const credit = toNum(rows[0]?.credit);
    result.push({
      account,
      debit,
      credit,
      balance: account.normalBalance === 'debit' ? Math.round((debit - credit) * 100) / 100 : Math.round((credit - debit) * 100) / 100,
    });
  }
  return result;
};

export const getTrialBalance = async (from?: number, to?: number) => {
  const balances = await getAccountBalances(from, to);
  const rows = balances
    .filter((b) => b.account.active)
    .map((b) => ({
      accountId: b.account.id,
      code: b.account.code,
      name: b.account.name,
      type: b.account.accountType,
      normalBalance: b.account.normalBalance,
      debit: b.debit,
      credit: b.credit,
      balance: b.balance,
    }));
  const totalDebit = Math.round(sum(rows.map((r) => r.debit)) * 100) / 100;
  const totalCredit = Math.round(sum(rows.map((r) => r.credit)) * 100) / 100;
  return {
    rows,
    totalDebit,
    totalCredit,
    balanced: Math.abs(totalDebit - totalCredit) < 0.005,
    difference: Math.round((totalDebit - totalCredit) * 100) / 100,
  };
};

export const getProfitAndLoss = async (from?: number, to?: number, compareFrom?: number, compareTo?: number) => {
  const balances = await getAccountBalances(from, to);
  const compareBalances = compareFrom && compareTo ? await getAccountBalances(compareFrom, compareTo) : null;

  const select = (type: string) =>
    balances.filter((b) => b.account.accountType === type && b.account.active);

  const revenueRows = select('revenue').map((b) => ({
    ...b,
    amount: b.account.normalBalance === 'credit' ? b.balance : -b.balance,
  }));
  const cogsRows = select('cogs').map((b) => ({ ...b, amount: b.account.normalBalance === 'debit' ? b.balance : -b.balance }));
  const expenseRows = select('expense').map((b) => ({ ...b, amount: b.account.normalBalance === 'debit' ? b.balance : -b.balance }));

  const revenue = Math.round(sum(revenueRows.map((r) => r.amount)) * 100) / 100;
  const cogs = Math.round(sum(cogsRows.map((r) => r.amount)) * 100) / 100;
  const expenses = Math.round(sum(expenseRows.map((r) => r.amount)) * 100) / 100;
  const grossProfit = Math.round((revenue - cogs) * 100) / 100;
  const netProfit = Math.round((grossProfit - expenses) * 100) / 100;

  let comparison: {
    revenue: number;
    cogs: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  } | null = null;
  if (compareBalances) {
    const compRevenue = Math.round(sum(compareBalances.filter((b) => b.account.accountType === 'revenue' && b.account.active).map((b) => (b.account.normalBalance === 'credit' ? b.balance : -b.balance))) * 100) / 100;
    const compCogs = Math.round(sum(compareBalances.filter((b) => b.account.accountType === 'cogs' && b.account.active).map((b) => (b.account.normalBalance === 'debit' ? b.balance : -b.balance))) * 100) / 100;
    const compExpenses = Math.round(sum(compareBalances.filter((b) => b.account.accountType === 'expense' && b.account.active).map((b) => (b.account.normalBalance === 'debit' ? b.balance : -b.balance))) * 100) / 100;
    comparison = {
      revenue: compRevenue,
      cogs: compCogs,
      expenses: compExpenses,
      grossProfit: Math.round((compRevenue - compCogs) * 100) / 100,
      netProfit: Math.round((compRevenue - compCogs - compExpenses) * 100) / 100,
    };
  }

  return {
    revenueRows,
    cogsRows,
    expenseRows,
    revenue,
    cogs,
    expenses,
    grossProfit,
    netProfit,
    comparison,
    range: { from: from ?? null, to: to ?? null },
    compareRange: compareFrom && compareTo ? { from: compareFrom, to: compareTo } : null,
  };
};

export const getBalanceSheet = async (asOf?: number) => {
  const balances = await getAccountBalances(undefined, asOf ?? Date.now());
  const currentAssets = Math.round(sum(balances.filter((b) => b.account.active && b.account.accountType === 'asset' && b.account.code.startsWith('1')).map((b) => b.balance)) * 100) / 100;
  const fixedAssets = Math.round(sum(balances.filter((b) => b.account.active && b.account.accountType === 'asset' && (b.account.code.startsWith('13') || b.account.code.startsWith('120'))).map((b) => b.balance)) * 100) / 100;
  const totalAssets = Math.round(sum(balances.filter((b) => b.account.active && b.account.accountType === 'asset').map((b) => b.balance)) * 100) / 100;
  const totalLiabilities = Math.round(sum(balances.filter((b) => b.account.active && b.account.accountType === 'liability').map((b) => b.balance)) * 100) / 100;
  const totalEquity = Math.round(sum(balances.filter((b) => b.account.active && b.account.accountType === 'equity').map((b) => b.balance)) * 100) / 100;

  const pnl = await getProfitAndLoss(undefined, asOf ?? Date.now());
  const currentPeriodProfit = pnl.netProfit;

  const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity + currentPeriodProfit) * 100) / 100;
  const balanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.005;

  const assetRows = balances.filter((b) => b.account.active && b.account.accountType === 'asset').map((b) => ({ ...b }));
  const liabilityRows = balances.filter((b) => b.account.active && b.account.accountType === 'liability').map((b) => ({ ...b }));
  const equityRows = balances.filter((b) => b.account.active && b.account.accountType === 'equity').map((b) => ({ ...b }));

  return {
    assets: { current: currentAssets, fixed: fixedAssets, total: totalAssets, rows: assetRows },
    liabilities: { total: totalLiabilities, rows: liabilityRows },
    equity: { total: totalEquity, rows: equityRows },
    currentPeriodProfit,
    totalLiabilitiesAndEquity,
    balanced,
    difference: Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100,
  };
};

export const getCashFlow = async (from?: number, to?: number) => {
  const bankAccounts = [
    'Cash in Hand',
    'Bank Account',
    'eSewa Wallet',
    'Khalti Wallet',
  ];
  const assetAccountIds: number[] = [];
  for (const name of bankAccounts) {
    const account = await findAccountByNameInsensitive(name);
    if (account) assetAccountIds.push(account.id);
  }

  const allLines = assetAccountIds.length > 0
    ? await selectCashFlowLines(assetAccountIds, from, to)
    : [];

  const opening = openingCashBalance(assetAccountIds, from);

  let inflows = 0;
  let outflows = 0;
  for (const line of allLines) {
    const debit = toNum(line.debit);
    const credit = toNum(line.credit);
    if (debit > 0) inflows = Math.round((inflows + debit) * 100) / 100;
    if (credit > 0) outflows = Math.round((outflows + credit) * 100) / 100;
  }

  const categories = categorizeCashFlow(allLines);

  return {
    operating: { inflows: sum(categories.operating.inflows), outflows: sum(categories.operating.outflows), net: Math.round((sum(categories.operating.inflows) - sum(categories.operating.outflows)) * 100) / 100 },
    investing: { inflows: sum(categories.investing.inflows), outflows: sum(categories.investing.outflows), net: Math.round((sum(categories.investing.inflows) - sum(categories.investing.outflows)) * 100) / 100 },
    financing: { inflows: sum(categories.financing.inflows), outflows: sum(categories.financing.outflows), net: Math.round((sum(categories.financing.inflows) - sum(categories.financing.outflows)) * 100) / 100 },
    totalInflows: inflows,
    totalOutflows: outflows,
    netCash: Math.round((inflows - outflows) * 100) / 100,
    openingBalance: await opening,
    closingBalance: (await opening) + Math.round((inflows - outflows) * 100) / 100,
  };
};

const openingCashBalance = async (accountIds: number[], from?: number) => {
  if (accountIds.length === 0) return 0;
  const rows = await getOpeningCashBalanceAggregate(accountIds, from);
  const debit = toNum(rows[0]?.debit);
  const credit = toNum(rows[0]?.credit);
  return Math.round((debit - credit) * 100) / 100;
};

const categorizeCashFlow = (lines: { referenceType: string; debit: number | string; credit: number | string }[]) => {
  const categories = {
    operating: { inflows: [] as number[], outflows: [] as number[] },
    investing: { inflows: [] as number[], outflows: [] as number[] },
    financing: { inflows: [] as number[], outflows: [] as number[] },
  };
  const financingRefs = ['owner_capital', 'owner_drawings', 'equity', 'loan', 'capital'];
  for (const line of lines) {
    const ref = (line.referenceType || '').toLowerCase();
    const amount = toNum(line.debit) + toNum(line.credit);
    if (amount === 0) continue;
    const group = financingRefs.some((f) => ref.includes(f)) ? categories.financing : investingRefs(line) ? categories.investing : categories.operating;
    if (toNum(line.debit) > 0) group.inflows.push(toNum(line.debit));
    if (toNum(line.credit) > 0) group.outflows.push(toNum(line.credit));
  }
  return categories;
};

const investingRefs = (line: { referenceType: string }) => {
  const ref = (line.referenceType || '').toLowerCase();
  return ref.includes('equipment') || ref.includes('asset_purchase') || ref.includes('fixed_asset');
};

export const periodSnapshot = async (from?: number, to?: number) => {
  const balances = await getAccountBalances(from, to);
  const sumByType = (...types: string[]) =>
    Math.round(sum(balances.filter((b) => b.account.active && types.includes(b.account.accountType)).map((b) => b.balance)) * 100) / 100;

  const pnl = await getProfitAndLoss(from, to);

  const cashAndBank = balances
    .filter((b) => b.account.active && b.account.accountType === 'asset' && ['Cash in Hand', 'Bank Account'].includes(b.account.name))
    .map((b) => ({ accountId: b.account.id, name: b.account.name, balance: b.balance }));
  const wallets = balances
    .filter((b) => b.account.active && b.account.accountType === 'asset' && ['eSewa Wallet', 'Khalti Wallet'].includes(b.account.name))
    .map((b) => ({ accountId: b.account.id, name: b.account.name, balance: b.balance }));
  const providerReceivables = balances
    .filter((b) => b.account.active && b.account.accountType === 'asset' && b.account.name === 'Card Gateway Receivable')
    .map((b) => ({ accountId: b.account.id, name: b.account.name, balance: b.balance }));
  const receivables = sumByType('asset') > 0 ? balances.filter((b) => b.account.active && b.account.name === 'Accounts Receivable').map((b) => b.balance)[0] ?? 0 : 0;

  return {
    totalIncome: pnl.revenue,
    totalExpenses: pnl.expenses,
    grossProfit: pnl.grossProfit,
    netProfit: pnl.netProfit,
    totalReceived: pnl.revenue,
    totalPaid: pnl.expenses,
    cashAndBank,
    cashBalance: sum(cashAndBank.map((c) => c.balance)),
    bankBalance: cashAndBank[1]?.balance ?? cashAndBank[0]?.balance ?? 0,
    walletBalances: wallets,
    providerReceivables,
    receivablesBalance: receivables,
    payablesBalance: sum(balances.filter((b) => b.account.active && b.account.accountType === 'liability' && b.account.name === 'Accounts Payable').map((b) => b.balance)),
    assets: sumByType('asset'),
    liabilities: sumByType('liability'),
    equity: sumByType('equity'),
    taxPayable: balances.filter((b) => b.account.active && b.account.name === 'Tax Payable').map((b) => b.balance)[0] ?? 0,
    unreconciled: 0,
    range: { from: from ?? null, to: to ?? null },
  };
};

export const listPeriods = async () => {
  const rows = await findPeriodsOrderedByStartDesc();
  return rows.map((p) => ({ ...p, _id: String(p.id) }));
};

export const createPeriod = async (input: PeriodInput) => {
  const overlap = await findOpenPeriodOverlapping(input.endDate);
  if (overlap) throw new Error('Period overlaps with the current open period.');

  const [period] = await insertAccountingPeriod({
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'open',
    createdAt: Date.now(),
  });
  return { ...period, _id: String(period.id) };
};

export const closePeriod = async (id: number, actorId?: number) => {
  const period = await findPeriodById(id);
  if (!period) throw new Error('Period not found.');
  if (period.status !== 'open') throw new Error('Only open periods can be closed.');
  await updatePeriodById(id, { status: 'closed', closedBy: actorId ?? null, closedAt: Date.now() });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'accounting.period_close',
    entityType: 'accounting_period',
    entityId: id,
    newValue: { name: period.name, startDate: period.startDate, endDate: period.endDate },
  });
  return { ...period, status: 'closed' };
};

export const reopenPeriod = async (id: number, actorId?: number) => {
  const period = await findPeriodById(id);
  if (!period) throw new Error('Period not found.');
  if (period.status !== 'closed') throw new Error('Only closed periods can be reopened.');
  await updatePeriodById(id, { status: 'open', closedAt: null, closedBy: null });
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'accounting.period_reopen',
    entityType: 'accounting_period',
    entityId: id,
  });
  return { ...period, status: 'open' };
};

export const getCurrentPeriod = async () => {
  const rows = await findOpenPeriodsOrderedByStartAsc();
  return rows[0] ?? null;
};

export const assertDateNotInClosedPeriod = async (date: number) => {
  const closed = await findClosedPeriods();
  const hit = closed.find((p) => p.startDate <= date && date <= p.endDate);
  if (hit) throw new Error(`Cannot post to '${hit.name}': the accounting period is closed.`);
};

export const createIncome = async (input: IncomeInput, actorId?: number, ip?: string) => {
  const now = Date.now();
  const result = await transaction(async (tx) => {
    const [income] = await insertIncomeRecord(
      {
        date: input.date,
        source: input.source ?? '',
        accountId: input.accountId,
        amount: toMoney(input.amount),
        paymentAccountId: input.paymentAccountId ?? null,
        reference: input.reference ?? '',
        description: input.description ?? '',
        createdBy: actorId ?? null,
        createdAt: now,
      },
      tx
    );

    const revenueAccount = await findAccountById(input.accountId, tx);
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
    await updateIncomeRecordById(income.id, { journalEntryId: journal.entry.id }, tx);
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

export const listIncome = async (opts: IncomeListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const items = await findIncomeRecords({ from: opts.from, to: opts.to, accountId: opts.accountId, limit, offset: (page - 1) * limit });
  const counts = await countIncomeRecords({ from: opts.from, to: opts.to, accountId: opts.accountId });
  const enriched = await Promise.all(items.map(async (i) => {
    const account = await findAccountById(i.accountId);
    return { ...i, _id: String(i.id), amount: toNum(i.amount), accountName: account?.name ?? '' };
  }));
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getIncomeTotal = async (from?: number, to?: number) => {
  const rows = await sumIncomeRecords({ from, to });
  return toNum((rows[0] as unknown as { sum: string }).sum);
};

export const createExpense = async (input: ExpenseInput, actorId?: number, ip?: string) => {
  const now = Date.now();
  const [expense] = await insertExpenseRecord({
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
  });

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

export const listExpenses = async (opts: ExpenseListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const items = await findExpenseRecords({ from: opts.from, to: opts.to, accountId: opts.accountId, paymentStatus: opts.paymentStatus, approvalStatus: opts.approvalStatus, limit, offset: (page - 1) * limit });
  const counts = await countExpenseRecords({ from: opts.from, to: opts.to, accountId: opts.accountId, paymentStatus: opts.paymentStatus, approvalStatus: opts.approvalStatus });
  const enriched = await Promise.all(items.map(async (e) => {
    const account = await findAccountById(e.accountId);
    return { ...e, _id: String(e.id), amount: toNum(e.amount), taxAmount: toNum(e.taxAmount), accountName: account?.name ?? '' };
  }));
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getExpenseTotal = async (from?: number, to?: number) => {
  const rows = await sumExpenseRecords({ from, to });
  return toNum((rows[0] as unknown as { sum: string }).sum);
};

export const approveExpense = async (id: number, approved: boolean, actorId?: number) => {
  const expense = await findExpenseRecordById(id);
  if (!expense) throw new Error('Expense not found.');
  const now = Date.now();

  const result = await transaction(async (tx) => {
    await updateExpenseRecordById(id, { approvalStatus: approved ? 'approved' : 'rejected', approvedBy: actorId ?? null, updatedAt: now }, tx);
    if (approved) {
      const expenseAccount = await findAccountById(expense.accountId, tx);
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
      await updateExpenseRecordById(id, { journalEntryId: journal.entry.id }, tx);
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
  const expense = await findExpenseRecordById(id);
  if (!expense) throw new Error('Expense not found.');
  if (expense.approvalStatus !== 'approved') throw new Error('Expense must be approved before payment.');
  if (expense.paymentStatus === 'paid') throw new Error('Expense is already paid.');
  const now = Date.now();

  const result = await transaction(async (tx) => {
    await updateExpenseRecordById(id, { paymentStatus: 'paid', paymentAccountId, updatedAt: now }, tx);
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
    await updateExpenseRecordById(id, { paymentJournalEntryId: journal.entry.id }, tx);
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
  const expense = await findExpenseRecordById(id);
  if (!expense) throw new Error('Expense not found.');
  const cleaned = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
  );
  if (cleaned.amount) cleaned.amount = toMoney(cleaned.amount as number);
  if (cleaned.taxAmount) cleaned.taxAmount = toMoney(cleaned.taxAmount as number);
  await updateExpenseRecordById(id, { ...cleaned, updatedAt: Date.now() });
  return findExpenseRecordById(id);
};

const ensureDefault = async (name: string) => ensureAccountExists(name);

export const createPayable = async (input: PayableInput) => {
  const now = Date.now();
  const [payable] = await insertPayable({
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
  });

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

export const listPayables = async (opts: PayableListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const items = await findPayables({ from: opts.from, to: opts.to, status: opts.status, vendorId: opts.vendorId, approvalStatus: opts.approvalStatus, limit, offset: (page - 1) * limit });
  const counts = await countPayables({ from: opts.from, to: opts.to, status: opts.status, vendorId: opts.vendorId, approvalStatus: opts.approvalStatus });
  const enriched = await Promise.all(items.map(enrichPayable));
  const totalOutstanding = sum((await listAllPayables()).map((p) => toNum(p.outstandingAmount)));
  return { items: enriched, total: Number(counts[0]?.count ?? 0), page, limit, totalOutstanding };
};

export const enrichPayable = async (p: typeof accountsPayable.$inferSelect) => {
  const vendor = await findVendorById(p.vendorId);
  const payments = await findPaymentsForPayable(p.id);
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
  const rows = await listAllPayables();
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
  const payable = await findPayableById(id);
  if (!payable) throw new Error('Payable not found.');
  await updatePayableById(id, { approvalStatus: approved ? 'approved' : 'rejected', approvedBy: actorId ?? null, updatedAt: Date.now() });
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

export const payPayable = async (input: PayablePayInput) => {
  const payable = await findPayableById(input.payableId);
  if (!payable) throw new Error('Payable not found.');
  if (payable.approvalStatus !== 'approved') throw new Error('Bill must be approved before payment.');
  const outstanding = toNum(payable.outstandingAmount);
  if (toNum(input.amount) > outstanding + 0.001) {
    throw new Error(`Payment exceeds outstanding balance of ${outstanding.toFixed(2)}.`);
  }
  const paymentAccount = await findPaymentAccountById(input.paymentAccountId);
  if (!paymentAccount) throw new Error('Payment account not found.');
  const now = Date.now();

  const result = await transaction(async (tx) => {
    const [pay] = await insertPayablePayment(
      {
        payableId: input.payableId,
        paymentAccountId: input.paymentAccountId,
        amount: toMoney(input.amount),
        reference: input.reference ?? '',
        paidAt: now,
        createdBy: input.createdBy ?? null,
        createdAt: now,
      },
      tx
    );

    const newPaid = Math.round((toNum(payable.paidAmount) + toNum(input.amount)) * 100) / 100;
    const newOutstanding = Math.round((outstanding - toNum(input.amount)) * 100) / 100;
    const status = newOutstanding <= 0 ? 'paid' : 'partially_paid';
    await updatePayableById(input.payableId, { paidAmount: toMoney(newPaid), outstandingAmount: toMoney(Math.max(newOutstanding, 0)), status, updatedAt: now }, tx);

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
  const vend = vendorId ? await findVendorById(vendorId) : null;
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
  const payable = await findPayableById(id);
  if (!payable) throw new Error('Payable not found.');
  const outstanding = toNum(payable.outstandingAmount);
  const now = Date.now();

  await transaction(async (tx) => {
    if (mode === 'settle') {
      await updatePayableById(id, { paidAmount: toMoney(outstanding + toNum(payable.paidAmount)), outstandingAmount: '0', status: 'paid', updatedAt: now }, tx);
    } else {
      await updatePayableById(id, { outstandingAmount: '0', status: 'written_off', notes: reason, updatedAt: now }, tx);
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

export const createAuditLog = async (input: AuditLogInput) => {
  await insertAuditLog({
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? '',
    action: input.action,
    entityType: input.entityType,
    entityId: String(input.entityId ?? ''),
    previousValue: input.previousValue ?? {},
    newValue: input.newValue ?? {},
    reason: input.reason ?? '',
    ip: input.ip ?? '',
    createdAt: Date.now(),
  });
};

export const listAuditLogs = async (entityType?: string, entityId?: string | number) => {
  const logs = await findAuditLogs(entityType, entityId);
  return logs.map((l) => ({ ...l, _id: String(l.id) }));
};

export const getAccountingOverview = async (from?: number, to?: number) => {
  const snapshot = await periodSnapshot(from, to);
  const previousRange = from !== undefined && to !== undefined ? { from: from - (to - from), to: from - 1 } : null;
  const previous = previousRange ? await periodSnapshot(previousRange.from, previousRange.to) : null;
  const reconciliation = await reconciliationDashboard();
  return {
    ...snapshot,
    unreconciled: reconciliation.unreconciledAmount,
    previous: previous
      ? {
          totalIncome: previous.totalIncome,
          totalExpenses: previous.totalExpenses,
          netProfit: previous.netProfit,
        }
      : null,
  };
};

const reconciliationDashboard = async (accountId?: number) => {
  let condition = sql`1=1`;
  if (accountId) {
    condition = eq(paymentTransactions.paymentAccountId, accountId);
  }
  const rows = await selectReconciliationRows(condition);

  const result = {
    reconciled: 0,
    unreconciled: 0,
    matched: 0,
    partial: 0,
    reconciledAmount: 0,
    unreconciledAmount: 0,
  };
  for (const r of rows) {
    const amount = toNum(r.amount);
    if (r.reconciliationStatus === 'reconciled') {
      result.reconciled += 1;
      result.reconciledAmount = Math.round((result.reconciledAmount + amount) * 100) / 100;
    } else if (r.reconciliationStatus === 'unreconciled') {
      result.unreconciled += 1;
      result.unreconciledAmount = Math.round((result.unreconciledAmount + amount) * 100) / 100;
    } else {
      result[r.reconciliationStatus as 'matched' | 'partial'] += 1;
    }
  }
  return result;
};