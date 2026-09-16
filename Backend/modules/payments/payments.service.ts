import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import {
  paymentAccounts,
  paymentTransactions,
  paymentRefunds,
  paymentReconciliations,
  accountsReceivable,
} from '../../database/schema/index.js';
import { createAuditLog } from '../accounting/accounting.service.js';
import { toMoney, toNum, sum } from '../../shared/utils/money.js';
import {
  findAccount,
  ensureAccountExists,
  postJournal,
  insertPaymentAccount,
  findPaymentAccountById,
  findPaymentAccounts,
  updatePaymentAccountById,
  findPaymentTransactionById,
  findPaymentTransactions,
  countPaymentTransactions,
  updatePaymentTransactionById,
  findPaymentTransactionsByAccount,
  findPaymentTransactionsByProviderEventId,
  findProviderEventByEventId,
  findProviderEventById,
  insertProviderEvent,
  updateProviderEventById,
  countUnprocessedProviderEvents,
  findPaymentRefundsByTransactionId,
  findPaymentRefundById,
  insertPaymentRefund,
  updatePaymentRefundById,
  findPaymentRefunds,
  countPaymentRefunds,
  findReconciliationInProgress,
  insertReconciliation,
  findReconciliationById,
  findReconciliations,
  updateReconciliationById,
  findReconciliationItemById,
  insertReconciliationItem,
  updateReconciliationItemById,
  findReconciliationItems,
  findReconciliationItemByExternalRef,
  findOrderById,
  findCustomOrderById,
  findUserById,
  findAccountsReceivable,
  insertAccountsReceivable,
  updateAccountsReceivableById,
  getAllAccountsReceivable,
  getAllAccountsPayable,
  selectPaymentTransactionsForReconciliation,
  countPaymentAccounts,
  findPaymentTransactionsInRange,
  transaction as dbTransaction,
} from './payments.repository.js';
import type {
  PaymentAccountInput,
  ManualPaymentInput,
  RefundInput,
  ReconciliationInput,
  TransactionListOpts,
  RefundListOpts,
  PaymentOverviewOpts,
  PaymentChannelReportOpts,
} from './payments.types.js';

type TxClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// ─── Constants ──────────────────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────

