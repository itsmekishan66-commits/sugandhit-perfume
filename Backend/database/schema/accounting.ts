import { pgTable, serial, text, integer, numeric, boolean, bigint, jsonb } from 'drizzle-orm/pg-core';

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  address: text('address').notNull().default(''),
  category: text('category').notNull().default(''),
  notes: text('notes').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

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

export const accountsPayablePayments = pgTable('accounts_payable_payments', {
  id: serial('id').primaryKey(),
  payableId: integer('payable_id').notNull(),
  paymentAccountId: integer('payment_account_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reference: text('reference').notNull().default(''),
  paidAt: bigint('paid_at', { mode: 'number' }).notNull(),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  accountType: text('account_type').notNull(),
  normalBalance: text('normal_balance').notNull().default('debit'),
  parentId: integer('parent_id'),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  entryNumber: text('entry_number').notNull(),
  entryDate: bigint('entry_date', { mode: 'number' }).notNull(),
  postingDate: bigint('posting_date', { mode: 'number' }),
  referenceType: text('reference_type').notNull().default(''),
  referenceId: integer('reference_id'),
  description: text('description').notNull().default(''),
  currency: text('currency').notNull().default('NPR'),
  status: text('status').notNull().default('draft'),
  reversalOfId: integer('reversal_of_id'),
  createdBy: integer('created_by'),
  approvedBy: integer('approved_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const journalEntryLines = pgTable('journal_entry_lines', {
  id: serial('id').primaryKey(),
  journalEntryId: integer('journal_entry_id').notNull(),
  accountId: integer('account_id').notNull(),
  debit: numeric('debit', { precision: 12, scale: 2 }).notNull().default('0'),
  credit: numeric('credit', { precision: 12, scale: 2 }).notNull().default('0'),
  description: text('description').notNull().default(''),
  costCenter: text('cost_center').notNull().default(''),
  taxInfo: jsonb('tax_info').$type<Record<string, unknown>>().notNull().default({}),
});

export const accountingPeriods = pgTable('accounting_periods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  startDate: bigint('start_date', { mode: 'number' }).notNull(),
  endDate: bigint('end_date', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('open'),
  closedBy: integer('closed_by'),
  closedAt: bigint('closed_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const incomeRecords = pgTable('income_records', {
  id: serial('id').primaryKey(),
  date: bigint('date', { mode: 'number' }).notNull(),
  source: text('source').notNull().default(''),
  accountId: integer('account_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentAccountId: integer('payment_account_id'),
  reference: text('reference').notNull().default(''),
  description: text('description').notNull().default(''),
  journalEntryId: integer('journal_entry_id'),
  createdBy: integer('created_by'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const expenseRecords = pgTable('expense_records', {
  id: serial('id').primaryKey(),
  date: bigint('date', { mode: 'number' }).notNull(),
  vendorId: integer('vendor_id'),
  vendorName: text('vendor_name').notNull().default(''),
  accountId: integer('account_id').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  paymentAccountId: integer('payment_account_id'),
  dueDate: bigint('due_date', { mode: 'number' }),
  description: text('description').notNull().default(''),
  attachment: text('attachment').notNull().default(''),
  approvalStatus: text('approval_status').notNull().default('pending'),
  createdBy: integer('created_by'),
  approvedBy: integer('approved_by'),
  journalEntryId: integer('journal_entry_id'),
  paymentJournalEntryId: integer('payment_journal_entry_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: integer('actor_id'),
  actorRole: text('actor_role').notNull().default(''),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull().default(''),
  previousValue: jsonb('previous_value').$type<Record<string, unknown>>().notNull().default({}),
  newValue: jsonb('new_value').$type<Record<string, unknown>>().notNull().default({}),
  reason: text('reason').notNull().default(''),
  ip: text('ip').notNull().default(''),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});
