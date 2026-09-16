export interface ReceivableQuery {
  from?: number;
  to?: number;
  status?: string;
  customerId?: number;
  page?: number;
  limit?: number;
}

export interface ReceivableInput {
  id: number;
  customerId: number;
  orderId: number | null;
  customOrderId: number | null;
  invoiceRef: string;
  invoiceDate: number;
  dueDate: number;
  originalAmount: number;
  paidAmount: number;
  creditApplied: number;
  refundAmount: number;
  outstandingAmount: number;
  status: string;
  writeOffReason: string;
  createdAt: number;
  updatedAt: number;
}

export interface EnrichedReceivable extends ReceivableInput {
  _id: string;
  customer: { id: number; name: string; email: string; phone: string } | null;
  payments: Array<{
    id: number;
    receivableId: number;
    paymentTransactionId: number;
    amount: number;
    appliedAt: number;
    createdBy: number | null;
    createdAt: number;
  }>;
  daysOverdue: number;
}

export interface AgingReport {
  current: number;
  d30: number;
  d60: number;
  d90: number;
  d90plus: number;
}

export interface CustomerStatement {
  customerId: number;
  balance: number;
  receivables: EnrichedReceivable[];
}