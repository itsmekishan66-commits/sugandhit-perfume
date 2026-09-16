import { z } from 'zod';
import {
  PAYMENT_CHANNELS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  REFUND_TYPES,
  PAYMENT_ACCOUNT_TYPES,
} from '../../shared/constants/finance.constants.js';

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
