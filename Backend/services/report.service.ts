import { and, asc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { chartOfAccounts, journalEntries, journalEntryLines } from '../models/schema/index.js';
import { seedChartOfAccounts } from './journal.service.js';
import { toNum, sum } from '../utils/money.js';

const postedEntriesWhere = (from?: number, to?: number) => {
  const conditions = [eq(journalEntries.status, 'posted')];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));
  return and(...conditions);
};

export const getAccountBalances = async (from?: number, to?: number) => {
  await seedChartOfAccounts();
  const accounts = await db.query.chartOfAccounts.findMany({ orderBy: (t, { asc }) => [asc(t.code)] });
  const result: { account: (typeof chartOfAccounts.$inferSelect); debit: number; credit: number; balance: number }[] = [];

  for (const account of accounts) {
    const rows = await db
      .select({
        debit: sql<string>`coalesce(sum(${journalEntryLines.debit}),0)`,
        credit: sql<string>`coalesce(sum(${journalEntryLines.credit}),0)`,
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
      .where(and(eq(journalEntryLines.accountId, account.id), postedEntriesWhere(from, to) ?? sql`1=1`));

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
    const account = await db.query.chartOfAccounts.findFirst({ where: sql`lower(${chartOfAccounts.name}) = ${name.toLowerCase()}` });
    if (account) assetAccountIds.push(account.id);
  }

  const where = postedEntriesWhere(from, to);
  const allLines = assetAccountIds.length > 0
    ? await db
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
        .where(and(inArray(journalEntryLines.accountId, assetAccountIds), ...(where ? [where] : [])))
        .orderBy(asc(journalEntries.entryDate))
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
  const conditions = [eq(journalEntries.status, 'posted'), inArray(journalEntryLines.accountId, accountIds)];
  if (from) conditions.push(lte(journalEntries.entryDate, from));
  const rows = await db
    .select({
      debit: sql<string>`coalesce(sum(${journalEntryLines.debit}),0)`,
      credit: sql<string>`coalesce(sum(${journalEntryLines.credit}),0)`,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(...conditions));
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