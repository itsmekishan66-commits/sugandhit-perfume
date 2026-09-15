import { and, eq, lte } from 'drizzle-orm';
import db from '../config/db.js';
import { accountingPeriods } from '../models/schema/index.js';
import { createAuditLog } from './audit.service.js';

export interface PeriodInput {
  name: string;
  startDate: number;
  endDate: number;
}

export const listPeriods = async () => {
  const rows = await db.query.accountingPeriods.findMany({
    orderBy: (t, { desc }) => [desc(t.startDate)],
  });
  return rows.map((p) => ({ ...p, _id: String(p.id) }));
};

export const createPeriod = async (input: PeriodInput) => {
  const overlap = await db.query.accountingPeriods.findFirst({
    where: and(eq(accountingPeriods.status, 'open'), lte(accountingPeriods.startDate, input.endDate)),
  });
  if (overlap) throw new Error('Period overlaps with the current open period.');

  const [period] = await db
    .insert(accountingPeriods)
    .values({
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'open',
      createdAt: Date.now(),
    })
    .returning();
  return { ...period, _id: String(period.id) };
};

export const closePeriod = async (id: number, actorId?: number) => {
  const period = await db.query.accountingPeriods.findFirst({ where: eq(accountingPeriods.id, id) });
  if (!period) throw new Error('Period not found.');
  if (period.status !== 'open') throw new Error('Only open periods can be closed.');
  await db
    .update(accountingPeriods)
    .set({ status: 'closed', closedBy: actorId ?? null, closedAt: Date.now() })
    .where(eq(accountingPeriods.id, id));

  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'accounting.period_close',
    entityType: 'accounting_period',
    entityId: id,
    newValue: { name: period.name, startDate: period.startDate, endDate: period.endDate },
  });
  return { ...period, status: 'closed' };
};

export const reopenPeriod = async (id: number, actorId?: number) => {
  const period = await db.query.accountingPeriods.findFirst({ where: eq(accountingPeriods.id, id) });
  if (!period) throw new Error('Period not found.');
  if (period.status !== 'closed') throw new Error('Only closed periods can be reopened.');
  await db.update(accountingPeriods).set({ status: 'open', closedAt: null, closedBy: null }).where(eq(accountingPeriods.id, id));
  await createAuditLog({
    actorId,
    actorRole: 'admin',
    action: 'accounting.period_reopen',
    entityType: 'accounting_period',
    entityId: id,
  });
  return { ...period, status: 'open' };
};

export const getCurrentPeriod = async () => {
  const rows = await db.query.accountingPeriods.findMany({
    where: eq(accountingPeriods.status, 'open'),
    orderBy: (t, { asc }) => [asc(t.startDate)],
  });
  return rows[0] ?? null;
};

export const assertDateNotInClosedPeriod = async (date: number) => {
  const closed = await db.query.accountingPeriods.findMany({ where: eq(accountingPeriods.status, 'closed') });
  const hit = closed.find((p) => p.startDate <= date && date <= p.endDate);
  if (hit) throw new Error(`Cannot post to '${hit.name}': the accounting period is closed.`);
};