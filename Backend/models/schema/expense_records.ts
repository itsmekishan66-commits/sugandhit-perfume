import { pgTable, serial, text, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const expenseRecords = pgTable('expense_records', {
  id: serial('id').primaryKey(),
  date: bigint('date', { mode: 'number' }).notNull(),
  vendorId: integer('vendor_id'),
  vendorName: text('vendor_name').notNull().default(''),
  accountId: integer('account_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  paymentAccountId: integer('payment_account_id'),
  dueDate: bigint('due_date', { mode: 'number' }),
  description: text('description').notNull().default(''),
  attachment: text('attachment').notNull().default(''),
  approvalStatus: text('approval_status').notNull().default('pending'),
  createdBy: integer('created_by'),
  approvedBy: integer('approved_by'),
  journalEntryId: integer('journal_entry_id'),
  paymentJournalEntryId: integer('payment_journal_entry_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});