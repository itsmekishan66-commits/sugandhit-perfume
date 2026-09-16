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

export const customorders = pgTable('customorders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull().default('Custom Perfume'),
  bottleSize: text('bottle_size').notNull().default('50ml'),
  topNotes: jsonb('top_notes').$type<string[]>().notNull(),
  heartNotes: jsonb('heart_notes').$type<string[]>().notNull(),
  baseNotes: jsonb('base_notes').$type<string[]>().notNull(),
  perfumeBase: text('perfume_base').notNull(),
  strength: text('strength').notNull().default('EDP'),
  strengthName: text('strength_name').notNull().default('Eau de Parfum'),
  customLabel: text('custom_label').notNull().default(''),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('Order Placed'),
  paymentMethod: text('payment_method').notNull().default('COD'),
  payment: boolean('payment').notNull().default(false),
  address: jsonb('address').$type<Record<string, string>>().notNull(),
  date: bigint('date', { mode: 'number' }).notNull(),
});
