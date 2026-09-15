import { pgTable, serial, text, integer, bigint } from 'drizzle-orm/pg-core';

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  entryNumber: text('entry_number').notNull(),
  entryDate: bigint('entry_date', { mode: 'number' }).notNull(),
  postingDate: bigint('posting_date', { mode: 'number' }),
  referenceType: text('reference_type').notNull().default(''),
  referenceId: integer('reference_id'),
  description: text('description').notNull().default(''),
  currency: text('currency').notNull().default('NPR'),
  status: text('status').notNull().default('draft'),
  reversalOfId: integer('reversal_of_id'),
  createdBy: integer('created_by'),
  approvedBy: integer('approved_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});