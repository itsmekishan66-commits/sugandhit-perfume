import { and, eq, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { auditLogs } from '../models/schema/index.js';

export interface AuditLogInput {
  actorId?: number | null;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  ip?: string;
}

export const createAuditLog = async (input: AuditLogInput) => {
  await db.insert(auditLogs).values({
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? '',
    action: input.action,
    entityType: input.entityType,
    entityId: String(input.entityId ?? ''),
    previousValue: input.previousValue ?? {},
    newValue: input.newValue ?? {},
    reason: input.reason ?? '',
    ip: input.ip ?? '',
    createdAt: Date.now(),
  });
};

export const listAuditLogs = async (entityType?: string, entityId?: string | number) => {
  const conditions: ReturnType<typeof sql>[] = [];
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (entityId !== undefined) conditions.push(eq(auditLogs.entityId, String(entityId)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const logs = await db.query.auditLogs.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 200,
  });
  return logs.map((l) => ({ ...l, _id: String(l.id) }));
};