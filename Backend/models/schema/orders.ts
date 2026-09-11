import { pgTable, serial, integer, text, numeric, jsonb, boolean, bigint } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  items: jsonb('items').$type<Record<string, unknown>[]>().notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  address: jsonb('address').$type<Record<string, string>>().notNull(),
  status: text('status').notNull().default('Order Placed'),
  paymentMethod: text('payment_method').notNull(),
  payment: boolean('payment').notNull().default(false),
  date: bigint('date', { mode: 'number' }).notNull(),
});