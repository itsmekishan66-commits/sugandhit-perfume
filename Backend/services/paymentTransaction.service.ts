import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import {
  paymentTransactions,
  paymentProviderEvents,
  orders,
  customorders,
  accountsReceivable,
} from '../models/schema/index.js';
import { postJournal, findAccount } from './journal.service.js';
import { createAuditLog } from './audit.service.js';
import { toMoney, toNum } from '../utils/money.js';

type TxClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ManualPaymentInput {
  orderId?: number;
  customOrderId?: number;
  customerId?: number;
  customerName?: string;
  paymentAccountId?: number;
  channel?: string;
  paymentMethod?: string;
  amount: number;
  processingFee?: number;
  taxAmount?: number;
  providerTransactionId?: string;
  intent?: string;
  transactionType?: string;
  source?: string;
  createdBy?: number;
  ip?: string;
}

const CHANNEL_ASSET_MAP: Record<string, string> = {
  cash: 'Cash in Hand',
  bank_transfer: 'Bank Account',
  bank: 'Bank Account',
  esewa: 'eSewa Wallet',
  khalti: 'Khalti Wallet',
  card: 'Card Gateway Receivable',
  gateway: 'Card Gateway Receivable',
  digital_wallet: 'Bank Account',
  credit_balance: 'Customer Advances',
  other: 'Bank Account',
};

const resolveRevenueAccountName = (custom: boolean) => (custom ? 'Custom Perfume Sales' : 'Perfume Sales');

