import PageHeader from '@/components/data-display/PageHeader';
import SectionCard from '@/components/data-display/SectionCard';
import Tabs from '@/components/ui/Tabs';
import { useTabParam } from '@/hooks/useTabParam';
import Accounts from '@/features/accounting/components/Accounts';;
import AccountingChart from '@/features/accounting/components/Chart';;
import AccountingJournals from '@/features/accounting/components/Journals';;
import AccountingLedger from '@/features/accounting/components/Ledger';;
import AccountingTrialBalance from '@/features/accounting/components/TrialBalance';;
import AccountingPnL from '@/features/accounting/components/ProfitAndLoss';;
import AccountingBalanceSheet from '@/features/accounting/components/BalanceSheet';;
import AccountingCashFlow from '@/features/accounting/components/CashFlow';;
import AccountingIncomeExpense from '@/features/accounting/components/IncomeExpense';;
import AccountingPeriods from '@/features/accounting/components/Periods';;
import AccountingSettings from '@/features/accounting/components/AccountingSettings';;
import AccountingAuditLogs from '@/features/accounting/components/AuditLogs';;

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'chart', label: 'Chart of Accounts' },
  { key: 'journals', label: 'Journal Entries' },
  { key: 'ledger', label: 'General Ledger' },
  { key: 'trial-balance', label: 'Trial Balance' },
  { key: 'profit-loss', label: 'Profit & Loss' },
  { key: 'balance-sheet', label: 'Balance Sheet' },
  { key: 'cash-flow', label: 'Cash Flow' },
  { key: 'income-expense', label: 'Income & Expenses' },
  { key: 'periods', label: 'Periods' },
  { key: 'audit-logs', label: 'Audit Logs' },
  { key: 'settings', label: 'Settings' },
];

const AccountsPage = ({ token }: { token: string }) => {
  const [tab, setTab] = useTabParam('tab', TABS.map((t) => t.key), 'overview');

  return (
    <div className="flex flex-col">
      <PageHeader title="Accounts" subtitle="Double-entry accounting in one place" />

      <SectionCard className="mt-6">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
        />
        <div className="p-6">
          {tab === 'overview' && <Accounts token={token} />}
          {tab === 'chart' && <AccountingChart token={token} />}
          {tab === 'journals' && <AccountingJournals token={token} />}
          {tab === 'ledger' && <AccountingLedger token={token} />}
          {tab === 'trial-balance' && <AccountingTrialBalance token={token} />}
          {tab === 'profit-loss' && <AccountingPnL token={token} />}
          {tab === 'balance-sheet' && <AccountingBalanceSheet token={token} />}
          {tab === 'cash-flow' && <AccountingCashFlow token={token} />}
          {tab === 'income-expense' && <AccountingIncomeExpense token={token} />}
          {tab === 'periods' && <AccountingPeriods token={token} />}
          {tab === 'audit-logs' && <AccountingAuditLogs token={token} />}
          {tab === 'settings' && <AccountingSettings />}
        </div>
      </SectionCard>
    </div>
  );
};

export default AccountsPage;