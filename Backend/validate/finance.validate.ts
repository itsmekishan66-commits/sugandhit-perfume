import { z } from 'zod';
import {
  PAYMENT_CHANNELS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  REFUND_TYPES,
  ACCOUNT_TYPES,
  PAYMENT_ACCOUNT_TYPES,
} from '../utils/finance.constants.js';

const anyId = z.union([z.string(), z.number()]).transform(Number);
const dateRange = z.object({
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
});

export const paymentAccountCreateSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required.'),
  accountType: z.enum(PAYMENT_ACCOUNT_TYPES, { message: 'Invalid account type.' }),
  provider: z.string().trim().optional().default(''),
  currency: z.string().trim().optional().default('NPR'),
  openingBalance: z.coerce.number().optional().default(0),
  accountNumber: z.string().trim().optional().default(''),
  branch: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

export const paymentAccountUpdateSchema = paymentAccountCreateSchema
  .partial()
  .extend({ id: anyId, active: z.boolean().optional() });

export const paymentAccountIdSchema = z.object({ id: anyId });

export const paymentAccountListSchema = z.object({
  active: z.enum(['true', 'false', 'all']).optional(),
  type: z.enum(PAYMENT_ACCOUNT_TYPES).optional(),
});

export const manualPaymentSchema = z.object({
  orderId: anyId.optional(),
  customOrderId: anyId.optional(),
  customerId: anyId.optional(),
  customerName: z.string().trim().optional().default(''),
  paymentAccountId: anyId.optional(),
  channel: z.enum(PAYMENT_CHANNELS, { message: 'Invalid payment channel.' }),
  paymentMethod: z.string().trim().optional().default(''),
  amount: z.coerce.number().positive('Amount must be positive.'),
  processingFee: z.coerce.number().min(0).optional().default(0),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  providerTransactionId: z.string().trim().optional().default(''),
  intent: z.string().trim().optional().default(''),
  transactionType: z.enum(TRANSACTION_TYPES).optional().default('payment'),
  source: z.string().trim().optional().default('admin'),
});

export const transactionListSchema = z.object({
  ...dateRange.shape,
  status: z.enum(TRANSACTION_STATUSES).optional(),
  channel: z.enum(PAYMENT_CHANNELS).optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: anyId.optional(),
  customerId: anyId.optional(),
  orderId: anyId.optional(),
  reconciliationStatus: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
});

export const transactionIdSchema = z.object({ id: anyId });

