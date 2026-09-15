import { and, eq, gte, lte, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { paymentRefunds, paymentTransactions } from '../models/schema/index.js';
import { postJournal, findAccount } from './journal.service.js';
import { createTransaction } from './paymentTransaction.service.js';
import { createAuditLog } from './audit.service.js';
import { toMoney, toNum } from '../utils/money.js';

export interface RefundInput {
  transactionId: number;
  amount: number;
  reason: string;
  type: string;
  chargeback?: boolean;
  refundRef?: string;
  initiatedBy?: number;
  ip?: string;
}

export const createRefund = async (input: RefundInput) => {
  const original = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, input.transactionId) });
  if (!original) throw new Error('Original transaction not found.');
  if (!['successful', 'reconciled', 'partially_refunded', 'disputed'].includes(original.status)) {
    throw new Error(`Cannot refund a transaction with status "${original.status}".`);
  }

  const existingRefunds = await db.query.paymentRefunds.findMany({ where: eq(paymentRefunds.transactionId, input.transactionId) });
  const totalRefunded = existingRefunds
    .filter((r) => r.status === 'processed' || r.status === 'approved')
    .reduce((s, r) => Math.round((s + toNum(r.amount)) * 100) / 100, 0);
  const refundable = Math.round((toNum(original.amount) - totalRefunded) * 100) / 100;
  if (toNum(input.amount) > refundable + 0.001) {
    throw new Error(`Refund amount exceeds refundable balance of ${refundable.toFixed(2)}.`);
  }

  const now = Date.now();
  const isChargeback = !!input.chargeback || input.type === 'chargeback';
  const [refund] = await db
    .insert(paymentRefunds)
    .values({
      transactionId: input.transactionId,
      refundRef: input.refundRef ?? `REF-${now}-${Math.floor(Math.random() * 10000)}`,
      amount: toMoney(input.amount),
      reason: input.reason,
      type: input.type,
      chargeback: isChargeback,
      status: 'requested',
      initiatedBy: input.initiatedBy ?? null,
      createdAt: now,
    })
    .returning();

  await db
    .update(paymentTransactions)
    .set({ status: 'disputed', updatedAt: now })
    .where(eq(paymentTransactions.id, input.transactionId));

  if (isChargeback) {
    await db.update(paymentTransactions).set({ status: 'chargeback', updatedAt: now }).where(eq(paymentTransactions.id, input.transactionId));
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
  const refund = await db.query.paymentRefunds.findFirst({ where: eq(paymentRefunds.id, id) });
  if (!refund) throw new Error('Refund not found.');
  if (refund.status !== 'requested') throw new Error('Only requested refunds can be approved.');

  if (!approved) {
    await db.update(paymentRefunds).set({ status: 'failed' }).where(eq(paymentRefunds.id, id));
    restoreOriginalStatus(refund.transactionId);
    return { ...refund, status: 'failed' };
  }

  const now = Date.now();
  const original = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, refund.transactionId) });
  if (!original) throw new Error('Original transaction not found.');

  const result = await db.transaction(async (tx) => {
    await tx.update(paymentRefunds).set({ status: 'approved', approvedBy: actorId ?? null, processedAt: now }).where(eq(paymentRefunds.id, id));

    const refundTxn = await createTransaction({
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
    });

    const assetAccountName = channelAssetName(original.channel);
    const assetAccount = (await findAccount(assetAccountName)) ?? (await ensureDefault(assetAccountName));
    const refundAccount = (await findAccount('Refunds')) ?? (await ensureDefault('Refunds'));
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

    await tx.update(paymentRefunds).set({ journalEntryId: journal.entry.id }).where(eq(paymentRefunds.id, id));

    const remaining = Math.round((toNum(original.amount) - toNum(refund.amount)) * 100) / 100;
    const newStatus = remaining <= 0 ? 'fully_refunded' : 'partially_refunded';
    await tx.update(paymentTransactions).set({ status: newStatus, refundRef: refund.refundRef, updatedAt: now }).where(eq(paymentTransactions.id, original.id));

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

const channelAssetName = (channel: string): string => {
  const map: Record<string, string> = {
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
  return map[channel] ?? 'Bank Account';
};

const ensureDefault = async (name: string) => {
  const { ensureAccountExists } = await import('./journal.service.js');
  return ensureAccountExists(name);
};

const restoreOriginalStatus = async (transactionId: number) => {
  const original = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, transactionId) });
  if (original && (original.status === 'disputed' || original.status === 'chargeback')) {
    await db.update(paymentTransactions).set({ status: 'successful', updatedAt: Date.now() }).where(eq(paymentTransactions.id, transactionId));
  }
};

export const listRefunds = async (opts: { from?: number; to?: number; status?: string; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(gte(paymentRefunds.createdAt, opts.from));
  if (opts.to) conditions.push(lte(paymentRefunds.createdAt, opts.to));
  if (opts.status) conditions.push(eq(paymentRefunds.status, opts.status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const refunds = await db.query.paymentRefunds.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(paymentRefunds).where(where ?? sql`1=1`);
  return {
    items: refunds.map((r) => ({ ...r, _id: String(r.id), amount: toNum(r.amount) })),
    page,
    limit,
    total: Number(counts[0]?.count ?? 0),
    totalPages: Math.ceil(Number(counts[0]?.count ?? 0) / limit),
  };
};