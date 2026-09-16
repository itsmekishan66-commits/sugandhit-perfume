import type { Request, Response } from 'express';
import {
  createPaymentAccount,
  listPaymentAccounts,
  getPaymentAccount,
  updatePaymentAccount,
  deactivatePaymentAccount,
  getPaymentAccountLedger,
  recordManualPayment,
  processWebhookEvent,
  listTransactions,
  getTransaction,
  updateTransactionStatus,
  markReconciled,
  createRefund,
  approveRefund,
  listRefunds,
  createReconciliation,
  listReconciliations,
  getReconciliation,
  addReconciliationItem,
  matchReconciliationItem,
  lockReconciliation,
  reconciliationDashboard,
  getPaymentOverview,
  getPaymentChannelReport,
  getLinkStatus,
} from './payments.service.js';
import { createAuditLog } from '../accounting/accounting.service.js';

const actor = (req: Request) => ({ actorId: req.admin?.id, ip: req.ip });

export const overview = async (req: Request, res: Response) => {
  try {
    const { from, to, channel, status, accountId } = req.query as Record<string, string | undefined>;
    const data = await getPaymentOverview({
      from: from ? Number(from) : undefined,
      to: to ? Number(to) : undefined,
      channel,
      status,
      accountId: accountId ? Number(accountId) : undefined,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const channelReport = async (req: Request, res: Response) => {
  try {
    const { from, to, accountId } = req.query as Record<string, string | undefined>;
    const rows = await getPaymentChannelReport({
      from: from ? Number(from) : undefined,
      to: to ? Number(to) : undefined,
      accountId: accountId ? Number(accountId) : undefined,
    });
    res.json({ success: true, rows });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const linkStatus = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getLinkStatus() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const listAccounts = async (req: Request, res: Response) => {
  try {
    const { active, type } = req.query as Record<string, string | undefined>;
    res.json({ success: true, accounts: await listPaymentAccounts({ active, type }) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const getAccount = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, account: await getPaymentAccount(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const account = await createPaymentAccount({ ...req.body, createdBy: a.actorId });
    await createAuditLog({
      ...a,
      action: 'payment_account.create',
      entityType: 'payment_account',
      entityId: account.id,
      newValue: { name: account.name, accountType: account.accountType },
      ip: a.ip,
    });
    res.json({ success: true, account, message: 'Payment account created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, ...patch } = req.body;
    const account = await updatePaymentAccount(Number(id), patch, a.actorId);
    await createAuditLog({
      ...a,
      action: 'payment_account.update',
      entityType: 'payment_account',
      entityId: id,
      newValue: { name: account.name, active: account.active },
      ip: a.ip,
    });
    res.json({ success: true, account });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const deactivateAccount = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const account = await deactivatePaymentAccount(Number(req.params.id), a.actorId);
    await createAuditLog({
      ...a,
      action: 'payment_account.deactivate',
      entityType: 'payment_account',
      entityId: String(req.params.id),
      newValue: { active: false },
      ip: a.ip,
    });
    res.json({ success: true, account, message: 'Payment account deactivated.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const accountLedger = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getPaymentAccountLedger(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const transactions = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listTransactions({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        status: q.status,
        channel: q.channel,
        type: q.type,
        accountId: q.accountId ? Number(q.accountId) : undefined,
        customerId: q.customerId ? Number(q.customerId) : undefined,
        orderId: q.orderId ? Number(q.orderId) : undefined,
        reconciliationStatus: q.reconciliationStatus,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const transactionDetail = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, transaction: await getTransaction(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const recordManual = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const txn = await recordManualPayment({ ...req.body, createdBy: a.actorId, ip: a.ip });
    res.json({ success: true, transaction: txn, message: 'Payment recorded.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const webhook = async (req: Request, res: Response) => {
  try {
    const result = await processWebhookEvent(req.body as { provider: string; eventId: string; eventType: string; transactionId?: string; payload?: Record<string, unknown> });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('webhook error', error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const { id, status } = req.body;
    const txn = await updateTransactionStatus(Number(id), status);
    await createAuditLog({
      ...a,
      action: 'payment_transaction.status',
      entityType: 'payment_transaction',
      entityId: id,
      newValue: { status },
      ip: a.ip,
    });
    res.json({ success: true, transaction: txn });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconcileTransaction = async (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    res.json({ success: true, transaction: await markReconciled(Number(id), status) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const refundList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await listRefunds({
        from: q.from ? Number(q.from) : undefined,
        to: q.to ? Number(q.to) : undefined,
        status: q.status,
        page: q.page ? Number(q.page) : 1,
        limit: q.limit ? Number(q.limit) : 50,
      })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const refundCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const refund = await createRefund({ ...req.body, initiatedBy: a.actorId, ip: a.ip });
    res.json({ success: true, refund, message: refund.chargeback ? 'Chargeback filed.' : 'Refund requested.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const refundApprove = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    await approveRefund(Number(req.body.id), !!req.body.approved, a.actorId);
    res.json({ success: true, message: req.body.approved ? 'Refund approved and processed.' : 'Refund rejected.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationList = async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    res.json({ success: true, data: await listReconciliations(accountId) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const rec = await createReconciliation({ ...req.body, createdBy: a.actorId });
    res.json({ success: true, data: rec, message: 'Reconciliation created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationDetail = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getReconciliation(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationAddItem = async (req: Request, res: Response) => {
  try {
    const item = await addReconciliationItem({ ...req.body });
    res.json({ success: true, item, message: 'Statement line added.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationMatch = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const data = await matchReconciliationItem(Number(req.body.itemId), Number(req.body.transactionId), a.actorId);
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationLock = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const data = await lockReconciliation(Number(req.body.id), a.actorId);
    res.json({ success: true, data, message: 'Reconciliation period locked.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const reconciliationSummary = async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    res.json({ success: true, data: await reconciliationDashboard(accountId) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const exportCsv = async (req: Request, res: Response) => {
  try {
    const { type } = req.body as { type?: string };
    const rows: Record<string, unknown>[] = [];
    if (type === 'transactions') {
      const data = await listTransactions({ page: 1, limit: 10000 });
      rows.push(...data.items);
    } else if (type === 'refunds') {
      const data = await listRefunds({ page: 1, limit: 10000 });
      rows.push(...data.items);
    } else if (type === 'channel') {
      const data = await getPaymentChannelReport({});
      rows.push(...data);
    } else if (type === 'reconciliation') {
      const data = await reconciliationDashboard();
      rows.push({ ...data });
    }
    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=payment-export.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

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

export const accountExport = exportCsv;
