import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Pill, inputCls } from '../components/finance/FinanceUI';
import { api, money, ACCOUNT_TYPE_LABELS } from '../utils/finance';

interface Row { accountId: number; code: string; name: string; type: string; normalBalance: string; debit: number; credit: number; balance: number }
interface Data { rows: Row[]; totalDebit: number; totalCredit: number; balanced: boolean; difference: number }

const AccountingTrialBalance = ({ token }: { token: string }) => {
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
      const res = await api<{ success: boolean; data: Data }>(`/api/accounts/trial-balance?${q}`, token);
      setData(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Trial Balance" subtitle="Debits and credits by account" />

      <SectionCard title="Period">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          <input type="number" className={inputCls} placeholder="From (ms)'" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="number" className={inputCls} placeholder="To (ms)" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={load} className="btn-gold px-5 py-2 text-sm cursor-pointer">Refresh</button>
        </div>
      </SectionCard>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Debits" value={money(data.totalDebit)} tint="from-gold-soft to-gold" />
            <StatCard label="Total Credits" value={money(data.totalCredit)} tint="from-blush to-sand" />
            <StatCard label="Balanced" value={data.balanced ? 'Yes' : `No (diff ${money(data.difference)})`} tint={data.balanced ? 'from-blush to-espresso' : 'from-espresso/60 to-espresso'} />
          </div>

          <SectionCard title="Accounts">
            {loading ? (
              <p className="text-center text-ink-soft/60 py-10">Loading…</p>
            ) : (
              <TableShell head={<><Th>Code</Th><Th>Account</Th><Th>Type</Th><Th right>Debit</Th><Th right>Credit</Th><Th right>Balance</Th></>}>
                {data.rows.map((r) => (
                  <Row key={r.accountId}>
                    <Td className="font-medium text-ink font-mono">{r.code}</Td>
                    <Td className="text-ink">{r.name}</Td>
                    <Td><Pill tone="gold">{ACCOUNT_TYPE_LABELS[r.type] ?? r.type}</Pill></Td>
                    <Td right className="tabular-nums">{r.debit ? money(r.debit) : '—'}</Td>
                    <Td right className="tabular-nums">{r.credit ? money(r.credit) : '—'}</Td>
                    <Td right className={`font-semibold tabular-nums ${r.balance >= 0 ? 'text-ink' : 'text-espresso'}`}>{money(r.balance)}</Td>
                  </Row>
                ))}
                <Row>
                  <Td className="font-semibold" grow>Total</Td>
                  <Td />
                  <Td />
                  <Td right className="font-semibold text-espresso tabular-nums">{money(data.totalDebit)}</Td>
                  <Td right className="font-semibold text-espresso tabular-nums">{money(data.totalCredit)}</Td>
                  <Td right className="font-semibold tabular-nums">{money(data.difference)}</Td>
                </Row>
              </TableShell>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default AccountingTrialBalance;