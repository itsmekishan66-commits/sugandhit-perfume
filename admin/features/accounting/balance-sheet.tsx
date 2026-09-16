import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { money } from '../../utils';

interface Row { code: string; name: string; accountType: string; balance: number }
interface Data {
  assets: { current: number; fixed: number; total: number; rows: Row[] };
  liabilities: { total: number; rows: Row[] };
  equity: { total: number; rows: Row[] };
  currentPeriodProfit: number;
  totalLiabilitiesAndEquity: number;
  balanced: boolean;
  difference: number;
}

const AccountingBalanceSheet = ({ token }: { token: string }) => {
  const [data, setData] = useState<Data | null>(null);
  const [asOf, setAsOf] = useState('');
  const [, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = asOf ? `?asOf=${asOf}` : '';
      const res = await api<{ success: boolean; data: Data }>(`/api/accounts/balance-sheet${q}`, token);
      setData(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, asOf]);

  useEffect(() => { load(); }, [load]);

  const section = (title: string, rows: Row[], total: number) => (
    <SectionCard title={title}>
      <TableShell head={<><Th>Account</Th><Th right>Balance</Th></>}>
        {rows.map((r) => (
          <Row key={r.code}>
            <Td>{r.name} <span className="text-xs text-ink-soft font-mono">({r.code})</span></Td>
            <Td right className={`tabular-nums ${r.balance >= 0 ? 'text-ink' : 'text-espresso'}`}>{money(r.balance)}</Td>
          </Row>
        ))}
        <Row>
          <Td className="font-semibold" grow>Total</Td>
          <Td right className="font-semibold text-espresso tabular-nums">{money(total)}</Td>
        </Row>
      </TableShell>
    </SectionCard>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Balance Sheet" subtitle="Statement of financial position" />

      <SectionCard title="As Of">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          <input type="number" className={inputCls} placeholder="As of date (ms; empty = now)" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          <button onClick={load} className="btn-gold px-5 py-2 text-sm cursor-pointer">Refresh</button>
        </div>
      </SectionCard>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Assets" value={money(data.assets.total)} tint="from-gold-soft to-gold" />
            <StatCard label="Total Liabilities" value={money(data.liabilities.total)} tint="from-blush to-sand" />
            <StatCard label="Equity + Profit" value={money(data.equity.total + data.currentPeriodProfit)} sub={`Includes ${money(data.currentPeriodProfit)} current profit`} tint="from-sand to-espresso" />
            <StatCard label="Balanced" value={data.balanced ? 'Yes' : `Diff ${money(data.difference)}`} tint={data.balanced ? 'from-blush to-espresso' : 'from-espresso/60 to-espresso'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              {section('Assets', data.assets.rows, data.assets.total)}
            </div>
            <div className="flex flex-col gap-6">
              {section('Liabilities', data.liabilities.rows, data.liabilities.total)}
              {section('Equity', data.equity.rows, data.equity.total + data.currentPeriodProfit)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-1 text-sm text-ink-soft">
            <Pill tone={data.balanced ? 'green' : 'red'}>Assets = Liabilities + Equity</Pill>
            <span className="text-xs opacity-60">Assets {money(data.assets.total)} vs Liabilities &amp; Equity {money(data.totalLiabilitiesAndEquity)}.</span>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingBalanceSheet;