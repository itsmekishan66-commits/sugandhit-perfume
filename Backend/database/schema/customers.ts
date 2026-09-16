import { pgTable, serial, integer, text, numeric, timestamp, unique, bigint } from 'drizzle-orm/pg-core';

export const cartitems = pgTable(
  'cartitems',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    productId: text('product_id').notNull(),
    size: text('size').notNull(),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [unique('cartitems_user_product_size_unique').on(t.userId, t.productId, t.size)]
);

export const wishlistitems = pgTable(
  'wishlistitems',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    productId: text('product_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [unique('wishlistitems_user_product_unique').on(t.userId, t.productId)]
);

export const accountsReceivable = pgTable('accounts_receivable', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull(),
  orderId: integer('order_id'),
  customOrderId: integer('custom_order_id'),
  invoiceRef: text('invoice_ref').notNull().default(''),
  invoiceDate: bigint('invoice_date', { mode: 'number' }).notNull(),
  dueDate: bigint('due_date', { mode: 'number' }).notNull(),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  creditApplied: numeric('credit_applied', { precision: 12, scale: 2 }).notNull().default('0'),
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  outstandingAmount: numeric('outstanding_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('unpaid'),
  writeOffReason: text('write_off_reason').notNull().default(''),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const accountsReceivablePayments = pgTable('accounts_receivable_payments', {
  id: serial('id').primaryKey(),
  receivableId: integer('receivable_id').notNull(),
  paymentTransactionId: integer('payment_transaction_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  appliedAt: bigint('applied_at', { mode: 'number' }).notNull(),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
