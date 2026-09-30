import { useState } from 'react';
import PageHeader from '@/components/data-display/PageHeader';
import SectionCard from '@/components/data-display/SectionCard';
import Tabs from '@/components/ui/Tabs';
import Payment from '@/features/payments/components/PaymentOverview';
import PaymentAccounts from '@/features/accounting/components/Accounts';
import PaymentTransactions from '@/features/payments/components/Transactions';
import PaymentReceivables from '@/features/payments/components/Receivables';
import PaymentPayables from '@/features/payments/components/Payables';
import PaymentRefunds from '@/features/payments/components/Refunds';
import PaymentReconciliation from '@/features/payments/components/Reconciliation';
import PaymentSettings from '@/features/accounting/components/AccountingSettings';
const PaymentsPage = ({ token }: { token: string }) => {

  const [tab, setTab] = useState('overview');
  return (
    <div className="flex flex-col">
      <PageHeader title="Payments" subtitle="Payment operations in one place" />
      <SectionCard className="mt-6">
        <Tabs
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'accounts', label: 'Payment Accounts' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'receivables', label: 'Receivables' },
            { key: 'payables', label: 'Payables' },
            { key: 'refunds', label: 'Refunds' },
            { key: 'reconciliation', label: 'Reconciliation' },
            { key: 'settings', label: 'Payment Settings' },
          ]}

          active={tab}
          onChange={setTab}
        />
        <div className="p-6">
          {tab === 'overview' && <Payment token={token} />}
          {tab === 'accounts' && <PaymentAccounts token={token} />}
          {tab === 'transactions' && <PaymentTransactions token={token} />}
          {tab === 'receivables' && <PaymentReceivables token={token} />}
          {tab === 'payables' && <PaymentPayables token={token} />}
          {tab === 'refunds' && <PaymentRefunds token={token} />}
          {tab === 'reconciliation' && <PaymentReconciliation token={token} />}
          {tab === 'settings' && <PaymentSettings />}
        </div>
      </SectionCard>
    </div>
  );
};
export default PaymentsPage;