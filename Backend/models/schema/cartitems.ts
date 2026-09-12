import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const cartitems = pgTable(
  'cartitems',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    productId: text('product_id').notNull(),
    size: text('size').notNull(),
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('cartitems_user_product_size_unique').on(t.userId, t.productId, t.size),
  ]
);