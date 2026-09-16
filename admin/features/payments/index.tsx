import { useState } from 'react';
import { PageHeader } from '../../components';
import { SectionCard, Tabs } from '../../components';
import Payment from './payment';
import PaymentAccounts from './accounts';
import PaymentTransactions from './transactions';
import PaymentReceivables from './receivables';
import PaymentPayables from './payables';
import PaymentRefunds from './refunds';
import PaymentReconciliation from './reconciliation';
import PaymentSettings from './settings';

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
          {tab === 'settings' && <PaymentSettings token={token} />}
        </div>
      </SectionCard>
    </div>
  );
};

export default PaymentsPage;