import type {
  chartOfAccounts,
  journalEntries,
  journalEntryLines,
  accountingPeriods,
  incomeRecords,
  expenseRecords,
  accountsPayable,
  accountsPayablePayments,
  auditLogs,
} from '../../database/schema/index.js';

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalLine = typeof journalEntryLines.$inferSelect;
export type Period = typeof accountingPeriods.$inferSelect;
export type IncomeRecord = typeof incomeRecords.$inferSelect;
export type ExpenseRecord = typeof expenseRecords.$inferSelect;
export type Payable = typeof accountsPayable.$inferSelect;
export type PayablePayment = typeof accountsPayablePayments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export interface ChartAccountInput {
  code: string;
  name: string;
  accountType: string;
  normalBalance?: 'debit' | 'credit';
  parentId?: number;
  description?: string;
  createdBy?: number;
}

export interface JournalLineInput {
  accountId: number;
  debit?: number | string;
  credit?: number | string;
  description?: string;
  costCenter?: string;
}

export interface JournalEntryInput {
  entryDate: number;
  postingDate?: number;
  referenceType?: string;
  referenceId?: number;
  description?: string;
  lines: JournalLineInput[];
  createdBy?: number;
  status?: 'draft' | 'posted';
}

export interface PostJournalResult {
  entry: JournalEntry;
  lines: JournalLine[];
}

export interface PeriodInput {
  name: string;
  startDate: number;
  endDate: number;
}

export interface IncomeInput {
  date: number;
  source?: string;
  accountId: number;
  amount: number;
  paymentAccountId?: number;
  reference?: string;
  description?: string;
  createdBy?: number;
}

export interface ExpenseInput {
  date: number;
  vendorId?: number;
  vendorName?: string;
  accountId: number;
  amount: number;
  taxAmount?: number;
  paymentAccountId?: number;
  dueDate?: number;
  description?: string;
  attachment?: string;
  createdBy?: number;
}

export interface PayableInput {
  vendorId: number;
  billRef?: string;
  category?: string;
  billDate: number;
  dueDate: number;
  originalAmount: number;
  notes?: string;
  createdBy?: number;
}

export interface PayablePayInput {
  payableId: number;
  paymentAccountId: number;
  amount: number;
  reference?: string;
  createdBy?: number;
  ip?: string;
}

export interface AuditLogInput {
  actorId?: number | null;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  ip?: string;
}

export interface JournalListOpts {
  from?: number;
  to?: number;
  page?: number;
  limit?: number;
}

export interface IncomeListOpts {
  from?: number;
  to?: number;
  accountId?: number;
  page?: number;
  limit?: number;
}

export interface ExpenseListOpts {
  from?: number;
  to?: number;
  accountId?: number;
  paymentStatus?: string;
  approvalStatus?: string;
  page?: number;
  limit?: number;
}

export interface PayableListOpts {
  from?: number;
  to?: number;
  status?: string;
  vendorId?: number;
  approvalStatus?: string;
  page?: number;
  limit?: number;
}