import { pgTable, serial, text, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const accountsPayablePayments = pgTable('accounts_payable_payments', {
  id: serial('id').primaryKey(),
  payableId: integer('payable_id').notNull(),
  paymentAccountId: integer('payment_account_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reference: text('reference').notNull().default(''),
  paidAt: bigint('paid_at', { mode: 'number' }).notNull(),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});