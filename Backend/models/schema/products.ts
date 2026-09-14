import { pgTable, serial, text, numeric, jsonb, boolean, bigint, integer } from 'drizzle-orm/pg-core';

export interface ProductVariant {
  name: string;
  price: string;
  description: string;
  image: string;
}

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  image: jsonb('image').$type<string[]>().notNull().default([]),
  category: text('category').notNull(),
  subCategory: text('sub_category').notNull(),
  colors: jsonb('colors').$type<ProductVariant[]>().notNull().default([]),
  bestseller: boolean('bestseller').default(false),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('4.5'),
  reviews: integer('reviews').default(0),
  badge: text('badge'),
  date: bigint('date', { mode: 'number' }).notNull(),
});