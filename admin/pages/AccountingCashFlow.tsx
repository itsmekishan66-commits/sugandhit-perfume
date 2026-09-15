import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, Pill, inputCls } from '../components/finance/FinanceUI';
import { api, money } from '../utils/finance';

interface Group { inflows: number; outflows: number; net: number }
interface Data {
  operating: Group; investing: Group; financing: Group;
  totalInflows: number; totalOutflows: number; netCash: number;
  openingBalance: number; closingBalance: number;
}

const AccountingCashFlow = ({ token }: { token: string }) => {
  const [data, setData] = useState<Data | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      const res = await api<{ success: boolean; data: Data }>(`/api/accounts/cash-flow?${q}`, token);
      setData(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  useEffect(() => { load(); }, [load]);

  const section = (g: Group, title: string) => (
    <div className="rounded-xl border border-gold/15 bg-white/70 p-5 flex flex-col gap-3">
      <SectionCard title={title}>
        <div className="grid grid-cols-3 gap-3 p-4">
          <div className="text-center"><p className="text-xs text-ink-soft">Inflows</p><p className="text-lg font-semibold text-espresso tabular-nums">{money(g.inflows)}</p></div>
          <div className="text-center"><p className="text-xs text-ink-soft">Outflows</p><p className="text-lg font-semibold tabular-nums">{money(g.outflows)}</p></div>
          <div className="text-center"><p className="text-xs text-ink-soft">Net</p><p className={`text-lg font-semibold tabular-nums ${g.net >= 0 ? 'text-espresso' : 'text-espresso'}`}>{money(g.net)}</p></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cash Flow" subtitle="Cash movements across operating, investing and financing" />

      <SectionCard title="Period">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          <input type="number" className={inputCls} placeholder="From (ms)" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="number" className={inputCls} placeholder="To (ms)" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={load} className="btn-gold px-5 py-2 text-sm cursor-pointer">Refresh</button>
        </div>
      </SectionCard>

      {data && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Opening Balance" value={money(data.openingBalance)} tint="from-blush to-sand" />
            <StatCard label="Total Inflows" value={money(data.totalInflows)} tint="from-gold-soft to-gold" />
            <StatCard label="Total Outflows" value={money(data.totalOutflows)} tint="from-espresso/60 to-espresso" />
            <StatCard label="Net Cash" value={money(data.netCash)} sub={`Closing ${money(data.closingBalance)}`} tint="from-sand to-espresso" />
          </div>

          {section(data.operating, 'Operating Activities')}
          {section(data.investing, 'Investing Activities')}
          {section(data.financing, 'Financing Activities')}

          <div className="px-1 text-sm text-ink-soft">
            <Pill tone={data.netCash >= 0 ? 'green' : 'red'}>Net change: {money(data.netCash)}</Pill>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingCashFlow;