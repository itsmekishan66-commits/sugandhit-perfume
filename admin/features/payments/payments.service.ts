import { api } from '@/services/api';
import type {
  Aging,
  Dashboard,
  LinkStatus,
  PayAccountOption,
  Payable,
  PayablesVendor,
  PaymentAccount,
  PaymentAccountBrief,
  PaymentOverviewData,
  Receivable,
  ReconCandidate,
  Reconciliation,
  Refund,
  Transaction,
} from './payments.types';

export interface ApiResult {
  success: boolean;
  message?: string;
}

export interface DataResult<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ListResult<T> {
  success: boolean;
  items: T[];
  total: number;
  totalPages?: number;
  message?: string;
}

/** Bills/receivables lists additionally report the outstanding total. */
export interface DebtListResult<T> {
  success: boolean;
  items: T[];
  total: number;
  totalOutstanding: number;
  totalPages?: number;
  message?: string;
}

export interface AccountsResult<T> {
  success: boolean;
  accounts: T[];
  message?: string;
}

/* ---- Overview / settings ---- */

export async function fetchPaymentOverview(
  token: string
): Promise<DataResult<PaymentOverviewData>> {
  return api<DataResult<PaymentOverviewData>>('/api/payment', token);
}

export async function fetchLinkStatus(token: string): Promise<DataResult<LinkStatus>> {
  return api<DataResult<LinkStatus>>('/api/payment/status', token);
}

/**
 * Returns the raw CSV response for the requested settlement type. Deliberately
 * not wrapped in api() because the caller needs the body as a blob, not JSON.
 */
export async function apiExportCsv(
  token: string,
  type: string
): Promise<Response> {
  return fetch('/api/payment/export', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify({ type }),
  });
}

/* ---- Payment accounts ---- */

export async function fetchPaymentAccounts(
  token: string
): Promise<AccountsResult<PaymentAccount>> {
  return api<AccountsResult<PaymentAccount>>('/api/payment/accounts', token);
}

export async function fetchPaymentAccountBriefs(
  token: string
): Promise<AccountsResult<PaymentAccountBrief>> {
  return api<AccountsResult<PaymentAccountBrief>>('/api/payment/accounts', token);
}

export interface PaymentAccountPayload {
  name: string;
  accountType: string;
  provider?: string;
  currency: string;
  accountNumber?: string;
  branch?: string;
  openingBalance: number;
  notes?: string;
}

export async function apiCreatePaymentAccount(
  token: string,
  body: PaymentAccountPayload
): Promise<ApiResult> {
  return api('/api/payment/accounts', token, { method:'POST', body });
}

export async function apiDeactivatePaymentAccount(
  token: string,
  id: number
): Promise<ApiResult> {
  return api(`/api/payment/accounts/${id}/deactivate`, token, { method:'POST' });
}

export async function fetchPaymentAccountLedger(
  token: string,
  id: number
): Promise<DataResult<{ account: PaymentAccount; transactions: unknown[] }>> {
  return api(`/api/payment/accounts/${id}/ledger`, token);
}

/* ---- Transactions ---- */

export async function fetchTransactions(
  token: string,
  page: number,
  limit: number,
  filters: { status?: string; channel?: string; type?: string } = {}
): Promise<ListResult<Transaction>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.status) q.set('status', filters.status);
  if (filters.channel) q.set('channel', filters.channel);
  if (filters.type) q.set('type', filters.type);
  return api<ListResult<Transaction>>(`/api/payment/transactions?${q}`, token);
}

export async function apiFetchTransaction(
  token: string,
  id: number
): Promise<{ success: boolean; transaction: Transaction }> {
  return api(`/api/payment/transactions/${id}`, token);
}

export interface ManualTransactionPayload {
  customerName: string;
  channel: string;
  paymentMethod: string;
  amount: number;
  processingFee: number;
  taxAmount: number;
  transactionType: string;
  providerTransactionId: string;
}

export async function apiCreateManualTransaction(
  token: string,
  body: ManualTransactionPayload
): Promise<ApiResult> {
  return api('/api/payment/transactions/manual', token, { method:'POST', body });
}

export async function apiUpdateTransactionStatus(
  token: string,
  body: { id: number; status: string }
): Promise<ApiResult> {
  return api('/api/payment/transactions/status', token, { method:'POST', body });
}

export async function apiReconcileTransaction(
  token: string,
  body: { id: number; status: string }
): Promise<ApiResult> {
  return api('/api/payment/transactions/reconcile', token, { method:'POST', body });
}

/* ---- Refunds ---- */

export async function fetchRefunds(
  token: string,
  page: number,
  limit: number,
  status?: string
): Promise<ListResult<Refund>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set('status', status);
  return api<ListResult<Refund>>(`/api/payment/refunds?${q}`, token);
}

export interface RefundPayload {
  transactionId: number;
  amount: number;
  reason: string;
  type: string;
  chargeback: boolean;
}

export async function apiCreateRefund(
  token: string,
  body: RefundPayload
): Promise<ApiResult> {
  return api('/api/payment/refunds', token, { method:'POST', body });
}

