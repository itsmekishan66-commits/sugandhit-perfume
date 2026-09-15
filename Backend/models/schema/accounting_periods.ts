import { pgTable, serial, text, bigint, integer } from 'drizzle-orm/pg-core';

export const accountingPeriods = pgTable('accounting_periods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  startDate: bigint('start_date', { mode: 'number' }).notNull(),
  endDate: bigint('end_date', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('open'),
  closedBy: integer('closed_by'),
  closedAt: bigint('closed_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});