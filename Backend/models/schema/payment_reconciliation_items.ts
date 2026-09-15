import { pgTable, serial, text, integer, numeric, boolean, bigint } from 'drizzle-orm/pg-core';

export const paymentReconciliationItems = pgTable('payment_reconciliation_items', {
  id: serial('id').primaryKey(),
  reconciliationId: integer('reconciliation_id').notNull(),
  transactionId: integer('transaction_id'),
  externalRef: text('external_ref').notNull().default(''),
  externalAmount: numeric('external_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  matched: boolean('matched').notNull().default(false),
  matchType: text('match_type').notNull().default(''),
  discrepancy: numeric('discrepancy', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('unmatched'),
  notes: text('notes').notNull().default(''),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});