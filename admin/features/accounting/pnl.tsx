import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, StatCard, TableShell, Th, Td, Row, inputCls } from '../../components';
import { api } from '../../services/api';
import { money } from '../../utils';
import { Loading } from '../../components';

interface PnlRow { code: string; name: string; amount: number }
interface Data {
  revenueRows: PnlRow[]; cogsRows: PnlRow[]; expenseRows: PnlRow[];
  revenue: number; cogs: number; expenses: number; grossProfit: number; netProfit: number;
  comparison?: { revenue: number; cogs: number; expenses: number; grossProfit: number; netProfit: number } | null;
}

const AccountingPnL = ({ token }: { token: string }) => {
  const [data, setData] = useState<Data | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [compareFrom, setCompareFrom] = useState('');
  const [compareTo, setCompareTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      if (compareFrom) q.set('compareFrom', compareFrom);
      if (compareTo) q.set('compareTo', compareTo);
      const res = await api<{ success: boolean; data: Data }>(`/api/accounts/profit-loss?${q}`, token);
      setData(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, from, to, compareFrom, compareTo]);

  useEffect(() => { load(); }, [load]);

  const section = (title: string, rows: PnlRow[], total: number) => (
    <SectionCard title={title}>
      <TableShell head={<><Th>Account</Th><Th right>Amount</Th></>}>
        {rows.map((r) => (
          <Row key={r.code}>
            <Td>{r.name} <span className="text-xs text-ink-soft font-mono">({r.code})</span></Td>
            <Td right className="tabular-nums text-ink-soft">{money(r.amount)}</Td>
          </Row>
        ))}
        <Row>
          <Td className="font-semibold" grow>{title} total</Td>
          <Td right className="font-semibold text-espresso tabular-nums">{money(total)}</Td>
        </Row>
      </TableShell>
    </SectionCard>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profit & Loss" subtitle="Income statement" />

      <SectionCard title="Period & Comparison">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
          <input type="number" className={inputCls} placeholder="From (ms)" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="number" className={inputCls} placeholder="To (ms)" value={to} onChange={(e) => setTo(e.target.value)} />
          <input type="number" className={inputCls} placeholder="Compare from (ms)" value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)} />
          <input type="number" className={inputCls} placeholder="Compare to (ms)" value={compareTo} onChange={(e) => setCompareTo(e.target.value)} />
          <button onClick={load} className="btn-gold px-5 py-2 text-sm cursor-pointer">Refresh</button>
        </div>
      </SectionCard>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Revenue" value={money(data.revenue)} tint="from-gold-soft to-gold" />
            <StatCard label="Cost of Goods Sold" value={money(data.cogs)} tint="from-espresso/60 to-espresso" />
            <StatCard label="Gross Profit" value={money(data.grossProfit)} tint="from-blush to-sand" />
            <StatCard label="Net Profit" value={money(data.netProfit)} tint={`${data.netProfit >= 0 ? 'from-sand' : 'from-espresso/60'} to-espresso`} />
          </div>

          {data.comparison && (
            <SectionCard title="Comparison" subtitle="Previous period">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 text-sm">
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-center"><p className="text-xs text-ink-soft">Revenue</p><p className="font-semibold text-ink">{money(data.comparison.revenue)}</p></div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-center"><p className="text-xs text-ink-soft">COGS</p><p className="font-semibold text-ink">{money(data.comparison.cogs)}</p></div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-center"><p className="text-xs text-ink-soft">Expenses</p><p className="font-semibold text-ink">{money(data.comparison.expenses)}</p></div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-center"><p className="text-xs text-ink-soft">Gross Profit</p><p className="font-semibold text-ink">{money(data.comparison.grossProfit)}</p></div>
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-center"><p className="text-xs text-ink-soft">Net Profit</p><p className="font-semibold text-ink">{money(data.comparison.netProfit)}</p></div>
              </div>
            </SectionCard>
          )}

          {loading ? <div className="flex items-center justify-center py-10"><Loading /></div> : (
            <>
              {section('Revenue', data.revenueRows, data.revenue)}
              {section('Cost of Goods Sold', data.cogsRows, data.cogs)}
              {section('Operating Expenses', data.expenseRows, data.expenses)}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AccountingPnL;