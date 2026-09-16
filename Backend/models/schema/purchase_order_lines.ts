import { pgTable, serial, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0'),
  lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull().default('0'),
  reorderLevel: integer('reorder_level'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});