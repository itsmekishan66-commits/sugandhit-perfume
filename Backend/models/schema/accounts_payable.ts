import { pgTable, serial, text, integer, numeric, bigint } from 'drizzle-orm/pg-core';

export const accountsPayable = pgTable('accounts_payable', {
  id: serial('id').primaryKey(),
  vendorId: integer('vendor_id').notNull(),
  billRef: text('bill_ref').notNull().default(''),
  category: text('category').notNull().default(''),
  billDate: bigint('bill_date', { mode: 'number' }).notNull(),
  dueDate: bigint('due_date', { mode: 'number' }).notNull(),
  originalAmount: numeric('original_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  outstandingAmount: numeric('outstanding_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('unpaid'),
  approvalStatus: text('approval_status').notNull().default('pending'),
  notes: text('notes').notNull().default(''),
  createdBy: integer('created_by'),
  approvedBy: integer('approved_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});