export async function apiApproveRefund(
  token: string,
  body: { id: number; approved: boolean }
): Promise<ApiResult> {
  return api('/api/payment/refunds/approve', token, { method:'POST', body });
}

/* ---- Payables ---- */

export async function fetchPayables(
  token: string,
  page: number,
  limit: number,
  status?: string
): Promise<DebtListResult<Payable>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set('status', status);
  return api<DebtListResult<Payable>>(`/api/accounts/payables?${q}`, token);
}

export async function fetchVendorsForPayables(
  token: string
): Promise<ListResult<PayablesVendor>> {
  return api<ListResult<PayablesVendor>>('/api/accounts/vendors?limit=500', token);
}

export async function fetchPayAccountsForPayables(
  token: string
): Promise<AccountsResult<PayAccountOption>> {
  return api<AccountsResult<PayAccountOption>>('/api/payment/accounts', token);
}

export async function fetchPayablesAging(token: string): Promise<DataResult<Aging>> {
  return api<DataResult<Aging>>('/api/accounts/payables/aging', token);
}

export interface BillPayload {
  vendorId: number;
  billRef: string;
  category: string;
  billDate: number;
  dueDate: number;
  originalAmount: number;
  notes: string;
}

export async function apiCreateVendor(
  token: string,
  body: Record<string, unknown>
): Promise<ApiResult> {
  return api('/api/accounts/vendors', token, { method:'POST', body });
}

export async function apiCreateBill(
  token: string,
  body: BillPayload
): Promise<ApiResult> {
  return api('/api/accounts/payables', token, { method:'POST', body });
}

export async function apiApproveBill(
  token: string,
  body: { id: number; approved: boolean }
): Promise<ApiResult> {
  return api('/api/accounts/payables/approve', token, { method:'POST', body });
}

export async function apiPayBill(
  token: string,
  body: { payableId: number; paymentAccountId: number; amount: number }
): Promise<ApiResult> {
  return api('/api/accounts/payables/pay', token, { method:'POST', body });
}

/* ---- Receivables ---- */

export async function fetchReceivables(
  token: string,
  page: number,
  limit: number,
  status?: string
): Promise<DebtListResult<Receivable>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set('status', status);
  return api<DebtListResult<Receivable>>(`/api/accounts/receivables?${q}`, token);
}

export async function fetchReceivablesAging(token: string): Promise<DataResult<Aging>> {
  return api<DataResult<Aging>>('/api/accounts/receivables/aging', token);
}

export async function fetchReceivableStatement(
  token: string,
  customerId: number
): Promise<DataResult<{ customerId: number; balance: number; receivables: Receivable[] }>> {
  return api(`/api/accounts/receivables/statement/${customerId}`, token);
}

export interface ReceivableAdjustPayload {
  id: number;
  mode: string;
  amount?: number;
  reason: string;
}

export async function apiAdjustReceivable(
  token: string,
  body: ReceivableAdjustPayload
): Promise<ApiResult> {
  return api('/api/accounts/receivables/adjust', token, { method:'POST', body });
}

/* ---- Reconciliations ---- */

export async function fetchReconciliations(
  token: string
): Promise<DataResult<Reconciliation[]>> {
  return api<DataResult<Reconciliation[]>>('/api/payment/reconciliations', token);
}

export async function fetchReconciliationSummary(
  token: string
): Promise<DataResult<Dashboard>> {
  return api<DataResult<Dashboard>>('/api/payment/reconciliations/summary', token);
}

export interface ReconciliationPayload {
  paymentAccountId: number;
  periodStart: number;
  periodEnd: number;
  openingExternalBalance: number;
  closingExternalBalance: number;
  notes: string;
}

export async function apiCreateReconciliation(
  token: string,
  body: ReconciliationPayload
): Promise<ApiResult> {
  return api('/api/payment/reconciliations', token, { method:'POST', body });
}

export async function fetchReconciliation(
  token: string,
  id: number
): Promise<DataResult<Reconciliation>> {
  return api<DataResult<Reconciliation>>(`/api/payment/reconciliations/${id}`, token);
}

export async function fetchReconCandidates(
  token: string,
  paymentAccountId: number
): Promise<ListResult<ReconCandidate>> {
  return api<ListResult<ReconCandidate>>(
    `/api/payment/transactions?accountId=${paymentAccountId}&reconciliationStatus=unreconciled&page=1&limit=200`,
    token
  );
}

export async function apiAddReconItem(
  token: string,
  body: { reconciliationId: number; externalRef: string; externalAmount: number }
): Promise<ApiResult> {
  return api('/api/payment/reconciliations/items', token, { method:'POST', body });
}

export async function apiMatchReconItem(
  token: string,
  body: { itemId: number; transactionId: number }
): Promise<ApiResult> {
  return api('/api/payment/reconciliations/match', token, { method:'POST', body });
}

export async function apiLockReconciliation(
  token: string,
  body: { id: number }
): Promise<ApiResult> {
  return api('/api/payment/reconciliations/lock', token, { method:'POST', body });
}
