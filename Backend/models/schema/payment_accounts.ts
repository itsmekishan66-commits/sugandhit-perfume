import { pgTable, serial, text, integer, numeric, boolean, bigint } from 'drizzle-orm/pg-core';

export const paymentAccounts = pgTable('payment_accounts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  accountType: text('account_type').notNull(),
  provider: text('provider').notNull().default(''),
  currency: text('currency').notNull().default('NPR'),
  openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  accountNumber: text('account_number').notNull().default(''),
  branch: text('branch').notNull().default(''),
  active: boolean('active').notNull().default(true),
  notes: text('notes').notNull().default(''),
  createdBy: integer('created_by'),
  updatedBy: integer('updated_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});