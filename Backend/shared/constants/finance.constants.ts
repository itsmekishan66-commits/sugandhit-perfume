export const PAYMENT_CHANNELS = [
  'cash',
  'bank_transfer',
  'esewa',
  'khalti',
  'card',
  'gateway',
  'digital_wallet',
  'credit_balance',
  'other',
] as const;

export const PAYMENT_CHANNEL_LABELS: Record<string, string> = {
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

export const TRANSACTION_STATUSES = [
  'initiated',
  'pending',
  'authorized',
  'successful',
  'failed',
  'cancelled',
  'expired',
  'partially_refunded',
  'fully_refunded',
  'disputed',
  'chargeback',
  'reversed',
  'reconciled',
] as const;

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
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

export const TRANSACTION_TYPES = [
  'payment',
  'partial_payment',
  'refund',
  'chargeback',
  'adjustment',
  'transfer',
  'fee',
  'settlement',
  'reversal',
] as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
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

export const REFUND_TYPES = [
  'full_refund',
  'partial_refund',
  'cancellation_refund',
  'reversal',
  'chargeback',
  'manual_adjustment',
] as const;

export const REFUND_STATUSES = ['requested', 'approved', 'processed', 'failed', 'reversed'] as const;

export const RECONCILIATION_STATUSES = ['unreconciled', 'matched', 'reconciled', 'partial'] as const;

export const RECONCILIATION_ITEM_STATUSES = ['matched', 'missing_internal', 'missing_external', 'amount_mismatch', 'duplicate', 'unmatched'] as const;

export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'cogs', 'expense'] as const;

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  cogs: 'Cost of Goods Sold',
  expense: 'Expense',
};

export const JOURNAL_STATUSES = ['draft', 'posted', 'reversed', 'voided'] as const;

export const ACCOUNTING_PERIOD_STATUSES = ['open', 'closed', 'locked'] as const;

export const RECEIVABLE_STATUSES = ['unpaid', 'partially_paid', 'paid', 'overdue', 'written_off'] as const;

export const PAYABLE_STATUSES = ['unpaid', 'partially_paid', 'paid', 'overdue', 'written_off'] as const;

export const PAYMENT_ACCOUNT_TYPES = ['cash', 'bank', 'esewa', 'khalti', 'card_gateway', 'digital_wallet', 'other'] as const;

export const PAYMENT_ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  esewa: 'eSewa',
  khalti: 'Khalti',
  card_gateway: 'Card / Gateway',
  digital_wallet: 'Digital Wallet',
  other: 'Other',
};

export const PERMISSIONS = {
  payments_view: 'payments.view',
  payments_create: 'payments.create',
  payments_edit: 'payments.edit',
  payments_refund: 'payments.refund',
  payments_reconcile: 'payments.reconcile',
  payments_export: 'payments.export',
  receivables_view: 'receivables.view',
  receivables_manage: 'receivables.manage',
  payables_view: 'payables.view',
  payables_manage: 'payables.manage',
  accounts_view: 'accounts.view',
  accounts_manage_chart: 'accounts.manage_chart',
  accounts_create_journal: 'accounts.create_journal',
  accounts_post_journal: 'accounts.post_journal',
  accounts_reverse_journal: 'accounts.reverse_journal',
  accounts_view_reports: 'accounts.view_reports',
  accounts_export: 'accounts.export',
  accounts_manage_periods: 'accounts.manage_periods',
  inventory_view: 'inventory.view',
  inventory_manage: 'inventory.manage',
  inventory_adjust: 'inventory.adjust',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.payments_view,
    PERMISSIONS.payments_create,
    PERMISSIONS.payments_edit,
    PERMISSIONS.payments_refund,
    PERMISSIONS.payments_reconcile,
    PERMISSIONS.payments_export,
    PERMISSIONS.receivables_view,
    PERMISSIONS.receivables_manage,
    PERMISSIONS.payables_view,
    PERMISSIONS.payables_manage,
    PERMISSIONS.accounts_view,
    PERMISSIONS.accounts_manage_chart,
    PERMISSIONS.accounts_create_journal,
    PERMISSIONS.accounts_post_journal,
    PERMISSIONS.accounts_view_reports,
    PERMISSIONS.accounts_export,
    PERMISSIONS.accounts_manage_periods,
    PERMISSIONS.inventory_view,
    PERMISSIONS.inventory_manage,
    PERMISSIONS.inventory_adjust,
  ],
  editor: [PERMISSIONS.payments_view, PERMISSIONS.accounts_view, PERMISSIONS.accounts_view_reports, PERMISSIONS.receivables_view, PERMISSIONS.payables_view, PERMISSIONS.inventory_view],
};