export const generateTransactionId = () => `TXN-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const createTransaction = async (input: {
  transactionId?: string;
  providerTransactionId?: string;
  orderId?: number | null;
  customOrderId?: number | null;
  invoiceRef?: string;
  customerId?: number | null;
  customerName?: string;
  paymentAccountId?: number | null;
  channel: string;
  paymentMethod?: string;
  amount: number;
  processingFee?: number;
  taxAmount?: number;
  status?: string;
  intent?: string;
  transactionType?: string;
  source?: string;
  initiatedAt?: number;
  completedAt?: number;
}, client?: TxClient) => {
  const exec = client ?? db;
  const now = input.initiatedAt ?? Date.now();
  const amount = toNum(input.amount);
  const processingFee = toNum(input.processingFee ?? 0);
  const taxAmount = toNum(input.taxAmount ?? 0);
  const netAmount = Math.round((amount - processingFee - taxAmount) * 100) / 100;
  const transactionId = input.transactionId ?? generateTransactionId();
  const [txn] = await exec
    .insert(paymentTransactions)
    .values({
      transactionId,
      providerTransactionId: input.providerTransactionId ?? '',
      orderId: input.orderId ?? null,
      customOrderId: input.customOrderId ?? null,
      invoiceRef: input.invoiceRef ?? '',
      customerId: input.customerId ?? null,
      customerName: input.customerName ?? '',
      paymentAccountId: input.paymentAccountId ?? null,
      channel: input.channel,
      paymentMethod: input.paymentMethod ?? '',
      amount: toMoney(amount),
      processingFee: toMoney(processingFee),
      netAmount: toMoney(netAmount),
      taxAmount: toMoney(taxAmount),
      status: input.status ?? 'successful',
      intent: input.intent ?? '',
      transactionType: input.transactionType ?? 'payment',
      initiatedAt: now,
      completedAt: input.completedAt ?? (input.status === 'successful' || input.status === 'failed' || input.status === 'reconciled' ? now : null),
      source: input.source ?? '',
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return txn;
};

export const postPaymentJournal = async (
  txn: typeof paymentTransactions.$inferSelect,
  opts: { custom?: boolean; invoiceRef?: string; actorId?: number } = {},
  client?: TxClient
) => {
  const amount = toNum(txn.amount);
  const fee = toNum(txn.processingFee);
  const txType = txn.transactionType;
  const isInbound =
    txType === 'payment' || txType === 'partial_payment' || txType === 'settlement' || txType === 'transfer' || txType === 'adjustment';

  const assetAccountName = CHANNEL_ASSET_MAP[txn.channel] ?? 'Bank Account';
  const assetAccount = (await findAccount(assetAccountName, client)) ?? (await ensureDefault(assetAccountName, client));
  const revenueAccountName = resolveRevenueAccountName(!!opts.custom);
  const revenueAccount = (await findAccount(revenueAccountName, client)) ?? (await ensureDefault(revenueAccountName, client));
  const feeAccount = (await findAccount('Payment Gateway Fees', client)) ?? (await ensureDefault('Payment Gateway Fees', client));

  const description = `${txn.channel} payment ${txn.transactionId}${opts.invoiceRef ? ` for ${opts.invoiceRef}` : ''} (${txType})`;
  const lines = [
    {
      accountId: assetAccount.id,
      debit: isInbound ? amount : 0,
      credit: isInbound ? 0 : amount,
      description,
      costCenter: txn.channel,
    },
    {
      accountId: revenueAccount.id,
      debit: isInbound ? 0 : amount,
      credit: isInbound ? amount : 0,
      description,
    },
  ];

  if (fee > 0) {
    const feeDescription = `Payment gateway fee for ${txn.transactionId}`;
    lines.push({ accountId: feeAccount.id, debit: fee, credit: 0, description: feeDescription, costCenter: txn.channel });
    lines.push({ accountId: assetAccount.id, debit: 0, credit: fee, description: feeDescription, costCenter: txn.channel });
  }

  return postJournal({
    entryDate: toNum(txn.completedAt || txn.initiatedAt),
    postingDate: txn.completedAt || txn.initiatedAt,
    referenceType: 'payment_transaction',
    referenceId: txn.id,
    description,
    lines,
    createdBy: opts.actorId,
  }, client);
};

const ensureDefault = async (name: string, client?: TxClient) => {
  const { ensureAccountExists } = await import('./journal.service.js');
  return ensureAccountExists(name, client);
};

export const recordManualPayment = async (input: ManualPaymentInput) => {
  const custom = !!input.customOrderId;
  const order = input.orderId
    ? await db.query.orders.findFirst({ where: eq(orders.id, input.orderId) })
    : null;
  const customOrder = input.customOrderId
    ? await db.query.customorders.findFirst({ where: eq(customorders.id, input.customOrderId) })
    : null;
  const customerId = input.customerId ?? order?.userId ?? customOrder?.userId ?? null;
  const customerName =
    input.customerName ||
    (customerId
      ? (((await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, customerId) })) ?? {}) as { name?: string })?.name ?? ''
      : '');

  const txn = await db.transaction(async (tx) => {
    const created = await createTransaction({
      transactionId: generateTransactionId(),
      providerTransactionId: input.providerTransactionId,
      orderId: input.orderId ?? null,
      customOrderId: input.customOrderId ?? null,
      customerId: customerId ?? undefined,
      customerName,
      paymentAccountId: input.paymentAccountId,
      channel: input.channel ?? 'cash',
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      processingFee: input.processingFee,
      taxAmount: input.taxAmount,
      status: 'successful',
      intent: input.intent,
      transactionType: input.transactionType ?? 'payment',
      source: input.source ?? 'admin',
      completedAt: Date.now(),
    }, tx);
    await postPaymentJournal(created, { custom, actorId: input.createdBy }, tx);
    return created;
  });

  await syncReceivableForOrder(txn, custom);

  await createAuditLog({
    actorId: input.createdBy,
    actorRole: 'admin',
    action: 'payment.record',
    entityType: 'payment_transaction',
    entityId: txn.id,
    newValue: { transactionId: txn.transactionId, amount: toNum(txn.amount), channel: txn.channel, orderId: txn.orderId },
    ip: input.ip,
  });

  return txn;
};

export const syncReceivableForOrder = async (txn: typeof paymentTransactions.$inferSelect, custom: boolean) => {
  const orderId = custom ? txn.customOrderId : txn.orderId;
  if (!orderId) return;
  const existing = await db.query.accountsReceivable.findFirst({
    where: and(
      custom ? eq(accountsReceivable.customOrderId, orderId) : eq(accountsReceivable.orderId, orderId),
      eq(accountsReceivable.customerId, txn.customerId ?? 0)
    ),
  });
  const now = Date.now();
  const paidAmount = toNum(txn.amount);

  if (existing) {
    const newPaid = Math.round((toNum(existing.paidAmount) + paidAmount) * 100) / 100;
    const outstanding = Math.round((toNum(existing.originalAmount) - newPaid - toNum(existing.creditApplied) - toNum(existing.refundAmount)) * 100) / 100;
    const status = outstanding <= 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : existing.status;
    await db
      .update(accountsReceivable)
      .set({ paidAmount: toMoney(newPaid), outstandingAmount: toMoney(Math.max(outstanding, 0)), status, updatedAt: now })
      .where(eq(accountsReceivable.id, existing.id));
    return;
  }

  await db.insert(accountsReceivable).values({
    customerId: txn.customerId ?? 0,
    orderId: custom ? null : txn.orderId ?? null,
    customOrderId: custom ? txn.customOrderId ?? null : null,
    invoiceRef: `INV-${txn.orderId ?? txn.customOrderId ?? ''}-${custom ? 'C' : 'R'}`,
    invoiceDate: now,
    dueDate: now,
    originalAmount: toMoney(paidAmount),
    paidAmount: toMoney(paidAmount),
    outstandingAmount: '0',
    status: 'paid',
    createdAt: now,
    updatedAt: now,
  });
};

export const processWebhookEvent = async (input: {
  provider: string;
  eventId: string;
  eventType: string;
  transactionId?: string;
  payload?: Record<string, unknown>;
}) => {
  const existingEvent = await db.query.paymentProviderEvents.findFirst({ where: eq(paymentProviderEvents.eventId, input.eventId) });
  if (existingEvent) {
    if (existingEvent.processed) {
      return { idempotent: true, event: existingEvent };
    }
    await db.update(paymentProviderEvents).set({ payload: input.payload ?? {}, eventType: input.eventType, transactionId: input.transactionId ?? '' }).where(eq(paymentProviderEvents.id, existingEvent.id));
  } else {
    await db.insert(paymentProviderEvents).values({
      provider: input.provider,
      eventId: input.eventId,
      eventType: input.eventType,
      transactionId: input.transactionId ?? '',
      payload: input.payload ?? {},
      createdAt: Date.now(),
    });
  }

  const now = Date.now();
  const eventRow = await db.query.paymentProviderEvents.findFirst({ where: eq(paymentProviderEvents.eventId, input.eventId) });
  if (!eventRow) throw new Error('Failed to persist provider event.');

  let txn = input.transactionId
    ? await db.query.paymentTransactions.findFirst({
        where: (t, { or, eq: e }) => or(e(t.transactionId, input.transactionId as string), e(t.providerTransactionId, input.transactionId as string)),
      })
    : undefined;

  const eventType = input.eventType.toLowerCase();
  const succeeded = eventType.includes('success') || eventType.includes('paid') || eventType.includes('captured') || eventType.includes('completed');
  const failed = eventType.includes('failed') || eventType.includes('expired') || eventType.includes('cancelled') || eventType.includes('cancel');

  if (succeeded && txn && ['initiated', 'pending', 'authorized'].includes(txn.status)) {
    await db.update(paymentTransactions).set({ status: 'successful', completedAt: now, updatedAt: now, source: `webhook:${input.provider}` }).where(eq(paymentTransactions.id, txn.id));
    if (txn.transactionType === 'payment' || txn.transactionType === 'partial_payment' || txn.transactionType === 'settlement') {
      await postPaymentJournal({ ...txn, status: 'successful', completedAt: now });
      const custom = !!txn.customOrderId;
      await syncReceivableForOrder({ ...txn, status: 'successful', completedAt: now }, custom);
    }
  } else if (failed && txn) {
    await db.update(paymentTransactions).set({ status: 'failed', completedAt: now, failureReason: `provider: ${eventType}`, updatedAt: now }).where(eq(paymentTransactions.id, txn.id));
  } else if (succeeded && !txn) {
    const txnId = input.transactionId || `TXN-${now}-${Math.floor(Math.random() * 100000)}`;
    const channel = mapProviderToChannel(input.provider);
    txn = await createTransaction({
      transactionId: txnId,
      providerTransactionId: txnId,
      channel,
      amount: toNum((input.payload?.['amount'] ?? 0) as string | number),
      status: 'successful',
      source: `webhook:${input.provider}`,
      completedAt: now,
    });
  }

  await db.update(paymentProviderEvents).set({ processed: true, processedAt: now }).where(eq(paymentProviderEvents.id, eventRow.id));
  const finalEvent = await db.query.paymentProviderEvents.findFirst({ where: eq(paymentProviderEvents.id, eventRow.id) });
  return { idempotent: false, event: finalEvent, transaction: txn ? await getTransaction(txn.id) : null };
};

const mapProviderToChannel = (provider: string): string => {
  const p = provider.toLowerCase();
  if (p.includes('esewa')) return 'esewa';
  if (p.includes('khalti')) return 'khalti';
  if (p.includes('card') || p.includes('bank')) return 'bank_transfer';
  if (p.includes('wallet')) return 'digital_wallet';
  return 'other';
};

export const updateTransactionStatus = async (id: number, status: string) => {
  const txn = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, id) });
  if (!txn) throw new Error('Transaction not found.');
  await db
    .update(paymentTransactions)
    .set({ status, updatedAt: Date.now(), completedAt: status === 'successful' || status === 'failed' ? Date.now() : txn.completedAt })
    .where(eq(paymentTransactions.id, id));
  return getTransaction(id);
};

export const markReconciled = async (id: number, status = 'reconciled') => {
  const txn = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, id) });
  if (!txn) throw new Error('Transaction not found.');
  await db.update(paymentTransactions).set({ reconciliationStatus: status, updatedAt: Date.now() }).where(eq(paymentTransactions.id, id));
  return getTransaction(id);
};

export const getTransaction = async (id: number) => {
  const txn = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, id) });
  if (!txn) throw new Error('Transaction not found.');
  return serializeTransaction(txn);
};

export const listTransactions = async (opts: {
  from?: number;
  to?: number;
  status?: string;
  channel?: string;
  type?: string;
  accountId?: number;
  customerId?: number;
  orderId?: number;
  reconciliationStatus?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(paymentTransactions.initiatedAt, opts.from));
  if (opts.to) conditions.push(lte(paymentTransactions.initiatedAt, opts.to));
  if (opts.status) conditions.push(eq(paymentTransactions.status, opts.status));
  if (opts.channel) conditions.push(eq(paymentTransactions.channel, opts.channel));
  if (opts.type) conditions.push(eq(paymentTransactions.transactionType, opts.type));
  if (opts.accountId) conditions.push(eq(paymentTransactions.paymentAccountId, opts.accountId));
  if (opts.customerId) conditions.push(eq(paymentTransactions.customerId, opts.customerId));
  if (opts.orderId) conditions.push(eq(paymentTransactions.orderId, opts.orderId));
  if (opts.reconciliationStatus) conditions.push(eq(paymentTransactions.reconciliationStatus, opts.reconciliationStatus));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.query.paymentTransactions.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.initiatedAt)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(paymentTransactions).where(where ?? sql`1=1`);
  return { items: items.map((t) => serializeTransaction(t)), total: Number(counts[0]?.count ?? 0), page, limit, totalPages: Math.ceil(Number(counts[0]?.count ?? 0) / limit) };
};

export const serializeTransaction = (t: typeof paymentTransactions.$inferSelect) => ({
  ...t,
  _id: String(t.id),
  amount: toNum(t.amount),
  processingFee: toNum(t.processingFee),
  netAmount: toNum(t.netAmount),
  taxAmount: toNum(t.taxAmount),
});

export const channelTotals = (txns: (typeof paymentTransactions.$inferSelect)[]) => {
  const totals: Record<string, { count: number; gross: number; fees: number; refunds: number; chargebacks: number; net: number; successful: number; failed: number; pending: number }> = {};
  for (const t of txns) {
    const ch = t.channel;
    if (!totals[ch]) totals[ch] = { count: 0, gross: 0, fees: 0, refunds: 0, chargebacks: 0, net: 0, successful: 0, failed: 0, pending: 0 };
    totals[ch].count += 1;
    totals[ch].gross = Math.round((totals[ch].gross + toNum(t.amount)) * 100) / 100;
    totals[ch].fees = Math.round((totals[ch].fees + toNum(t.processingFee)) * 100) / 100;
    totals[ch].net = Math.round((totals[ch].net + toNum(t.netAmount)) * 100) / 100;
    if (t.transactionType === 'refund') totals[ch].refunds = Math.round((totals[ch].refunds + toNum(t.amount)) * 100) / 100;
    if (t.transactionType === 'chargeback') totals[ch].chargebacks = Math.round((totals[ch].chargebacks + toNum(t.amount)) * 100) / 100;
    if (t.status === 'successful' || t.status === 'reconciled') totals[ch].successful += 1;
    if (t.status === 'failed') totals[ch].failed += 1;
    if (['initiated', 'pending', 'authorized'].includes(t.status)) totals[ch].pending += 1;
  }
  return totals;
};