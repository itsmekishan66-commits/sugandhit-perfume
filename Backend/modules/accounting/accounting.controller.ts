import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import db from '../../database/client.js';
import { journalEntries } from '../../database/schema/index.js';
import {
  approveExpense,
  approvePayable,
  assertDateNotInClosedPeriod,
  closePeriod,
  createChartAccount,
  createExpense,
  createIncome,
  createPayable,
  createPeriod,
  deactivateChartAccount,
  getAccountLedger,
  getAccountingOverview,
  getBalanceSheet,
  getCashFlow,
  getCurrentPeriod,
  getExpenseTotal,
  getIncomeTotal,
  getJournalEntryDetail,
  getProfitAndLoss,
  getTrialBalance,
  listAuditLogs,
  listChartOfAccounts,
  listExpenses,
  listIncome,
  listJournalEntries,
  listPayables,
  listPeriods,
  payableAging,
  payableMaintenance,
  payExpense,
  payPayable,
  postJournal,
  reopenPeriod,
  reverseJournal,
  updateChartAccount,
  updateExpense,
  voidJournal,
  createAuditLog,
} from './accounting.service.js';

const actor = (req: Request) => ({ actorId: req.admin?.id, ip: req.ip });

export const toCsv = (rows: Record<string, unknown>[]) => {
  if (rows.length === 0) return 'No data';
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(','));
  }
  return lines.join('\n');
};