export const DEFAULT_CHART_OF_ACCOUNTS: { code: string; name: string; type: string; normalBalance: 'debit' | 'credit' }[] = [
  { code: '1000', name: 'Cash in Hand', type: 'asset', normalBalance: 'debit' },
  { code: '1010', name: 'Bank Account', type: 'asset', normalBalance: 'debit' },
  { code: '1020', name: 'eSewa Wallet', type: 'asset', normalBalance: 'debit' },
  { code: '1030', name: 'Khalti Wallet', type: 'asset', normalBalance: 'debit' },
  { code: '1040', name: 'Card Gateway Receivable', type: 'asset', normalBalance: 'debit' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', normalBalance: 'debit' },
  { code: '1200', name: 'Inventory / Stock', type: 'asset', normalBalance: 'debit' },
  { code: '1300', name: 'Kitchen Equipment', type: 'asset', normalBalance: 'debit' },
  { code: '1310', name: 'Furniture and Fixtures', type: 'asset', normalBalance: 'debit' },
  { code: '1400', name: 'Security Deposits', type: 'asset', normalBalance: 'debit' },
  { code: '1410', name: 'Prepaid Expenses', type: 'asset', normalBalance: 'debit' },
  { code: '2000', name: 'Accounts Payable', type: 'liability', normalBalance: 'credit' },
  { code: '2010', name: 'Customer Advances', type: 'liability', normalBalance: 'credit' },
  { code: '2020', name: 'Tax Payable', type: 'liability', normalBalance: 'credit' },
  { code: '2030', name: 'Salary / Wage Payable', type: 'liability', normalBalance: 'credit' },
  { code: '2040', name: 'Loan Payable', type: 'liability', normalBalance: 'credit' },
  { code: '2050', name: 'Refunds Payable', type: 'liability', normalBalance: 'credit' },
  { code: '2060', name: 'Payment Provider Settlement Payable', type: 'liability', normalBalance: 'credit' },
  { code: '3000', name: 'Owner Capital', type: 'equity', normalBalance: 'credit' },
  { code: '3010', name: 'Owner Drawings', type: 'equity', normalBalance: 'debit' },
  { code: '3020', name: 'Retained Earnings', type: 'equity', normalBalance: 'credit' },
  { code: '3030', name: 'Opening Balance Equity', type: 'equity', normalBalance: 'credit' },
  { code: '4000', name: 'Perfume Sales', type: 'revenue', normalBalance: 'credit' },
  { code: '4010', name: 'Custom Perfume Sales', type: 'revenue', normalBalance: 'credit' },
  { code: '4020', name: 'Delivery Revenue', type: 'revenue', normalBalance: 'credit' },
  { code: '4030', name: 'Service Revenue', type: 'revenue', normalBalance: 'credit' },
  { code: '4040', name: 'Other Income', type: 'revenue', normalBalance: 'credit' },
  { code: '4100', name: 'Discounts Given', type: 'revenue', normalBalance: 'debit' },
  { code: '4110', name: 'Sales Returns', type: 'revenue', normalBalance: 'debit' },
  { code: '4120', name: 'Refunds', type: 'revenue', normalBalance: 'debit' },
  { code: '5000', name: 'Ingredient / Stock Cost', type: 'cogs', normalBalance: 'debit' },
  { code: '5010', name: 'Packaging Cost', type: 'cogs', normalBalance: 'debit' },
  { code: '5020', name: 'Direct Labor Cost', type: 'cogs', normalBalance: 'debit' },
  { code: '6000', name: 'Delivery Expense', type: 'expense', normalBalance: 'debit' },
  { code: '6010', name: 'Payment Gateway Fees', type: 'expense', normalBalance: 'debit' },
  { code: '6020', name: 'Rent', type: 'expense', normalBalance: 'debit' },
  { code: '6030', name: 'Utilities', type: 'expense', normalBalance: 'debit' },
  { code: '6040', name: 'Salaries and Wages', type: 'expense', normalBalance: 'debit' },
  { code: '6050', name: 'Marketing and Promotions', type: 'expense', normalBalance: 'debit' },
  { code: '6060', name: 'Repairs and Maintenance', type: 'expense', normalBalance: 'debit' },
  { code: '6070', name: 'Software / Subscriptions', type: 'expense', normalBalance: 'debit' },
  { code: '6080', name: 'Office Expense', type: 'expense', normalBalance: 'debit' },
  { code: '6090', name: 'Bank Charges', type: 'expense', normalBalance: 'debit' },
  { code: '6100', name: 'Taxes and Licenses', type: 'expense', normalBalance: 'debit' },
  { code: '6110', name: 'Miscellaneous Expense', type: 'expense', normalBalance: 'debit' },
];

export const ACCOUNT_KEYWORDS: Record<string, string[]> = {
  'Cash in Hand': ['cash', 'cash_hand'],
  'Bank Account': ['bank', 'bank_account'],
  'eSewa Wallet': ['esewa'],
  'Khalti Wallet': ['khalti'],
  'Card Gateway Receivable': ['card', 'gateway', 'receivable'],
  'Accounts Receivable': ['accounts_receivable', 'ar'],
  'Delivery Revenue': ['delivery'],
  'Perfume Sales': ['perfume_sales'],
  'Custom Perfume Sales': ['custom_sales'],
  'Other Income': ['other_income'],
  'Discounts Given': ['discount'],
  'Sales Returns': ['returns'],
  'Refunds': ['refund'],
  'Payment Gateway Fees': ['gateway_fee', 'payment_fee'],
  'Bank Charges': ['bank_charge'],
  'Tax Payable': ['tax_payable'],
  'Taxes and Licenses': ['tax_expense'],
  'Customer Advances': ['customer_advance'],
  'Refunds Payable': ['refund_payable'],
  'Payment Provider Settlement Payable': ['settlement'],
};