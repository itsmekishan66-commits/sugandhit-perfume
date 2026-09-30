// Types local to the accounting feature.
// Props interfaces stay inline in their component files.

export interface AuditLog {
  _id: string;
  id: number;
  actorId?: number | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  reason: string;
  ip: string;
  createdAt: number;
}

export interface AdminBrief {
  id: number;
  name?: string;
  email?: string;
  username?: string;
}

export interface Group { inflows: number; outflows: number; net: number }

export interface Account {
  _id: string;
  id: number;
  code: string;
  name: string;
  accountType: string;
  accountTypeLabel: string;
  normalBalance: string;
  active: boolean;
  description?: string;
  journalLineCount: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface PaymentAcc { id: number; name: string; active: boolean }

export interface IncomeRow { id: number; _id: string; date: number; source: string; accountId: number; accountName: string; amount: number; reference?: string; description?: string }

export interface ExpenseRow {
  id: number; _id: string; date: number; vendorId?: number | null; vendorName?: string;
  accountId: number; accountName: string; amount: number; taxAmount: number;
  paymentAccountId?: number | null; description?: string; approvalStatus: string; paymentStatus: string;
}

export interface JournalLine { accountId: number; debit: number; credit: number; description?: string }

export interface Journal { id: number; _id: string; entryNumber: string; entryDate: number; description?: string; referenceType?: string; status: string; lines: JournalLine[] }

export interface LedgerRow {
  lineId: number;
  entryId: number;
  entryNumber: string;
  entryDate: number;
  description?: string;
  referenceType?: string;
  debit: number;
  credit: number;
  lineDescription?: string;
  runningBalance: number;
}

export interface Period { id: number; _id: string; name: string; startDate: number; endDate: number; status: string; closedAt?: number | null; closedBy?: number | null }

export interface PnlRow { code: string; name: string; amount: number }

/** Cash & bank / wallet bucket shown on the accounts overview. */
export interface BalanceBucket { accountId: number; name: string; balance: number }

export interface AccountsOverview {
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalReceived: number;
  totalPaid: number;
  cashAndBank: BalanceBucket[];
  cashBalance: number;
  bankBalance: number;
  walletBalances: BalanceBucket[];
  receivablesBalance: number;
  payablesBalance: number;
  assets: number;
  liabilities: number;
  equity: number;
  taxPayable: number;
  unreconciled: number;
  previous?: { totalIncome: number; totalExpenses: number; netProfit: number } | null;
}

/** Minimal chart-of-accounts reference used by pickers and the ledger filter. */
export interface AccountRef { id: number; code: string; name: string; accountType: string; active: boolean }

/** Journal pickers only need identity fields, so no accountType. */
export interface JournalAccountRef { id: number; code: string; name: string; active: boolean }

export interface BalanceSheetRow {
  code: string;
  name: string;
  accountType: string;
  balance: number;
}

export interface BalanceSheetData {
  assets: { current: number; fixed: number; total: number; rows: BalanceSheetRow[] };
  liabilities: { total: number; rows: BalanceSheetRow[] };
  equity: { total: number; rows: BalanceSheetRow[] };
  currentPeriodProfit: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
  difference: number;
}

export interface CashFlowData {
  operating: Group;
  investing: Group;
  financing: Group;
  totalInflows: number;
  totalOutflows: number;
  netCash: number;
  openingBalance: number;
  closingBalance: number;
}

export interface ProfitLossData {
  revenueRows: PnlRow[];
  cogsRows: PnlRow[];
  expenseRows: PnlRow[];
  revenue: number;
  cogs: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  comparison?: {
    revenue: number;
    cogs: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  } | null;
}

export interface TrialBalanceRow {
  accountId: number;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceData {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  difference: number;
}
