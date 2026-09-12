import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const wishlistitems = pgTable(
  'wishlistitems',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    productId: text('product_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('wishlistitems_user_product_unique').on(t.userId, t.productId),
  ]
);