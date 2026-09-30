import { api } from '@/services/api';
import type {
  Account,
  AccountRef,
  AccountsOverview,
  BalanceSheetData,
  CashFlowData,
  ExpenseRow,
  IncomeRow,
  Journal,
  JournalLine,
  LedgerRow,
  PaymentAcc,
  Period,
  ProfitLossData,
  TrialBalanceData,
} from './accounting.types';

export interface ApiResult {
  success: boolean;
  message?: string;
}

export interface DataResult<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AccountsResult<T> {
  success: boolean;
  accounts: T[];
  message?: string;
}

export interface PeriodsResult {
  success: boolean;
  periods: Period[];
  current: Period | null;
  message?: string;
}

export interface RowsResult<T> {
  success: boolean;
  rows: T[];
  message?: string;
}

/* ---- Accounts overview ---- */

export async function fetchAccountsOverview(token: string): Promise<DataResult<AccountsOverview>> {
  return api<DataResult<AccountsOverview>>('/api/accounts/overview', token);
}

/* ---- Balance sheet ---- */

export async function fetchBalanceSheet(
  token: string,
  asOf?: string
): Promise<DataResult<BalanceSheetData>> {
  const q = asOf ? `?asOf=${asOf}` :'';
  return api<DataResult<BalanceSheetData>>(`/api/accounts/balance-sheet${q}`, token);
}

/* ---- Cash flow ---- */

export async function fetchCashFlow(
  token: string,
  from?: string,
  to?: string
): Promise<DataResult<CashFlowData>> {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return api<DataResult<CashFlowData>>(`/api/accounts/cash-flow?${q}`, token);
}

/* ---- Profit & loss ---- */

export async function fetchProfitAndLoss(
  token: string,
  from?: string,
  to?: string,
  compareFrom?: string,
  compareTo?: string
): Promise<DataResult<ProfitLossData>> {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  if (compareFrom) q.set('compareFrom', compareFrom);
  if (compareTo) q.set('compareTo', compareTo);
  return api<DataResult<ProfitLossData>>(`/api/accounts/profit-loss?${q}`, token);
}

/* ---- Trial balance ---- */

export async function fetchTrialBalance(
  token: string,
  from?: string,
  to?: string
): Promise<DataResult<TrialBalanceData>> {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return api<DataResult<TrialBalanceData>>(`/api/accounts/trial-balance?${q}`, token);
}

/* ---- Chart of accounts ---- */

export async function fetchChartAccounts(token: string): Promise<AccountsResult<Account>> {
  return api<AccountsResult<Account>>('/api/accounts/chart', token);
}

export async function apiCreateChartAccount(token: string, body: unknown): Promise<ApiResult> {
  return api('/api/accounts/chart', token, { method:'POST', body });
}

export async function apiUpdateChartAccount(
  token: string,
  id: number,
  body: unknown
): Promise<ApiResult> {
  return api(`/api/accounts/chart/${id}`, token, { method:'PUT', body });
}

export async function apiDeactivateChartAccount(token: string, id: number): Promise<ApiResult> {
  return api(`/api/accounts/chart/${id}/deactivate`, token, { method:'POST' });
}

export async function fetchAccountRefs(token: string): Promise<AccountsResult<AccountRef>> {
  return api<AccountsResult<AccountRef>>('/api/accounts/chart', token);
}

/* ---- Ledger ---- */

export async function fetchLedger(
  token: string,
  accountId: string,
  from?: string,
  to?: string
): Promise<RowsResult<LedgerRow>> {
  const q = new URLSearchParams({ accountId });
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return api<RowsResult<LedgerRow>>(`/api/accounts/ledger?${q}`, token);
}

/* ---- Income & expenses ---- */

export interface IncomePayload {
  date: number;
  source: string;
  accountId: number;
  amount: number;
  reference: string;
  description: string;
}

export interface ExpensePayload {
  date: number;
  vendorName: string;
  accountId: number;
  amount: number;
  taxAmount: number;
  description: string;
}

