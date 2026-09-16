import { pgTable, serial, text, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  poNumber: text('po_number').notNull(),
  supplierId: integer('supplier_id').notNull(),
  orderDate: bigint('order_date', { mode: 'number' }).notNull(),
  expectedDate: bigint('expected_date', { mode: 'number' }),
  receivedDate: bigint('received_date', { mode: 'number' }),
  status: text('status').notNull().default('ordered'),
  subTotal: numeric('sub_total', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  notes: text('notes').notNull().default(''),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

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
