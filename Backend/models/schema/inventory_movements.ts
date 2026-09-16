import { pgTable, serial, text, integer, bigint } from 'drizzle-orm/pg-core';

export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  change: integer('change').notNull(),
  type: text('type').notNull(),
  referenceId: text('reference_id').notNull().default(''),
  qtyBefore: integer('qty_before').notNull(),
  qtyAfter: integer('qty_after').notNull(),
  note: text('note').notNull().default(''),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});