export const generateTransactionId = () => `TXN-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const dayStart = (daysBack: number) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - daysBack);
  return now.getTime();
};

const channelAssetName = (channel: string): string => CHANNEL_ASSET_MAP[channel] ?? 'Bank Account';

const mapProviderToChannel = (provider: string): string => {
  const p = provider.toLowerCase();
  if (p.includes('esewa')) return 'esewa';
  if (p.includes('khalti')) return 'khalti';
  if (p.includes('card') || p.includes('bank')) return 'bank_transfer';
  if (p.includes('wallet')) return 'digital_wallet';
  return 'other';
};

// ─── Serializers ────────────────────────────────────────────────────────────

export const serializePaymentAccount = async (a: typeof paymentAccounts.$inferSelect) => {
  const transactions = await findPaymentTransactionsByAccount(a.id);
  let calculatedBalance = toNum(a.openingBalance);
  for (const t of transactions) {
    if (t.status === 'successful' || t.status === 'reconciled') {
      if (t.transactionType === 'payment' || t.transactionType === 'partial_payment' || t.transactionType === 'settlement' || t.transactionType === 'transfer' || t.transactionType === 'adjustment') {
        calculatedBalance = Math.round((calculatedBalance + toNum(t.netAmount)) * 100) / 100;
      } else if (t.transactionType === 'refund' || t.transactionType === 'chargeback' || t.transactionType === 'reversal' || t.transactionType === 'fee') {
        calculatedBalance = Math.round((calculatedBalance - toNum(t.netAmount)) * 100) / 100;
      }
    }
  }
  const pending = transactions
    .filter((t) => ['initiated', 'pending', 'authorized'].includes(t.status))
    .reduce((s, t) => Math.round((s + toNum(t.netAmount)) * 100) / 100, 0);
  return {
    ...a,
    _id: String(a.id),
    openingBalance: toNum(a.openingBalance),
    calculatedBalance,
    currentBalance: calculatedBalance,
    availableBalance: Math.round((calculatedBalance - pending) * 100) / 100,
    pendingSettlement: pending,
    transactionCount: transactions.length,
  };
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

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT ACCOUNTS
// ════════════════════════════════════════════════════════════════════════════

export const createPaymentAccount = async (input: PaymentAccountInput) => {
  const now = Date.now();
  const [account] = await insertPaymentAccount({
    name: input.name,
    accountType: input.accountType,
    provider: input.provider ?? '',
    currency: input.currency ?? 'NPR',
    openingBalance: toMoney(input.openingBalance ?? 0),
    accountNumber: input.accountNumber ?? '',
    branch: input.branch ?? '',
    notes: input.notes ?? '',
    createdBy: input.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return serializePaymentAccount(account);
};

export const listPaymentAccounts = async (opts: { active?: string; type?: string } = {}) => {
  const conditions: ReturnType<typeof eq>[] = [];
  if (opts.active && opts.active !== 'all') conditions.push(eq(paymentAccounts.active, opts.active === 'true'));
  if (opts.type) conditions.push(eq(paymentAccounts.accountType, opts.type));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const accounts = await findPaymentAccounts(where);
  return Promise.all(accounts.map(serializePaymentAccount));
};

export const getPaymentAccount = async (id: number) => {
  const account = await findPaymentAccountById(id);
  if (!account) throw new Error('Payment account not found.');
  return serializePaymentAccount(account);
};

export const updatePaymentAccount = async (id: number, patch: Partial<PaymentAccountInput> & { active?: boolean }, updatedBy?: number) => {
  const account = await findPaymentAccountById(id);
  if (!account) throw new Error('Payment account not found.');
  const update: Record<string, unknown> = { ...(patch as object), updatedAt: Date.now(), updatedBy: updatedBy ?? null };
  if (patch.openingBalance !== undefined) update.openingBalance = toMoney(patch.openingBalance);
  if (typeof update.active !== 'boolean') delete update.active;
  const cleaned = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
  await updatePaymentAccountById(id, cleaned);
  return getPaymentAccount(id);
};

export const deactivatePaymentAccount = async (id: number, updatedBy?: number) => {
  const account = await findPaymentAccountById(id);
  if (!account) throw new Error('Payment account not found.');
  await updatePaymentAccountById(id, { active: false, updatedAt: Date.now(), updatedBy: updatedBy ?? null });
  return getPaymentAccount(id);
};

export const getPaymentAccountLedger = async (id: number) => {
  const account = await getPaymentAccount(id);
  return {
    account,
    transactions: (await findPaymentTransactionsByAccount(id)).sort((a, b) => (b.initiatedAt ?? 0) - (a.initiatedAt ?? 0)),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT TRANSACTIONS
// ════════════════════════════════════════════════════════════════════════════

export const createTransaction = async (
  input: {
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
  },
  client?: TxClient,
) => {
  const now = input.initiatedAt ?? Date.now();
  const amount = toNum(input.amount);
  const processingFee = toNum(input.processingFee ?? 0);
  const taxAmount = toNum(input.taxAmount ?? 0);
  const netAmount = Math.round((amount - processingFee - taxAmount) * 100) / 100;
  const transactionId = input.transactionId ?? generateTransactionId();
  const exec = client ?? db;
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
  client?: TxClient,
) => {
  const amount = toNum(txn.amount);
  const fee = toNum(txn.processingFee);
  const txType = txn.transactionType;
  const isInbound =
    txType === 'payment' || txType === 'partial_payment' || txType === 'settlement' || txType === 'transfer' || txType === 'adjustment';

  const assetAccountName = CHANNEL_ASSET_MAP[txn.channel] ?? 'Bank Account';
  const assetAccount = (await findAccount(assetAccountName, client)) ?? (await ensureAccountExists(assetAccountName, client));
  const revenueAccountName = resolveRevenueAccountName(!!opts.custom);
  const revenueAccount = (await findAccount(revenueAccountName, client)) ?? (await ensureAccountExists(revenueAccountName, client));
  const feeAccount = (await findAccount('Payment Gateway Fees', client)) ?? (await ensureAccountExists('Payment Gateway Fees', client));

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

  return postJournal(
    {
      entryDate: toNum(txn.completedAt || txn.initiatedAt),
      postingDate: txn.completedAt || txn.initiatedAt,
      referenceType: 'payment_transaction',
      referenceId: txn.id,
      description,
      lines,
      createdBy: opts.actorId,
    },
    client,
  );
};

export const syncReceivableForOrder = async (txn: typeof paymentTransactions.$inferSelect, custom: boolean) => {
  const orderId = custom ? txn.customOrderId : txn.orderId;
  if (!orderId) return;
  const existing = await findAccountsReceivable(
    and(
      custom ? eq(accountsReceivable.customOrderId, orderId) : eq(accountsReceivable.orderId, orderId),
      eq(accountsReceivable.customerId, txn.customerId ?? 0),
    ),
  );
  const now = Date.now();
  const paidAmount = toNum(txn.amount);

  if (existing) {
    const newPaid = Math.round((toNum(existing.paidAmount) + paidAmount) * 100) / 100;
    const outstanding = Math.round((toNum(existing.originalAmount) - newPaid - toNum(existing.creditApplied) - toNum(existing.refundAmount)) * 100) / 100;
    const status = outstanding <= 0 ? 'paid' : newPaid > 0 ? 'partially_paid' : existing.status;
    await updateAccountsReceivableById(existing.id, { paidAmount: toMoney(newPaid), outstandingAmount: toMoney(Math.max(outstanding, 0)), status, updatedAt: now });
    return;
  }

  await insertAccountsReceivable({
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

export const recordManualPayment = async (input: ManualPaymentInput) => {
  const custom = !!input.customOrderId;
  const order = input.orderId ? await findOrderById(input.orderId) : null;
  const customOrder = input.customOrderId ? await findCustomOrderById(input.customOrderId) : null;
  const customerId = input.customerId ?? order?.userId ?? customOrder?.userId ?? null;
  const customerName =
    input.customerName ||
    (customerId
      ? (await findUserById(customerId))?.name ?? ''
      : '');

  const txn = await dbTransaction(async (tx) => {
    const created = await createTransaction(
      {
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
      },
      tx,
    );
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

export const processWebhookEvent = async (input: {
  provider: string;
  eventId: string;
  eventType: string;
  transactionId?: string;
  payload?: Record<string, unknown>;
}) => {
  const existingEvent = await findProviderEventByEventId(input.eventId);
  if (existingEvent) {
    if (existingEvent.processed) {
      return { idempotent: true, event: existingEvent };
    }
    await updateProviderEventById(existingEvent.id, { payload: input.payload ?? {}, eventType: input.eventType, transactionId: input.transactionId ?? '' });
  } else {
    await insertProviderEvent({
      provider: input.provider,
      eventId: input.eventId,
      eventType: input.eventType,
      transactionId: input.transactionId ?? '',
      payload: input.payload ?? {},
      createdAt: Date.now(),
    });
  }

  const now = Date.now();
  const eventRow = await findProviderEventByEventId(input.eventId);
  if (!eventRow) throw new Error('Failed to persist provider event.');

  let txn = input.transactionId ? await findPaymentTransactionsByProviderEventId(input.transactionId) : undefined;

  const eventType = input.eventType.toLowerCase();
  const succeeded = eventType.includes('success') || eventType.includes('paid') || eventType.includes('captured') || eventType.includes('completed');
  const failed = eventType.includes('failed') || eventType.includes('expired') || eventType.includes('cancelled') || eventType.includes('cancel');

  if (succeeded && txn && ['initiated', 'pending', 'authorized'].includes(txn.status)) {
    await updatePaymentTransactionById(txn.id, { status: 'successful', completedAt: now, updatedAt: now, source: `webhook:${input.provider}` });
    if (txn.transactionType === 'payment' || txn.transactionType === 'partial_payment' || txn.transactionType === 'settlement') {
      await postPaymentJournal({ ...txn, status: 'successful', completedAt: now });
      const custom = !!txn.customOrderId;
      await syncReceivableForOrder({ ...txn, status: 'successful', completedAt: now }, custom);
    }
  } else if (failed && txn) {
    await updatePaymentTransactionById(txn.id, { status: 'failed', completedAt: now, failureReason: `provider: ${eventType}`, updatedAt: now });
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

  await updateProviderEventById(eventRow.id, { processed: true, processedAt: now });
  const finalEvent = await findProviderEventById(eventRow.id);
  return { idempotent: false, event: finalEvent, transaction: txn ? await getTransaction(txn.id) : null };
};

export const updateTransactionStatus = async (id: number, status: string) => {
  const txn = await findPaymentTransactionById(id);
  if (!txn) throw new Error('Transaction not found.');
  await updatePaymentTransactionById(id, {
    status,
    updatedAt: Date.now(),
    completedAt: status === 'successful' || status === 'failed' ? Date.now() : txn.completedAt,
  });
  return getTransaction(id);
};

export const markReconciled = async (id: number, status = 'reconciled') => {
  const txn = await findPaymentTransactionById(id);
  if (!txn) throw new Error('Transaction not found.');
  await updatePaymentTransactionById(id, { reconciliationStatus: status, updatedAt: Date.now() });
  return getTransaction(id);
};

export const getTransaction = async (id: number) => {
  const txn = await findPaymentTransactionById(id);
  if (!txn) throw new Error('Transaction not found.');
  return serializeTransaction(txn);
};

export const listTransactions = async (opts: TransactionListOpts = {}) => {
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

  const items = await findPaymentTransactions(where, {
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await countPaymentTransactions(where);
  return {
    items: items.map((t) => serializeTransaction(t)),
    total: Number(counts[0]?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(counts[0]?.count ?? 0) / limit),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT REFUNDS
// ════════════════════════════════════════════════════════════════════════════

export const createRefund = async (input: RefundInput) => {
  const original = await findPaymentTransactionById(input.transactionId);
  if (!original) throw new Error('Original transaction not found.');
  if (!['successful', 'reconciled', 'partially_refunded', 'disputed'].includes(original.status)) {
    throw new Error(`Cannot refund a transaction with status "${original.status}".`);
  }

  const existingRefunds = await findPaymentRefundsByTransactionId(input.transactionId);
  const totalRefunded = existingRefunds
    .filter((r) => r.status === 'processed' || r.status === 'approved')
    .reduce((s, r) => Math.round((s + toNum(r.amount)) * 100) / 100, 0);
  const refundable = Math.round((toNum(original.amount) - totalRefunded) * 100) / 100;
  if (toNum(input.amount) > refundable + 0.001) {
    throw new Error(`Refund amount exceeds refundable balance of ${refundable.toFixed(2)}.`);
  }

  const now = Date.now();
  const isChargeback = !!input.chargeback || input.type === 'chargeback';
  const [refund] = await insertPaymentRefund({
    transactionId: input.transactionId,
    refundRef: input.refundRef ?? `REF-${now}-${Math.floor(Math.random() * 10000)}`,
    amount: toMoney(input.amount),
    reason: input.reason,
    type: input.type,
    chargeback: isChargeback,
    status: 'requested',
    initiatedBy: input.initiatedBy ?? null,
    createdAt: now,
  });

  await updatePaymentTransactionById(input.transactionId, { status: 'disputed', updatedAt: now });

  if (isChargeback) {
    await updatePaymentTransactionById(input.transactionId, { status: 'chargeback', updatedAt: now });
  }

  await createAuditLog({
    actorId: input.initiatedBy,
    actorRole: 'admin',
    action: isChargeback ? 'payment.chargeback' : 'payment.refund',
    entityType: 'payment_refund',
    entityId: refund.id,
    newValue: { transactionId: input.transactionId, amount: toNum(input.amount), type: input.type, reason: input.reason },
    ip: input.ip,
  });

  return refund;
};

export const approveRefund = async (id: number, approved: boolean, actorId?: number) => {
  const refund = await findPaymentRefundById(id);
  if (!refund) throw new Error('Refund not found.');
  if (refund.status !== 'requested') throw new Error('Only requested refunds can be approved.');

  if (!approved) {
    await updatePaymentRefundById(id, { status: 'failed' });
    restoreOriginalStatus(refund.transactionId);
    return { ...refund, status: 'failed' };
  }

  const now = Date.now();
  const original = await findPaymentTransactionById(refund.transactionId);
  if (!original) throw new Error('Original transaction not found.');

  const result = await dbTransaction(async (tx) => {
    await updatePaymentRefundById(id, { status: 'approved', approvedBy: actorId ?? null, processedAt: now });

    const refundTxn = await createTransaction(
      {
        providerTransactionId: refund.refundRef,
        orderId: original.orderId ?? undefined,
        customOrderId: original.customOrderId ?? undefined,
        invoiceRef: original.invoiceRef,
        customerId: original.customerId ?? undefined,
        customerName: original.customerName,
        paymentAccountId: original.paymentAccountId ?? undefined,
        channel: original.channel,
        paymentMethod: original.paymentMethod,
        amount: toNum(refund.amount),
        transactionType: refund.chargeback ? 'chargeback' : 'refund',
        status: 'successful',
        source: `refund:${refund.refundRef}`,
        completedAt: now,
      },
      tx,
    );

    const assetAccountName = channelAssetName(original.channel);
    const assetAccount = (await findAccount(assetAccountName)) ?? (await ensureAccountExists(assetAccountName));
    const refundAccount = (await findAccount('Refunds')) ?? (await ensureAccountExists('Refunds'));
    const description = `${refund.chargeback ? 'Chargeback' : 'Refund'} ${refund.refundRef} of ${original.transactionId} - ${refund.reason}`;

    const journal = await postJournal({
      entryDate: now,
      postingDate: now,
      referenceType: 'refund',
      referenceId: refund.id,
      description,
      lines: [
        { accountId: refundAccount.id, debit: toNum(refund.amount), credit: 0, description },
        { accountId: assetAccount.id, debit: 0, credit: toNum(refund.amount), description },
      ],
      createdBy: actorId,
    });

    await updatePaymentRefundById(id, { journalEntryId: journal.entry.id });

    const remaining = Math.round((toNum(original.amount) - toNum(refund.amount)) * 100) / 100;
    const newStatus = remaining <= 0 ? 'fully_refunded' : 'partially_refunded';
    await updatePaymentTransactionById(original.id, { status: newStatus, refundRef: refund.refundRef, updatedAt: now });

    return refundTxn;
  });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'payment.refund.approved',
    entityType: 'payment_refund',
    entityId: id,
    newValue: { approved: true, amount: toNum(refund.amount) },
  });

  return result;
};

const restoreOriginalStatus = async (transactionId: number) => {
  const original = await findPaymentTransactionById(transactionId);
  if (original && (original.status === 'disputed' || original.status === 'chargeback')) {
    await updatePaymentTransactionById(transactionId, { status: 'successful', updatedAt: Date.now() });
  }
};

export const listRefunds = async (opts: RefundListOpts = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(paymentRefunds.createdAt, opts.from));
  if (opts.to) conditions.push(lte(paymentRefunds.createdAt, opts.to));
  if (opts.status) conditions.push(eq(paymentRefunds.status, opts.status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const refunds = await findPaymentRefunds(where, { limit, offset: (page - 1) * limit });
  const counts = await countPaymentRefunds(where);
  return {
    items: refunds.map((r) => ({ ...r, _id: String(r.id), amount: toNum(r.amount) })),
    page,
    limit,
    total: Number(counts[0]?.count ?? 0),
    totalPages: Math.ceil(Number(counts[0]?.count ?? 0) / limit),
  };
};

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT RECONCILIATION
// ════════════════════════════════════════════════════════════════════════════

export const createReconciliation = async (input: ReconciliationInput) => {
  const existing = await findReconciliationInProgress(input.paymentAccountId);
  if (existing) throw new Error('An in-progress reconciliation already exists for this account.');

  const [rec] = await insertReconciliation({
    paymentAccountId: input.paymentAccountId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    openingExternalBalance: toMoney(input.openingExternalBalance ?? 0),
    closingExternalBalance: toMoney(input.closingExternalBalance ?? 0),
    notes: input.notes ?? '',
    createdBy: input.createdBy ?? null,
    createdAt: Date.now(),
  });

  await autoMatch(rec.id, input.paymentAccountId, input.periodStart, input.periodEnd);

  await createAuditLog({
    actorId: input.createdBy,
    actorRole: 'admin',
    action: 'payment.reconciliation.created',
    entityType: 'payment_reconciliation',
    entityId: rec.id,
    newValue: { ...rec, openingExternalBalance: toNum(rec.openingExternalBalance), closingExternalBalance: toNum(rec.closingExternalBalance) },
  });

  return getReconciliation(rec.id);
};

const autoMatch = async (reconciliationId: number, accountId: number, from: number, to: number) => {
  const txns = await findPaymentTransactionsInRange(accountId, from, to);
  for (const txn of txns) {
    const match = await findReconciliationItemByExternalRef(reconciliationId, txn.providerTransactionId || txn.transactionId);
    if (match) {
      const discrepancy = Math.round((toNum(match.externalAmount) - toNum(txn.netAmount)) * 100) / 100;
      await updateReconciliationItemById(match.id, {
        transactionId: txn.id,
        matched: discrepancy === 0,
        matchType: 'provider_ref',
        discrepancy: toMoney(discrepancy),
        status: discrepancy === 0 ? 'matched' : 'amount_mismatch',
      });
      await updatePaymentTransactionById(txn.id, { reconciliationStatus: discrepancy === 0 ? 'matched' : 'partial' });
    }
  }
};

export const listReconciliations = async (accountId?: number) => {
  const items = await findReconciliations(
    accountId ? eq(paymentReconciliations.paymentAccountId, accountId) : undefined,
  );
  return Promise.all(
    items.map(async (r) => {
      const detail = await getReconciliation(r.id);
      return { ...detail, _id: String(r.id) };
    }),
  );
};

export const getReconciliation = async (id: number) => {
  const rec = await findReconciliationById(id);
  if (!rec) throw new Error('Reconciliation not found.');
  const items = await findReconciliationItems(id);
  const summary = items.reduce(
    (acc, i) => {
      acc.total += 1;
      if (i.matched) acc.matched += 1;
      if (i.status === 'missing_internal') acc.missingInternal += 1;
      if (i.status === 'missing_external') acc.missingExternal += 1;
      if (i.status === 'amount_mismatch') acc.mismatched += 1;
      if (i.status === 'duplicate') acc.duplicates += 1;
      acc.discrepancy = Math.round((acc.discrepancy + toNum(i.discrepancy)) * 100) / 100;
      return acc;
    },
    { total: 0, matched: 0, missingInternal: 0, missingExternal: 0, mismatched: 0, duplicates: 0, discrepancy: 0 },
  );
  return {
    ...rec,
    openingExternalBalance: toNum(rec.openingExternalBalance),
    closingExternalBalance: toNum(rec.closingExternalBalance),
    items: items.map((i) => ({ ...i, _id: String(i.id), externalAmount: toNum(i.externalAmount), discrepancy: toNum(i.discrepancy) })),
    summary,
  };
};

export const addReconciliationItem = async (input: { reconciliationId: number; externalRef?: string; externalAmount?: number }) => {
  const item = await findReconciliationItemByExternalRef(input.reconciliationId, input.externalRef ?? '');
  if (item) throw new Error('An item with this external reference already exists.');

  const [created] = await insertReconciliationItem({
    reconciliationId: input.reconciliationId,
    externalRef: input.externalRef ?? '',
    externalAmount: toMoney(input.externalAmount ?? 0),
    status: 'missing_internal',
    createdAt: Date.now(),
  });

  const rec = await findReconciliationById(input.reconciliationId);
  if (rec) {
    await autoMatch(rec.id, rec.paymentAccountId, rec.periodStart, rec.periodEnd);
  }
  return created;
};

export const matchReconciliationItem = async (itemId: number, transactionId: number, actorId?: number) => {
  const item = await findReconciliationItemById(itemId);
  if (!item) throw new Error('Reconciliation item not found.');
  const txn = await findPaymentTransactionById(transactionId);
  if (!txn) throw new Error('Transaction not found.');

  const discrepancy = Math.round((toNum(item.externalAmount) - toNum(txn.netAmount)) * 100) / 100;
  await updateReconciliationItemById(itemId, {
    transactionId,
    matched: discrepancy === 0,
    matchType: 'manual',
    discrepancy: toMoney(discrepancy),
    status: discrepancy === 0 ? 'matched' : 'amount_mismatch',
  });
  await updatePaymentTransactionById(transactionId, { reconciliationStatus: discrepancy === 0 ? 'matched' : 'partial' });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'payment.reconciliation.matched',
    entityType: 'payment_reconciliation_item',
    entityId: itemId,
    newValue: { transactionId, discrepancy },
  });
  return getReconciliation(item.reconciliationId);
};

export const lockReconciliation = async (id: number, actorId?: number) => {
  const rec = await findReconciliationById(id);
  if (!rec) throw new Error('Reconciliation not found.');
  if (rec.status === 'locked') throw new Error('Reconciliation is already locked.');

  const items = await findReconciliationItems(id);
  for (const item of items) {
    if (item.matched && item.transactionId) {
      await updatePaymentTransactionById(item.transactionId, { reconciliationStatus: 'reconciled' });
    }
  }
  await updateReconciliationById(id, { status: 'locked', lockedAt: Date.now() });

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'payment.reconciliation.locked',
    entityType: 'payment_reconciliation',
    entityId: id,
  });
  return getReconciliation(id);
};

export const reconciliationDashboard = async (accountId?: number) => {
  let condition = sql`1=1`;
  if (accountId) {
    condition = eq(paymentTransactions.paymentAccountId, accountId);
  }
  const rows = await selectPaymentTransactionsForReconciliation(condition);

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

// ════════════════════════════════════════════════════════════════════════════
// PAYMENT DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

export const getTotalOutstanding = async () => {
  const rows = await getAllAccountsReceivable();
  return sum(rows.map((r) => toNum(r.outstandingAmount)));
};

export const getPaymentOverview = async (opts: PaymentOverviewOpts = {}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(sql`${paymentTransactions.initiatedAt} >= ${opts.from}`);
  if (opts.to) conditions.push(sql`${paymentTransactions.initiatedAt} <= ${opts.to}`);
  if (opts.channel) conditions.push(eq(paymentTransactions.channel, opts.channel));
  if (opts.status) conditions.push(eq(paymentTransactions.status, opts.status));
  if (opts.accountId) conditions.push(eq(paymentTransactions.paymentAccountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const all = await findPaymentTransactions(where);
  const filtered = all.filter((t) => t.transactionType === 'payment' || t.transactionType === 'partial_payment' || t.transactionType === 'refund' || t.transactionType === 'chargeback' || t.transactionType === 'settlement' || t.transactionType === 'fee');

  const todayStart = dayStart(0);
  const weekStart = dayStart(6);
  const monthStart = dayStart(29);

  const today = filtered.filter((t) => t.initiatedAt >= todayStart && toNum(t.amount) >= 0 && ['payment', 'partial_payment', 'settlement'].includes(t.transactionType));
  const thisWeek = filtered.filter((t) => t.initiatedAt >= weekStart && ['payment', 'partial_payment', 'settlement'].includes(t.transactionType));
  const thisMonth = filtered.filter((t) => t.initiatedAt >= monthStart && ['payment', 'partial_payment', 'settlement'].includes(t.transactionType));

  const successful = filtered.filter((t) => ['successful', 'reconciled'].includes(t.status) && ['payment', 'partial_payment', 'settlement'].includes(t.transactionType));
  const pending = filtered.filter((t) => ['initiated', 'pending', 'authorized'].includes(t.status));
  const failed = filtered.filter((t) => ['failed', 'cancelled', 'expired'].includes(t.status));
  const refunds = filtered.filter((t) => t.transactionType === 'refund');
  const chargebacks = filtered.filter((t) => t.transactionType === 'chargeback');

  const successRate = successful.length + failed.length > 0 ? Math.round((successful.length / (successful.length + failed.length)) * 10000) / 100 : 0;

  const unprocessedEvents = await countUnprocessedProviderEvents();
  const payableRows = await getAllAccountsPayable();

  return {
    receivedToday: Math.round(sum(today.map((t) => toNum(t.netAmount))) * 100) / 100,
    receivedThisWeek: Math.round(sum(thisWeek.map((t) => toNum(t.netAmount))) * 100) / 100,
    receivedThisMonth: Math.round(sum(thisMonth.map((t) => toNum(t.netAmount))) * 100) / 100,
    successfulCount: successful.length,
    successfulAmount: Math.round(sum(successful.map((t) => toNum(t.netAmount))) * 100) / 100,
    pendingCount: pending.length,
    pendingAmount: Math.round(sum(pending.map((t) => toNum(t.netAmount))) * 100) / 100,
    failedCount: failed.length,
    failedAmount: Math.round(sum(failed.map((t) => toNum(t.netAmount))) * 100) / 100,
    refundedAmount: Math.round(sum(refunds.map((t) => toNum(t.amount))) * 100) / 100,
    chargebackAmount: Math.round(sum(chargebacks.map((t) => toNum(t.amount))) * 100) / 100,
    outstandingReceivables: await getTotalOutstanding(),
    outstandingPayables: Math.round(sum(payableRows.map((p) => toNum(p.outstandingAmount))) * 100) / 100,
    awaitingSettlement: Math.round(sum(filtered.filter((t) => ['esewa', 'khalti', 'card', 'gateway'].includes(t.channel) && t.status === 'successful').map((t) => toNum(t.netAmount))) * 100) / 100,
    successRate,
    channelTotals: channelTotals(filtered),
    unprocessedWebhookEvents: Number(unprocessedEvents[0]?.count ?? 0),
  };
};

export const getPaymentChannelReport = async (opts: PaymentChannelReportOpts = {}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(sql`${paymentTransactions.initiatedAt} >= ${opts.from}`);
  if (opts.to) conditions.push(sql`${paymentTransactions.initiatedAt} <= ${opts.to}`);
  if (opts.accountId) conditions.push(eq(paymentTransactions.paymentAccountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const all = await findPaymentTransactions(where);
  const gross = all.filter((t) => ['payment', 'partial_payment', 'settlement'].includes(t.transactionType));
  const refunds = all.filter((t) => t.transactionType === 'refund');
  const chargebacks = all.filter((t) => t.transactionType === 'chargeback');
  const channels = [...new Set(all.map((t) => t.channel))];
  const rows = channels.map((ch) => {
    const channelTxns = all.filter((t) => t.channel === ch);
    const channelGross = gross.filter((t) => t.channel === ch);
    const grossAmount = Math.round(sum(channelGross.map((t) => toNum(t.amount))) * 100) / 100;
    const fees = Math.round(sum(channelTxns.map((t) => toNum(t.processingFee))) * 100) / 100;
    const refundAmount = Math.round(sum(refunds.filter((t) => t.channel === ch).map((t) => toNum(t.amount))) * 100) / 100;
    const chargebackAmount = Math.round(sum(chargebacks.filter((t) => t.channel === ch).map((t) => toNum(t.amount))) * 100) / 100;
    const pendingSettlement = Math.round(sum(channelGross.filter((t) => t.status === 'successful').map((t) => toNum(t.netAmount))) * 100) / 100;
    return {
      channel: ch,
      grossAmount,
      fees,
      refunds: refundAmount,
      chargebacks: chargebackAmount,
      netAmount: Math.round((grossAmount - fees - refundAmount - chargebackAmount) * 100) / 100,
      pendingSettlement,
      transactionCount: channelTxns.length,
      successful: channelTxns.filter((t) => ['successful', 'reconciled'].includes(t.status)).length,
      failed: channelTxns.filter((t) => ['failed', 'cancelled', 'expired'].includes(t.status)).length,
      pending: channelTxns.filter((t) => ['initiated', 'pending', 'authorized'].includes(t.status)).length,
      reconciledAmount: Math.round(sum(channelTxns.filter((t) => t.reconciliationStatus === 'reconciled').map((t) => toNum(t.netAmount))) * 100) / 100,
      unreconciledAmount: Math.round(sum(channelTxns.filter((t) => t.reconciliationStatus === 'unreconciled').map((t) => toNum(t.netAmount))) * 100) / 100,
    };
  });
  return rows;
};

export const getLinkStatus = async () => {
  const accountCount = await countPaymentAccounts();
  return {
    configured: Number(accountCount[0]?.count ?? 0) > 0,
    accountCount: Number(accountCount[0]?.count ?? 0),
    note: 'Payment gateways are wired through provider webhooks. Add at least one payment account to begin recording payments.',
  };
};