export interface ItemsResult<T> {
  success: boolean;
  items: T[];
  total: number;
  totalPages?: number;
  message?: string;
}

export interface TotalResult {
  success: boolean;
  total: number;
  message?: string;
}

export async function fetchIncome(
  token: string,
  page: number,
  limit: number
): Promise<ItemsResult<IncomeRow>> {
  return api<ItemsResult<IncomeRow>>(`/api/accounts/income?page=${page}&limit=${limit}`, token);
}

export async function fetchIncomeTotals(token: string): Promise<TotalResult> {
  return api<TotalResult>('/api/accounts/income/totals', token);
}

export async function fetchExpenses(
  token: string,
  page: number,
  limit: number
): Promise<ItemsResult<ExpenseRow>> {
  return api<ItemsResult<ExpenseRow>>(`/api/accounts/expenses?page=${page}&limit=${limit}`, token);
}

export async function fetchExpenseTotals(token: string): Promise<TotalResult> {
  return api<TotalResult>('/api/accounts/expenses/totals', token);
}

export async function fetchPaymentAccounts(
  token: string
): Promise<AccountsResult<PaymentAcc>> {
  return api<AccountsResult<PaymentAcc>>('/api/payment/accounts', token);
}

export async function apiCreateIncome(token: string, body: IncomePayload): Promise<ApiResult> {
  return api('/api/accounts/income', token, { method:'POST', body });
}

export async function apiCreateExpense(token: string, body: ExpensePayload): Promise<ApiResult> {
  return api('/api/accounts/expenses', token, { method:'POST', body });
}

export async function apiApproveExpense(
  token: string,
  body: { id: number; approved: boolean }
): Promise<ApiResult> {
  return api('/api/accounts/expenses/approve', token, { method:'POST', body });
}

export async function apiPayExpense(
  token: string,
  body: { id: number; paymentAccountId: number }
): Promise<ApiResult> {
  return api('/api/accounts/expenses/pay', token, { method:'POST', body });
}

/* ---- Journals ---- */

export interface JournalPayload {
  entryDate: number;
  description: string;
  lines: JournalLine[];
}

export async function fetchJournals(
  token: string,
  page: number,
  limit: number,
  status?: string
): Promise<ItemsResult<Journal>> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) q.set('status', status);
  return api<ItemsResult<Journal>>(`/api/accounts/journals?${q}`, token);
}

export async function apiCreateJournal(token: string, body: JournalPayload): Promise<ApiResult> {
  return api('/api/accounts/journals', token, { method:'POST', body });
}

export async function apiFetchJournal(
  token: string,
  id: number
): Promise<{ success: boolean; journal: Journal }> {
  return api(`/api/accounts/journals/${id}`, token);
}

export async function apiPostJournal(
  token: string,
  body: { id: number }
): Promise<ApiResult> {
  return api('/api/accounts/journals/post', token, { method:'POST', body });
}

export async function apiReverseJournal(
  token: string,
  body: { id: number; reason: string }
): Promise<ApiResult> {
  return api('/api/accounts/journals/reverse', token, { method:'POST', body });
}

export async function apiVoidJournal(token: string, body: { id: number }): Promise<ApiResult> {
  return api('/api/accounts/journals/void', token, { method:'POST', body });
}

/* ---- Periods ---- */

export async function fetchPeriods(token: string): Promise<PeriodsResult> {
  return api<PeriodsResult>('/api/accounts/periods', token);
}

export interface PeriodPayload {
  name: string;
  startDate: number;
  endDate: number;
}

export async function apiCreatePeriod(token: string, body: PeriodPayload): Promise<ApiResult> {
  return api('/api/accounts/periods', token, { method:'POST', body });
}

export async function apiClosePeriod(token: string, body: { id: number }): Promise<ApiResult> {
  return api('/api/accounts/periods/close', token, { method:'POST', body });
}

export async function apiReopenPeriod(token: string, body: { id: number }): Promise<ApiResult> {
  return api('/api/accounts/periods/reopen', token, { method:'POST', body });
}
