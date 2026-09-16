export interface PaymentAccountInput {
  name: string;
  accountType: string;
  provider?: string;
  currency?: string;
  openingBalance?: number;
  accountNumber?: string;
  branch?: string;
  notes?: string;
  createdBy?: number;
}

export interface ManualPaymentInput {
  orderId?: number;
  customOrderId?: number;
  customerId?: number;
  customerName?: string;
  paymentAccountId?: number;
  channel?: string;
  paymentMethod?: string;
  amount: number;
  processingFee?: number;
  taxAmount?: number;
  providerTransactionId?: string;
  intent?: string;
  transactionType?: string;
  source?: string;
  createdBy?: number;
  ip?: string;
}

export interface RefundInput {
  transactionId: number;
  amount: number;
  reason: string;
  type: string;
  chargeback?: boolean;
  refundRef?: string;
  initiatedBy?: number;
  ip?: string;
}

export interface ReconciliationInput {
  paymentAccountId: number;
  periodStart: number;
  periodEnd: number;
  openingExternalBalance?: number;
  closingExternalBalance?: number;
  notes?: string;
  createdBy?: number;
}

export interface TransactionListOpts {
  from?: number;
  to?: number;
  status?: string;
  channel?: string;
  type?: string;
  accountId?: number;
  customerId?: number;
  orderId?: number;
  reconciliationStatus?: string;
  page?: number;
  limit?: number;
}

export interface RefundListOpts {
  from?: number;
  to?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaymentOverviewOpts {
  from?: number;
  to?: number;
  channel?: string;
  status?: string;
  accountId?: number;
}

export interface PaymentChannelReportOpts {
  from?: number;
  to?: number;
  accountId?: number;
}
