import { and, eq, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { paymentReconciliations, paymentReconciliationItems, paymentTransactions } from '../models/schema/index.js';
import { createAuditLog } from './audit.service.js';
import { toMoney, toNum } from '../utils/money.js';

export interface ReconciliationInput {
  paymentAccountId: number;
  periodStart: number;
  periodEnd: number;
  openingExternalBalance?: number;
  closingExternalBalance?: number;
  notes?: string;
  createdBy?: number;
}

export const createReconciliation = async (input: ReconciliationInput) => {
  const existing = await db.query.paymentReconciliations.findFirst({
    where: and(
      eq(paymentReconciliations.paymentAccountId, input.paymentAccountId),
      eq(paymentReconciliations.status, 'in_progress')
    ),
  });
  if (existing) throw new Error('An in-progress reconciliation already exists for this account.');

  const [rec] = await db
    .insert(paymentReconciliations)
    .values({
      paymentAccountId: input.paymentAccountId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      openingExternalBalance: toMoney(input.openingExternalBalance ?? 0),
      closingExternalBalance: toMoney(input.closingExternalBalance ?? 0),
      notes: input.notes ?? '',
      createdBy: input.createdBy ?? null,
      createdAt: Date.now(),
    })
    .returning();

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
  const txns = await db.query.paymentTransactions.findMany({
    where: and(eq(paymentTransactions.paymentAccountId, accountId), sql`${paymentTransactions.initiatedAt} >= ${from} AND ${paymentTransactions.initiatedAt} <= ${to}`),
  });
  for (const txn of txns) {
    const match = await db.query.paymentReconciliationItems.findFirst({
      where: and(
        eq(paymentReconciliationItems.reconciliationId, reconciliationId),
        eq(paymentReconciliationItems.externalRef, txn.providerTransactionId || txn.transactionId)
      ),
    });
    if (match) {
      const discrepancy = Math.round((toNum(match.externalAmount) - toNum(txn.netAmount)) * 100) / 100;
      await db.update(paymentReconciliationItems).set({
        transactionId: txn.id,
        matched: discrepancy === 0,
        matchType: 'provider_ref',
        discrepancy: toMoney(discrepancy),
        status: discrepancy === 0 ? 'matched' : 'amount_mismatch',
      }).where(eq(paymentReconciliationItems.id, match.id));
      await db.update(paymentTransactions).set({ reconciliationStatus: discrepancy === 0 ? 'matched' : 'partial' }).where(eq(paymentTransactions.id, txn.id));
    }
  }
};

export const listReconciliations = async (accountId?: number) => {
  const items = await db.query.paymentReconciliations.findMany({
    where: accountId ? (t, { eq }) => eq(t.paymentAccountId, accountId) : undefined,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return Promise.all(
    items.map(async (r) => {
      const detail = await getReconciliation(r.id);
      return { ...detail, _id: String(r.id) };
    })
  );
};

export const getReconciliation = async (id: number) => {
  const rec = await db.query.paymentReconciliations.findFirst({ where: eq(paymentReconciliations.id, id) });
  if (!rec) throw new Error('Reconciliation not found.');
  const items = await db.query.paymentReconciliationItems.findMany({
    where: eq(paymentReconciliationItems.reconciliationId, id),
    orderBy: (t, { asc }) => [asc(t.id)],
  });
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
    { total: 0, matched: 0, missingInternal: 0, missingExternal: 0, mismatched: 0, duplicates: 0, discrepancy: 0 }
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
  const item = await db.query.paymentReconciliationItems.findFirst({
    where: and(
      eq(paymentReconciliationItems.reconciliationId, input.reconciliationId),
      eq(paymentReconciliationItems.externalRef, input.externalRef ?? '')
    ),
  });
  if (item) throw new Error('An item with this external reference already exists.');

  const [created] = await db
    .insert(paymentReconciliationItems)
    .values({
      reconciliationId: input.reconciliationId,
      externalRef: input.externalRef ?? '',
      externalAmount: toMoney(input.externalAmount ?? 0),
      status: 'missing_internal',
      createdAt: Date.now(),
    })
    .returning();

  const rec = await db.query.paymentReconciliations.findFirst({ where: eq(paymentReconciliations.id, input.reconciliationId) });
  if (rec) {
    await autoMatch(rec.id, rec.paymentAccountId, rec.periodStart, rec.periodEnd);
  }
  return created;
};

export const matchReconciliationItem = async (itemId: number, transactionId: number, actorId?: number) => {
  const item = await db.query.paymentReconciliationItems.findFirst({ where: eq(paymentReconciliationItems.id, itemId) });
  if (!item) throw new Error('Reconciliation item not found.');
  const txn = await db.query.paymentTransactions.findFirst({ where: eq(paymentTransactions.id, transactionId) });
  if (!txn) throw new Error('Transaction not found.');

  const discrepancy = Math.round((toNum(item.externalAmount) - toNum(txn.netAmount)) * 100) / 100;
  await db
    .update(paymentReconciliationItems)
    .set({ transactionId, matched: discrepancy === 0, matchType: 'manual', discrepancy: toMoney(discrepancy), status: discrepancy === 0 ? 'matched' : 'amount_mismatch' })
    .where(eq(paymentReconciliationItems.id, itemId));
  await db.update(paymentTransactions).set({ reconciliationStatus: discrepancy === 0 ? 'matched' : 'partial' }).where(eq(paymentTransactions.id, transactionId));

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
  const rec = await db.query.paymentReconciliations.findFirst({ where: eq(paymentReconciliations.id, id) });
  if (!rec) throw new Error('Reconciliation not found.');
  if (rec.status === 'locked') throw new Error('Reconciliation is already locked.');

  const items = await db.query.paymentReconciliationItems.findMany({ where: eq(paymentReconciliationItems.reconciliationId, id) });
  for (const item of items) {
    if (item.matched && item.transactionId) {
      await db.update(paymentTransactions).set({ reconciliationStatus: 'reconciled' }).where(eq(paymentTransactions.id, item.transactionId));
    }
  }
  await db.update(paymentReconciliations).set({ status: 'locked', lockedAt: Date.now() }).where(eq(paymentReconciliations.id, id));

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
  const rows = await db
    .select({
      reconciliationStatus: paymentTransactions.reconciliationStatus,
      status: paymentTransactions.status,
      amount: paymentTransactions.netAmount,
      transactionId: paymentTransactions.id,
    })
    .from(paymentTransactions)
    .where(condition);

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