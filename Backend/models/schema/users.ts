import { pgTable, serial, text, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  phone: text('phone').default(''),
  address: jsonb('address').$type<Record<string, string>>().default({}),
  image: text('image').default(''),
  credit: numeric('credit', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});