export const webhookEventSchema = z.object({
  provider: z.string().trim().min(1),
  eventId: z.string().trim().min(1),
  eventType: z.string().trim().min(1),
  transactionId: z.string().trim().optional().default(''),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const refundCreateSchema = z.object({
  transactionId: anyId,
  amount: z.coerce.number().positive('Refund amount must be positive.'),
  reason: z.string().trim().min(1, 'Reason is required.'),
  type: z.enum(REFUND_TYPES).optional().default('full_refund'),
  chargeback: z.boolean().optional().default(false),
  refundRef: z.string().trim().optional().default(''),
});

export const refundApproveSchema = z.object({ id: anyId, approved: z.boolean() });
export const refundIdSchema = z.object({ id: anyId });

export const reconciliationCreateSchema = z.object({
  paymentAccountId: anyId,
  periodStart: z.coerce.number().min(1),
  periodEnd: z.coerce.number().min(1),
  openingExternalBalance: z.coerce.number().optional().default(0),
  closingExternalBalance: z.coerce.number().optional().default(0),
  notes: z.string().trim().optional().default(''),
});

export const reconciliationLockSchema = z.object({ id: anyId });
export const reconciliationListSchema = z.object({ accountId: anyId.optional() });

export const reconciliationItemAddSchema = z.object({
  reconciliationId: anyId,
  externalRef: z.string().trim().optional().default(''),
  externalAmount: z.coerce.number().optional().default(0),
});

export const reconciliationMatchSchema = z.object({
  itemId: anyId,
  transactionId: anyId,
});

export const vendorCreateSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required.'),
  email: z.string().trim().optional().default(''),
  phone: z.string().trim().optional().default(''),
  address: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

export const vendorUpdateSchema = vendorCreateSchema.partial().extend({ id: anyId });
export const vendorIdSchema = z.object({ id: anyId });

export const payableCreateSchema = z.object({
  vendorId: anyId,
  billRef: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  billDate: z.coerce.number().min(1),
  dueDate: z.coerce.number().min(1),
  originalAmount: z.coerce.number().positive('Bill amount must be positive.'),
  notes: z.string().trim().optional().default(''),
});

export const payableUpdateSchema = payableCreateSchema.partial().extend({ id: anyId });
export const payableApproveSchema = z.object({ id: anyId, approved: z.boolean() });
export const payablePaySchema = z.object({
  payableId: anyId,
  paymentAccountId: anyId,
  amount: z.coerce.number().positive('Payment amount must be positive.'),
  reference: z.string().trim().optional().default(''),
});

export const payableMaintenanceSchema = z.object({
  id: anyId,
  mode: z.enum(['settle', 'write_off']),
  reason: z.string().trim().optional().default(''),
});

export const receivableAdjustSchema = z.object({
  id: anyId,
  mode: z.enum(['adjust', 'write_off']),
  amount: z.coerce.number().optional(),
  reason: z.string().trim().optional().default(''),
});

export const chartAccountSchema = z.object({
  code: z.string().trim().min(1, 'Account code is required.'),
  name: z.string().trim().min(1, 'Account name is required.'),
  accountType: z.enum(ACCOUNT_TYPES, { message: 'Invalid account type.' }),
  normalBalance: z.enum(['debit', 'credit']).optional().default('debit'),
  parentId: anyId.optional(),
  description: z.string().trim().optional().default(''),
});

export const chartAccountUpdateSchema = chartAccountSchema
  .partial()
  .extend({ id: anyId, active: z.boolean().optional() });

export const journalLineSchema = z.object({
  accountId: anyId,
  debit: z.coerce.number().min(0).optional().default(0),
  credit: z.coerce.number().min(0).optional().default(0),
  description: z.string().trim().optional().default(''),
  costCenter: z.string().trim().optional().default(''),
});

export const journalCreateSchema = z.object({
  entryDate: z.coerce.number().min(1),
  referenceType: z.string().trim().optional().default(''),
  referenceId: anyId.optional(),
  description: z.string().trim().optional().default(''),
  lines: z.array(journalLineSchema).min(2, 'A journal entry requires at least two lines.'),
});

export const journalPostSchema = z.object({ id: anyId });
export const journalReverseSchema = z.object({ id: anyId, reason: z.string().trim().optional().default('') });
export const journalVoidSchema = z.object({ id: anyId });
export const journalIdSchema = z.object({ id: anyId });

export const periodCreateSchema = z.object({
  name: z.string().trim().min(1, 'Period name is required.'),
  startDate: z.coerce.number().min(1),
  endDate: z.coerce.number().min(1),
});

export const periodCloseSchema = z.object({ id: anyId });
export const periodIdSchema = z.object({ id: anyId });

export const incomeCreateSchema = z.object({
  date: z.coerce.number().min(1),
  source: z.string().trim().optional().default(''),
  accountId: anyId,
  amount: z.coerce.number().positive('Income amount must be positive.'),
  paymentAccountId: anyId.optional(),
  reference: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
});

export const incomeIdSchema = z.object({ id: anyId });

export const expenseCreateSchema = z.object({
  date: z.coerce.number().min(1),
  vendorId: anyId.optional(),
  vendorName: z.string().trim().optional().default(''),
  accountId: anyId,
  amount: z.coerce.number().positive('Expense amount must be positive.'),
  taxAmount: z.coerce.number().min(0).optional().default(0),
  paymentAccountId: anyId.optional(),
  dueDate: z.coerce.number().optional(),
  description: z.string().trim().optional().default(''),
  attachment: z.string().trim().optional().default(''),
});

export const expenseUpdateSchema = expenseCreateSchema.partial().extend({ id: anyId });
export const expenseApproveSchema = z.object({ id: anyId, approved: z.boolean() });
export const expensePaySchema = z.object({ id: anyId, paymentAccountId: anyId });
export const expenseIdSchema = z.object({ id: anyId });

export const ledgerQuerySchema = z.object({
  ...dateRange.shape,
  accountId: anyId.optional(),
  accountType: z.enum(ACCOUNT_TYPES).optional(),
});

export const reportQuerySchema = z.object({
  ...dateRange.shape,
  accountId: anyId.optional(),
  accountType: z.enum(ACCOUNT_TYPES).optional(),
  compareFrom: z.coerce.number().optional(),
  compareTo: z.coerce.number().optional(),
});

export const exportQuerySchema = z.object({
  type: z.string().min(1),
  ...dateRange.shape,
  accountId: anyId.optional(),
  channel: z.enum(PAYMENT_CHANNELS).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
});

export { anyId };