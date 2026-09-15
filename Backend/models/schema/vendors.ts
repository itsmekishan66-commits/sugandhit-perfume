import { pgTable, serial, text, boolean, bigint, integer } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  address: text('address').notNull().default(''),
  category: text('category').notNull().default(''),
  notes: text('notes').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});