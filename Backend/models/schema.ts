import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  jsonb,
  boolean,
  bigint,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  phone: text('phone').default(''),
  address: jsonb('address').$type<Record<string, string>>().default({}),
  cartData: jsonb('cart_data').$type<Record<string, Record<string, number>>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  image: jsonb('image').$type<string[]>().notNull().default([]),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  colors: jsonb('colors').$type<string[]>().notNull().default([]),
  bestseller: boolean('bestseller').default(false),
  date: bigint('date', { mode: 'number' }).notNull(),
});

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

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  layer: text('layer').notNull(),
  icon: text('icon').notNull().default('🌿'),
  color: text('color').notNull().default('#C586A5'),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
});

export const perfumebases = pgTable('perfumebases', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull().default(''),
  extraPrice: numeric('extra_price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
});