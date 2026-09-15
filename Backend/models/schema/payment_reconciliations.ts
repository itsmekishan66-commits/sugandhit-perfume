import { pgTable, serial, text, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const paymentReconciliations = pgTable('payment_reconciliations', {
  id: serial('id').primaryKey(),
  paymentAccountId: integer('payment_account_id').notNull(),
  periodStart: bigint('period_start', { mode: 'number' }).notNull(),
  periodEnd: bigint('period_end', { mode: 'number' }).notNull(),
  openingExternalBalance: numeric('opening_external_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  closingExternalBalance: numeric('closing_external_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('in_progress'),
  notes: text('notes').notNull().default(''),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  lockedAt: bigint('locked_at', { mode: 'number' }),
});