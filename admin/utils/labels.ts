export const CHANNEL_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  esewa: 'eSewa',
  khalti: 'Khalti',
  card: 'Card',
  gateway: 'Payment Gateway',
  digital_wallet: 'Digital Wallet',
  credit_balance: 'Credit Balance',
  other: 'Other',
};

export const TXN_STATUS_LABELS: Record<string, string> = {
  initiated: 'Initiated',
  pending: 'Pending',
  authorized: 'Authorized',
  successful: 'Successful',
  failed: 'Failed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  partially_refunded: 'Partially Refunded',
  fully_refunded: 'Fully Refunded',
  disputed: 'Disputed',
  chargeback: 'Chargeback',
  reversed: 'Reversed',
  reconciled: 'Reconciled',
};

export const TXN_TYPE_LABELS: Record<string, string> = {
  payment: 'Payment',
  partial_payment: 'Partial Payment',
  refund: 'Refund',
  chargeback: 'Chargeback',
  adjustment: 'Adjustment',
  transfer: 'Transfer',
  fee: 'Fee',
  settlement: 'Settlement',
  reversal: 'Reversal',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  cogs: 'Cost of Goods Sold',
  expense: 'Expense',
};

export const PAYMENT_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  esewa: 'eSewa',
  khalti: 'Khalti',
  card_gateway: 'Card / Gateway',
  digital_wallet: 'Digital Wallet',
  other: 'Other',
};

export const REFUND_STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  approved: 'Approved',
  processed: 'Processed',
  failed: 'Failed',
  reversed: 'Reversed',
};

export const REFUND_TYPE_LABELS: Record<string, string> = {
  full_refund: 'Full Refund',
  partial_refund: 'Partial Refund',
  cancellation_refund: 'Cancellation Refund',
  reversal: 'Reversal',
  chargeback: 'Chargeback',
  manual_adjustment: 'Manual Adjustment',
};

export const RECON_STATUS_LABELS: Record<string, string> = {
  unreconciled: 'Unreconciled',
  matched: 'Matched',
  reconciled: 'Reconciled',
  partial: 'Partial',
};

export const RECON_ITEM_STATUS_LABELS: Record<string, string> = {
  matched: 'Matched',
  missing_internal: 'Missing Internal',
  missing_external: 'Missing External',
  amount_mismatch: 'Amount Mismatch',
  duplicate: 'Duplicate',
  unmatched: 'Unmatched',
};

export const JOURNAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  posted: 'Posted',
  reversed: 'Reversed',
  voided: 'Voided',
};

export const PERIOD_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  closed: 'Closed',
  locked: 'Locked',
};

export const DEBT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  written_off: 'Written Off',
};

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  ordered: 'Ordered',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  opening: 'Opening Stock',
  adjustment: 'Adjustment',
  purchase_receipt: 'Purchase Receipt',
  sale: 'Sale',
  sale_cancel: 'Sale Cancel / Return',
};

export const toneFor = (value: string | null | undefined): string => {
  const v = value ?? '';
  if (['successful', 'reconciled', 'matched', 'paid', 'open', 'posted', 'processed', 'active'].includes(v)) return 'green';
  if (['failed', 'chargeback', 'reversed', 'voided', 'written_off', 'overdue'].includes(v)) return 'red';
  if (['pending', 'initiated', 'requested', 'partially_paid', 'partial', 'locked', 'authorized'].includes(v)) return 'amber';
  if (['refunded', 'partially_refunded', 'fully_refunded', 'approved'].includes(v)) return 'blue';
  if (['cancelled', 'expired', 'disputed', 'missing_internal', 'missing_external', 'amount_mismatch', 'duplicate', 'unmatched', 'draft', 'closed'].includes(v)) return 'gray';
  return 'gold';
};