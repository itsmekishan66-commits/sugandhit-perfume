import { pgTable, serial, text, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const incomeRecords = pgTable('income_records', {
  id: serial('id').primaryKey(),
  date: bigint('date', { mode: 'number' }).notNull(),
  source: text('source').notNull().default(''),
  accountId: integer('account_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentAccountId: integer('payment_account_id'),
  reference: text('reference').notNull().default(''),
  description: text('description').notNull().default(''),
  journalEntryId: integer('journal_entry_id'),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});