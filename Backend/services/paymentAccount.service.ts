import { eq, and } from 'drizzle-orm';
import db from '../config/db.js';
import { paymentAccounts, paymentTransactions } from '../models/schema/index.js';
import { toNum, toMoney } from '../utils/money.js';

export interface PaymentAccountInput {
  name: string;
  accountType: string;
  provider?: string;
  currency?: string;
  openingBalance?: number;
  accountNumber?: string;
  branch?: string;
  notes?: string;
  createdBy?: number;
}

export const createPaymentAccount = async (input: PaymentAccountInput) => {
  const now = Date.now();
  const [account] = await db
    .insert(paymentAccounts)
    .values({
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
    })
    .returning();
  return serializePaymentAccount(account);
};

export const listPaymentAccounts = async (opts: { active?: string; type?: string } = {}) => {
  const conditions: ReturnType<typeof eq>[] = [];
  if (opts.active && opts.active !== 'all') conditions.push(eq(paymentAccounts.active, opts.active === 'true'));
  if (opts.type) conditions.push(eq(paymentAccounts.accountType, opts.type));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const accounts = await db.query.paymentAccounts.findMany({ where, orderBy: (t, { asc }) => [asc(t.name)] });
  return Promise.all(accounts.map(serializePaymentAccount));
};

export const getPaymentAccount = async (id: number) => {
  const account = await db.query.paymentAccounts.findFirst({ where: eq(paymentAccounts.id, id) });
  if (!account) throw new Error('Payment account not found.');
  return serializePaymentAccount(account);
};

export const updatePaymentAccount = async (id: number, patch: Partial<PaymentAccountInput> & { active?: boolean }, updatedBy?: number) => {
  const account = await db.query.paymentAccounts.findFirst({ where: eq(paymentAccounts.id, id) });
  if (!account) throw new Error('Payment account not found.');
  const update: Record<string, unknown> = { ...(patch as object), updatedAt: Date.now(), updatedBy: updatedBy ?? null };
  if (patch.openingBalance !== undefined) update.openingBalance = toMoney(patch.openingBalance);
  if (typeof update.active !== 'boolean') delete update.active;
  const cleaned = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
  await db.update(paymentAccounts).set(cleaned).where(eq(paymentAccounts.id, id));
  return getPaymentAccount(id);
};

export const deactivatePaymentAccount = async (id: number, updatedBy?: number) => {
  const account = await db.query.paymentAccounts.findFirst({ where: eq(paymentAccounts.id, id) });
  if (!account) throw new Error('Payment account not found.');
  await db
    .update(paymentAccounts)
    .set({ active: false, updatedAt: Date.now(), updatedBy: updatedBy ?? null })
    .where(eq(paymentAccounts.id, id));
  return getPaymentAccount(id);
};

export const serializePaymentAccount = async (a: typeof paymentAccounts.$inferSelect) => {
  const transactions = await db.query.paymentTransactions.findMany({ where: eq(paymentTransactions.paymentAccountId, a.id) });
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

export const getPaymentAccountLedger = async (id: number) => {
  const account = await getPaymentAccount(id);
  return {
    account,
    transactions: await db.query.paymentTransactions.findMany({
      where: eq(paymentTransactions.paymentAccountId, id),
      orderBy: (t, { desc }) => [desc(t.initiatedAt)],
    }),
  };
};