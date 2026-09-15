import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import db from '../config/db.js';
import { journalEntries } from '../models/schema/index.js';
import {
  listChartOfAccounts,
  createChartAccount,
  updateChartAccount,
  deactivateChartAccount,
} from '../services/chartOfAccounts.service.js';
import {
  postJournal,
  reverseJournal,
  voidJournal,
  listJournalEntries,
  getJournalEntryDetail,
  getAccountLedger,
} from '../services/journal.service.js';
import { getTrialBalance, getProfitAndLoss, getBalanceSheet, getCashFlow } from '../services/report.service.js';
import { listPeriods, createPeriod, closePeriod, reopenPeriod, getCurrentPeriod } from '../services/accountingPeriod.service.js';
import { createVendor, listVendors, getVendor, updateVendor, toggleVendor } from '../services/vendor.service.js';
import {
  createPayable,
  listPayables,
  approvePayable,
  payPayable,
  payableAging,
  payableMaintenance,
} from '../services/accountsPayable.service.js';
import {
  listReceivables,
  receivableAging,
  receivableCustomerStatement,
  adjustReceivable,
} from '../services/accountsReceivable.service.js';
import {
  createIncome,
  listIncome,
  createExpense,
  listExpenses,
  approveExpense,
  payExpense,
  updateExpense,
  getIncomeTotal,
  getExpenseTotal,
} from '../services/incomeExpense.service.js';
import { getAccountingOverview } from '../services/accountingDashboard.service.js';
import { createAuditLog, listAuditLogs } from '../services/audit.service.js';
import { listAllUsers, listAllAdmins, getUserWithHistory, addUserCredit } from '../services/user.service.js';
import { toCsv } from './payment.controller.js';

const actor = (req: Request) => ({ actorId: req.admin?.id, ip: req.ip });

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
    const { assertDateNotInClosedPeriod } = await import('../services/accountingPeriod.service.js');
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

export const vendorList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listVendors({ active: q.active, page: q.page ? Number(q.page) : 1, limit: q.limit ? Number(q.limit) : 50 })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const vendorCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const vendor = await createVendor({ ...req.body, createdBy: a.actorId });
    await createAuditLog({ ...a, action: 'vendor.create', entityType: 'vendor', entityId: vendor.id, newValue: { name: vendor.name }, ip: a.ip });
    res.json({ success: true, vendor, message: 'Vendor created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const vendorUpdate = async (req: Request, res: Response) => {
  try {
    const { id, ...patch } = req.body;
    res.json({ success: true, vendor: await updateVendor(Number(id), patch) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const vendorToggle = async (req: Request, res: Response) => {
  try {
    const { id, active } = req.body;
    res.json({ success: true, vendor: await toggleVendor(Number(id), active) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const vendorDetail = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, vendor: await getVendor(Number(req.params.id)) });
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

export const receivableList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listReceivables({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        status: q.status,
        customerId: q.customerId ? Number(q.customerId) : undefined,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const receivableAgingReport = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await receivableAging() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const receivableStatement = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await receivableCustomerStatement(Number(req.params.customerId)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const receivableAdjust = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, mode, amount, reason } = req.body;
    await adjustReceivable(Number(id), mode, amount, reason, a.actorId, a.ip);
    res.json({ success: true, message: mode === 'write_off' ? 'Receivable written off.' : 'Receivable adjusted.' });
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

export const userList = async (_req: Request, res: Response) => {
  try {
    const users = await listAllUsers();
    const admins = await listAllAdmins();
    res.json({ success: true, users, admins, totalCustomers: users.length, totalAdmins: admins.length });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const adminList = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, admins: await listAllAdmins() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const userDetail = async (req: Request, res: Response) => {
  try {
    const data = await getUserWithHistory(Number(req.body.userId));
    if (!data) throw new Error('User not found.');
    res.json({ success: true, ...data });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const userCredit = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { userId, amount } = req.body;
    const user = await addUserCredit(Number(userId), Number(amount));
    await createAuditLog({
      ...a,
      action: 'user.credit.add',
      entityType: 'users',
      entityId: String(userId),
      newValue: { amount: Number(amount), newCredit: user.credit },
      ip: a.ip,
    });
    res.json({ success: true, user, message: 'Credit balance updated.' });
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
      const { getAccountLedger } = await import('../services/journal.service.js');
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