import { pgTable, serial, text, integer, numeric, boolean, bigint } from 'drizzle-orm/pg-core';

export const paymentRefunds = pgTable('payment_refunds', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').notNull(),
  refundRef: text('refund_ref').notNull().default(''),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull().default(''),
  type: text('type').notNull().default('full_refund'),
  status: text('status').notNull().default('requested'),
  chargeback: boolean('chargeback').notNull().default(false),
  initiatedBy: integer('initiated_by'),
  approvedBy: integer('approved_by'),
  journalEntryId: integer('journal_entry_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  processedAt: bigint('processed_at', { mode: 'number' }),
});