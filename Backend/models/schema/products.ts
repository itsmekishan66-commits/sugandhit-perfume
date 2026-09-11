import { pgTable, serial, text, numeric, jsonb, boolean, bigint } from 'drizzle-orm/pg-core';

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