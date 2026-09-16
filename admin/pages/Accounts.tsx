import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, Wallet, Building2, AlertTriangle, ArrowDownLeft, ArrowUpRight, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard } from '../components/finance/FinanceUI';
import { api, money } from '../utils/finance';
import Loading from '../components/loading';

interface Overview {
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalReceived: number;
  totalPaid: number;
  cashAndBank: { accountId: number; name: string; balance: number }[];
  cashBalance: number;
  bankBalance: number;
  walletBalances: { accountId: number; name: string; balance: number }[];
  receivablesBalance: number;
  payablesBalance: number;
  assets: number;
  liabilities: number;
  equity: number;
  taxPayable: number;
  unreconciled: number;
  previous?: { totalIncome: number; totalExpenses: number; netProfit: number } | null;
}

const Accounts = ({ token }: { token: string }) => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; data: Overview }>('/api/accounts/overview', token);
      setData(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const prev = data?.previous;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Accounts" subtitle="Accounting overview and double-entry journal engine" />

      {loading && !data ? (
        <div className="flex items-center justify-center py-12"><Loading /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={money(data.totalIncome)} icon={<ArrowDownLeft size={20} />} tint="from-gold-soft to-gold" />
            <StatCard label="Total Expenses" value={money(data.totalExpenses)} icon={<ArrowUpRight size={20} />} tint="from-espresso/60 to-espresso" />
            <StatCard label="Gross Profit" value={money(data.grossProfit)} icon={<TrendingUp size={20} />} tint="from-blush to-sand" />
            <StatCard label="Net Profit" value={money(data.netProfit)} sub={prev ? `vs ${money(prev.netProfit)} prior` : undefined} icon={<Layers size={20} />} tint="from-sand to-espresso" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Assets" value={money(data.assets)} icon={<Building2 size={20} />} tint="from-gold-soft to-gold" />
            <StatCard label="Liabilities" value={money(data.liabilities)} tint="from-blush to-espresso" />
            <StatCard label="Equity" value={money(data.equity)} tint="from-sand to-gold" />
            <StatCard label="Tax Payable" value={money(data.taxPayable)} icon={<Wallet size={20} />} tint="from-gold-soft to-sand" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Cash in Hand" value={money(data.cashBalance)} tint="from-gold-soft to-gold" />
            <StatCard label="Bank Balance" value={money(data.bankBalance)} tint="from-blush to-sand" />
            <StatCard label="Outstanding Receivables" value={money(data.receivablesBalance)} tint="from-sand to-espresso" />
            <StatCard label="Outstanding Payables" value={money(data.payablesBalance)} tint="from-blush to-espresso" />
          </div>

          {data.walletBalances.length > 0 && (
            <SectionCard title="Wallet Balances">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                {data.walletBalances.map((w) => (
                  <div key={w.accountId} className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-center">
                    <p className="text-xl font-semibold tabular-nums text-ink">{money(w.balance)}</p>
                    <p className="mt-1 text-xs text-ink-soft">{w.name}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <div className="flex flex-wrap items-center gap-3 px-1 text-sm text-ink-soft">
            {data.unreconciled > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/15 px-3 py-1 text-xs font-semibold text-ink">
                <AlertTriangle size={14} className="opacity-80" />
                {data.unreconciled} unreconciled amount(s)
              </span>
            )}
            <span className="text-xs opacity-60">Data shown is aggregated from posted journal entries. Reconciled amounts reflect the double-entry book.</span>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Accounts;