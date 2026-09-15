import { pgTable, serial, integer, numeric, text, jsonb } from 'drizzle-orm/pg-core';

export const journalEntryLines = pgTable('journal_entry_lines', {
  id: serial('id').primaryKey(),
  journalEntryId: integer('journal_entry_id').notNull(),
  accountId: integer('account_id').notNull(),
  debit: numeric('debit', { precision: 12, scale: 2 }).notNull().default('0'),
  credit: numeric('credit', { precision: 12, scale: 2 }).notNull().default('0'),
  description: text('description').notNull().default(''),
  costCenter: text('cost_center').notNull().default(''),
  taxInfo: jsonb('tax_info').$type<Record<string, unknown>>().notNull().default({}),
});