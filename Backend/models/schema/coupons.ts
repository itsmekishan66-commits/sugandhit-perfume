import { pgTable, serial, text, numeric, bigint, boolean } from 'drizzle-orm/pg-core';

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  image: text('image').notNull().default(''),
  discountType: text('discount_type').notNull().default('percent'),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
  minPurchase: numeric('min_purchase', { precision: 12, scale: 2 }).notNull().default('0'),
  maxDiscount: numeric('max_discount', { precision: 12, scale: 2 }),
  validFrom: bigint('valid_from', { mode: 'number' }).notNull(),
  validTill: bigint('valid_till', { mode: 'number' }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});