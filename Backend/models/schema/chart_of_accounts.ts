import { pgTable, serial, text, integer, boolean, bigint } from 'drizzle-orm/pg-core';

export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  accountType: text('account_type').notNull(),
  normalBalance: text('normal_balance').notNull().default('debit'),
  parentId: integer('parent_id'),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});