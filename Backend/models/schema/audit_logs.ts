import { pgTable, serial, text, integer, jsonb, bigint } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id'),
  actorRole: text('actor_role').notNull().default(''),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull().default(''),
  previousValue: jsonb('previous_value').$type<Record<string, unknown>>().notNull().default({}),
  newValue: jsonb('new_value').$type<Record<string, unknown>>().notNull().default({}),
  reason: text('reason').notNull().default(''),
  ip: text('ip').notNull().default(''),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});