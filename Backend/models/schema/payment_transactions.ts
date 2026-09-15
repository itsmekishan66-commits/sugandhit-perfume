import { pgTable, serial, text, integer, numeric, jsonb, bigint } from 'drizzle-orm/pg-core';

export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  providerTransactionId: text('provider_transaction_id').notNull().default(''),
  orderId: integer('order_id'),
  customOrderId: integer('custom_order_id'),
  invoiceRef: text('invoice_ref').notNull().default(''),
  customerId: integer('customer_id'),
  customerName: text('customer_name').notNull().default(''),
  paymentAccountId: integer('payment_account_id'),
  channel: text('channel').notNull(),
  paymentMethod: text('payment_method').notNull().default(''),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NPR'),
  processingFee: numeric('processing_fee', { precision: 12, scale: 2 }).notNull().default('0'),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('initiated'),
  intent: text('intent').notNull().default(''),
  transactionType: text('transaction_type').notNull().default('payment'),
  initiatedAt: bigint('initiated_at', { mode: 'number' }).notNull(),
  completedAt: bigint('completed_at', { mode: 'number' }),
  settlementAt: bigint('settlement_at', { mode: 'number' }),
  failureReason: text('failure_reason').notNull().default(''),
  refundRef: text('refund_ref').notNull().default(''),
  reconciliationStatus: text('reconciliation_status').notNull().default('unreconciled'),
  source: text('source').notNull().default(''),
  audit: jsonb('audit').$type<Record<string, unknown>[]>().notNull().default([]),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const paymentTransactionIndexes = {
  transactionId: 'transaction_id',
  providerTransactionId: 'provider_transaction_id',
};