export const overview = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      data: await getAccountingOverview(from ? Number(from) : undefined, to ? Number(to) : undefined),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const chartList = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, accounts: await listChartOfAccounts() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const chartCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, account: await createChartAccount(req.body, a.actorId), message: 'Account created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const chartUpdate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, ...patch } = req.body;
    res.json({ success: true, account: await updateChartAccount(Number(id), patch, a.actorId) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const chartDeactivate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, account: await deactivateChartAccount(Number(req.params.id), a.actorId), message: 'Account deactivated.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const journalList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listJournalEntries({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const journalDetail = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, journal: await getJournalEntryDetail(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const journalCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { entryDate, referenceType, referenceId, description, lines } = req.body;
    const posted = await postJournal({
      entryDate,
      referenceType,
      referenceId,
      description,
      lines,
      createdBy: a.actorId,
      status: 'draft',
    });
    await createAuditLog({
      ...a,
      action: 'journal.create',
      entityType: 'journal_entry',
      entityId: posted.entry.id,
      newValue: { entryNumber: posted.entry.entryNumber, description },
      ip: a.ip,
    });
    res.json({ success: true, journal: posted, message: 'Draft journal entry created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const journalPost = async (req: Request, res: Response) => {
  try {
    const entry = await getJournalEntryDetail(Number(req.body.id));
    if (entry.status !== 'draft') throw new Error('Only draft entries can be posted.');
    const total = Math.round(entry.lines.reduce((a, l) => a + (Number(l.debit) - Number(l.credit)), 0) * 100) / 100;
    if (total !== 0) throw new Error(`Unbalanced journal entry (${total.toFixed(2)}).`);
    await assertDateNotInClosedPeriod(Number(entry.entryDate));
    await db.update(journalEntries).set({ status: 'posted', postingDate: Date.now(), updatedAt: Date.now() }).where(eq(journalEntries.id, Number(req.body.id)));

    const a = actor(req);
    await createAuditLog({
      ...a,
      action: 'journal.post',
      entityType: 'journal_entry',
      entityId: req.body.id,
      newValue: { status: 'posted' },
      ip: a.ip,
    });
    res.json({ success: true, journal: await getJournalEntryDetail(Number(req.body.id)), message: 'Journal entry posted.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const journalReverse = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const result = await reverseJournal(Number(req.body.id), req.body.reason, a.actorId);
    await createAuditLog({
      ...a,
      action: 'journal.reverse',
      entityType: 'journal_entry',
      entityId: req.body.id,
      newValue: { reason: req.body.reason, reversalId: result.entry.id },
      reason: req.body.reason,
      ip: a.ip,
    });
    res.json({ success: true, journal: result, message: 'Journal entry reversed.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const journalVoid = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    await voidJournal(Number(req.body.id));
    await createAuditLog({
      ...a,
      action: 'journal.void',
      entityType: 'journal_entry',
      entityId: req.body.id,
      ip: a.ip,
    });
    res.json({ success: true, message: 'Journal entry voided.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const ledger = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    if (!q.accountId) throw new Error('accountId is required.');
    const rows = await getAccountLedger(Number(q.accountId), q.from ? Number(q.from) : undefined, q.to ? Number(q.to) : undefined);
    res.json({ success: true, rows });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const trialBalance = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({ success: true, data: await getTrialBalance(q.from ? Number(q.from) : undefined, q.to ? Number(q.to) : undefined) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const profitLoss = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      data: await getProfitAndLoss(
        q.from ? Number(q.from) : undefined,
        q.to ? Number(q.to) : undefined,
        q.compareFrom ? Number(q.compareFrom) : undefined,
        q.compareTo ? Number(q.compareTo) : undefined
      ),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const balanceSheet = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({ success: true, data: await getBalanceSheet(q.asOf ? Number(q.asOf) : undefined) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const cashFlow = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({ success: true, data: await getCashFlow(q.from ? Number(q.from) : undefined, q.to ? Number(q.to) : undefined) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const periodList = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, periods: await listPeriods(), current: await getCurrentPeriod() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const periodCreate = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, period: await createPeriod(req.body), message: 'Period created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const periodClose = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    await closePeriod(Number(req.body.id), a.actorId);
    res.json({ success: true, message: 'Period closed.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const periodReopen = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    await reopenPeriod(Number(req.body.id), a.actorId);
    res.json({ success: true, message: 'Period reopened.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const payableList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listPayables({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        status: q.status,
        vendorId: q.vendorId ? Number(q.vendorId) : undefined,
        approvalStatus: q.approvalStatus,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const payableCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const payable = await createPayable({ ...req.body, createdBy: a.actorId });
    res.json({ success: true, payable, message: 'Bill created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const payableApprove = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, approved } = req.body;
    await approvePayable(Number(id), approved, a.actorId);
    res.json({ success: true, message: approved ? 'Bill approved.' : 'Bill rejected.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const payablePay = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    await payPayable({ ...req.body, createdBy: a.actorId, ip: a.ip });
    res.json({ success: true, message: 'Bill payment recorded.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const payableAgingReport = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await payableAging() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const payableMaintain = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, mode, reason } = req.body;
    await payableMaintenance(Number(id), mode, reason, a.actorId);
    res.json({ success: true, message: mode === 'settle' ? 'Bill settled.' : 'Bill written off.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const incomeCreateController = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const income = await createIncome(req.body, a.actorId, a.ip);
    res.json({ success: true, income, message: 'Income recorded and journal posted.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const incomeListController = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listIncome({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        accountId: q.accountId ? Number(q.accountId) : undefined,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const incomeTotals = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const from = q.from ? Number(q.from) : undefined;
    const to = q.to ? Number(q.to) : undefined;
    res.json({ success: true, total: await getIncomeTotal(from, to), range: { from: from ?? null, to: to ?? null } });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const expenseCreateController = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const expense = await createExpense(req.body, a.actorId, a.ip);
    res.json({ success: true, expense, message: 'Expense created (pending approval).' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const expenseListController = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listExpenses({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        accountId: q.accountId ? Number(q.accountId) : undefined,
        paymentStatus: q.paymentStatus,
        approvalStatus: q.approvalStatus,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const expenseTotals = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const from = q.from ? Number(q.from) : undefined;
    const to = q.to ? Number(q.to) : undefined;
    res.json({ success: true, total: await getExpenseTotal(from, to) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const expenseApproveController = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, approved } = req.body;
    await approveExpense(Number(id), approved, a.actorId);
    res.json({ success: true, message: approved ? 'Expense approved and journal posted.' : 'Expense rejected.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const expensePayController = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, paymentAccountId } = req.body;
    await payExpense(Number(id), Number(paymentAccountId), a.actorId, a.ip);
    res.json({ success: true, message: 'Expense marked as paid.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const expenseUpdateController = async (req: Request, res: Response) => {
  try {
    const { id, ...patch } = req.body;
    res.json({ success: true, expense: await updateExpense(Number(id), patch) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const auditableExport = async (req: Request, res: Response) => {
  try {
    const { type } = req.body as { type?: string };
    const rows: Record<string, unknown>[] = [];
    if (type === 'journal') {
      const data = await listJournalEntries({ page: 1, limit: 10000 });
      for (const j of data.items) rows.push({ id: j.id, entryNumber: j.entryNumber, entryDate: j.entryDate, description: j.description, referenceType: j.referenceType, status: j.status });
    } else if (type === 'ledger') {
      const { accountId } = req.body as { accountId?: string };
      if (accountId) rows.push(...(await getAccountLedger(Number(accountId))));
    } else if (type === 'trial_balance') {
      rows.push({ ...(await getTrialBalance()) });
    } else if (type === 'profit_loss') {
      rows.push({ ...(await getProfitAndLoss()) });
    } else if (type === 'balance_sheet') {
      rows.push({ ...(await getBalanceSheet()) });
    } else if (type === 'cash_flow') {
      rows.push({ ...(await getCashFlow()) });
    } else if (type === 'receivables') {
      const { listReceivables } = await import('../customers/customers.service.js');
      const data = await listReceivables({ page: 1, limit: 10000 });
      rows.push(...data.items);
    } else if (type === 'payables') {
      const data = await listPayables({ page: 1, limit: 10000 });
      rows.push(...data.items);
    } else if (type === 'income') {
      const data = await listIncome({ page: 1, limit: 10000 });
      rows.push(...data.items);
    } else if (type === 'expenses') {
      const data = await listExpenses({ page: 1, limit: 10000 });
      rows.push(...data.items);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=accounting-export.csv');
    res.status(200).send(toCsv(rows));
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const auditList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const logs = await listAuditLogs(q.entityType, q.entityId ? Number(q.entityId) : undefined);
    res.json({ success: true, logs, total: logs.length });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};