import { pgTable, serial, text, numeric, boolean } from 'drizzle-orm/pg-core';

export const perfumebases = pgTable('perfumebases', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull().default(''),
  extraPrice: numeric('extra_price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
});