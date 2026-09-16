import { useState } from 'react';
import { PageHeader } from '../../components';
import { SectionCard, Tabs } from '../../components';
import Accounts from './accounts';
import AccountingChart from './chart';
import AccountingJournals from './journals';
import AccountingLedger from './ledger';
import AccountingTrialBalance from './trial-balance';
import AccountingPnL from './pnl';
import AccountingBalanceSheet from './balance-sheet';
import AccountingCashFlow from './cash-flow';
import AccountingIncomeExpense from './income-expense';
import AccountingPeriods from './periods';
import AccountingSettings from './settings';
import AccountingAuditLogs from './audit-logs';

const AccountsPage = ({ token }: { token: string }) => {
  const [tab, setTab] = useState('overview');

  return (
    <div className="flex flex-col">
      <PageHeader title="Accounts" subtitle="Double-entry accounting in one place" />

      <SectionCard className="mt-6">
        <Tabs
          tabs={[
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
          ]}
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