import { sql, eq, and } from 'drizzle-orm';
import db from '../config/db.js';
import { paymentTransactions, paymentAccounts, paymentProviderEvents } from '../models/schema/index.js';
import { toNum, sum } from '../utils/money.js';
import { channelTotals } from './paymentTransaction.service.js';
import { getTotalOutstanding } from './accountsReceivable.service.js';

const dayStart = (daysBack: number) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - daysBack);
  return now.getTime();
};

export const getPaymentOverview = async (opts: { from?: number; to?: number; channel?: string; status?: string; accountId?: number } = {}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(sql`${paymentTransactions.initiatedAt} >= ${opts.from}`);
  if (opts.to) conditions.push(sql`${paymentTransactions.initiatedAt} <= ${opts.to}`);
  if (opts.channel) conditions.push(eq(paymentTransactions.channel, opts.channel));
  if (opts.status) conditions.push(eq(paymentTransactions.status, opts.status));
  if (opts.accountId) conditions.push(eq(paymentTransactions.paymentAccountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const all = await db.query.paymentTransactions.findMany({ where });
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

  const unprocessedEvents = await db.select({ count: sql<number>`count(*)` }).from(paymentProviderEvents).where(eq(paymentProviderEvents.processed, false));

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
    outstandingPayables: Math.round(sum((await db.query.accountsPayable.findMany()).map((p) => toNum(p.outstandingAmount))) * 100) / 100,
    awaitingSettlement: Math.round(sum(filtered.filter((t) => ['esewa', 'khalti', 'card', 'gateway'].includes(t.channel) && t.status === 'successful').map((t) => toNum(t.netAmount))) * 100) / 100,
    successRate,
    channelTotals: channelTotals(filtered),
    unprocessedWebhookEvents: Number(unprocessedEvents[0]?.count ?? 0),
  };
};

export const getPaymentChannelReport = async (opts: { from?: number; to?: number; accountId?: number } = {}) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (opts.from) conditions.push(sql`${paymentTransactions.initiatedAt} >= ${opts.from}`);
  if (opts.to) conditions.push(sql`${paymentTransactions.initiatedAt} <= ${opts.to}`);
  if (opts.accountId) conditions.push(eq(paymentTransactions.paymentAccountId, opts.accountId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const all = await db.query.paymentTransactions.findMany({ where });
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
  const accountCount = await db.select({ count: sql<number>`count(*)` }).from(paymentAccounts);
  return {
    configured: Number(accountCount[0]?.count ?? 0) > 0,
    accountCount: Number(accountCount[0]?.count ?? 0),
    note: 'Payment gateways are wired through provider webhooks. Add at least one payment account to begin recording payments.',
  };
};