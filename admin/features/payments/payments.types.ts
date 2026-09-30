// Types local to the payments feature.
// Props interfaces stay inline in their component files.

export interface Payable {
  _id: string;
  id: number;
  vendorId: number;
  vendor: { id: number; name: string; email?: string; phone?: string } | null;
  billRef?: string;
  category?: string;
  billDate: number;
  dueDate: number;
  originalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  approvalStatus: string;
  daysOverdue: number;
  notes?: string;
  payments: { id: number; amount: number; paidAt: number }[];
}

export interface PaymentAccount {
  _id: string;
  id: number;
  name: string;
  accountType: string;
  provider?: string;
  currency: string;
  openingBalance: number;
  calculatedBalance: number;
  currentBalance: number;
  availableBalance: number;
  pendingSettlement: number;
  transactionCount: number;
  accountNumber?: string;
  branch?: string;
  notes?: string;
  active: boolean;
  createdAt: number | string;
}



export interface LinkStatus { configured: boolean; accountCount: number; note: string }

export interface Receivable {
  _id: string;
  id: number;
  orderId?: number | null;
  invoiceRef?: string;
  invoiceDate: number;
  dueDate: number;
  originalAmount: number;
  paidAmount: number;
  creditApplied: number;
  refundAmount: number;
  outstandingAmount: number;
  status: string;
  daysOverdue: number;
  customerId?: number | null;
  customer: { id: number; name: string; email?: string; phone?: string } | null;
  payments: { id: number; amount: number; appliedAt: number }[];

}



export interface Aging { current: number; d30: number; d60: number; d90: number; d90plus: number }



export interface PaymentAccountBrief { id: number; name: string; accountType: string; active: boolean }



export interface ReconItem {

  _id: string;

  id: number;

  externalRef: string;

  externalAmount: number;

  discrepancy: number;

  status: string;

  matched: boolean;

  transactionId?: number | null;

}



export interface Reconciliation {

  _id: string;

  id: number;

  paymentAccountId: number;

  accountName?: string;

  periodStart: number;

  periodEnd: number;

  openingExternalBalance: number;

  closingExternalBalance: number;

  status: string;

  notes?: string;

  items: ReconItem[];

  summary: { total: number; matched: number; missingInternal: number; missingExternal: number; mismatched: number; duplicates: number; discrepancy: number };

}



export interface Dashboard { unreconciledAmount: number; [k: string]: unknown }



export interface Refund {

  _id: string;

  id: number;

  transactionId: number;

  refundRef?: string;

  amount: number;

  reason?: string;

  type?: string;

  status: string;

  chargeback: boolean;

  createdAt: number | string;

  processedAt?: number | string | null;

}



export interface Transaction {

  id: number;

  _id: string;

  transactionId: string;

  providerTransactionId?: string;

  orderId?: number | null;

  customOrderId?: number | null;

  customerId?: number | null;

  customerName?: string;

  channel: string;

  paymentMethod?: string;

  amount: number;

  currency: string;

  processingFee: number;

  netAmount: number;

  taxAmount: number;

  status: string;

  transactionType: string;

  paymentAccountId?: number | null;

  initiatedAt: number | string;

  completedAt?: number | string | null;

  failureReason?: string;

  refundRef?: string;

  reconciliationStatus?: string;

  source?: string;

}



/** Channel rollup shown on the payments overview. */

export interface ChannelTotal {

  count: number;

  gross: number;

  fees: number;

  refunds: number;

  chargebacks: number;

  net: number;

  successful: number;

  failed: number;

  pending: number;

}



/** Distinct from the accounting feature 's AccountsOverview — payment-gateway rollup. */

export interface PaymentOverviewData {

  receivedToday: number;

  receivedThisWeek: number;

  receivedThisMonth: number;

  successfulCount: number;

  successfulAmount: number;

  pendingCount: number;

  pendingAmount: number;

  failedCount: number;

  failedAmount: number;

  refundedAmount: number;

  chargebackAmount: number;

  outstandingReceivables: number;

  outstandingPayables: number;

  awaitingSettlement: number;

  successRate: number;

  unprocessedWebhookEvents: number;

  channelTotals?: Record<string, ChannelTotal>;

}



/** Vendor as returned for the payables picker (most fields optional). */

export interface PayablesVendor {

  _id: string;

  id: number;

  name: string;

  email?: string;

  phone?: string;

  address?: string;

  category?: string;

  notes?: string;

  active: boolean;

  createdAt: number | string;

}



/** Payment-account row trimmed to what the payables form needs. */

export interface PayAccountOption {

  id: number;

  name: string;

  active?: boolean;

}



/** Transaction candidate offered for reconciliation matching. */

export interface ReconCandidate {

  id: number;

  transactionId: string;

  amount: number;

  initiatedAt: number | string;

  status: string;

}

