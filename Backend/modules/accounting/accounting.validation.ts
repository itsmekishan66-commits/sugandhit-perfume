import { z } from 'zod';
import { ACCOUNT_TYPES, PAYMENT_CHANNELS, TRANSACTION_STATUSES } from '../../shared/constants/finance.constants.js';
import { anyId, dateRangeSchema } from '../../shared/validators/common.validation.js';

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
  ...dateRangeSchema.shape,
  accountId: anyId.optional(),
  accountType: z.enum(ACCOUNT_TYPES).optional(),
});

export const reportQuerySchema = z.object({
  ...dateRangeSchema.shape,
  accountId: anyId.optional(),
  accountType: z.enum(ACCOUNT_TYPES).optional(),
  compareFrom: z.coerce.number().optional(),
  compareTo: z.coerce.number().optional(),
});

export const exportQuerySchema = z.object({
  type: z.string().min(1),
  ...dateRangeSchema.shape,
  accountId: anyId.optional(),
  channel: z.enum(PAYMENT_CHANNELS).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
});

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

export { anyId };