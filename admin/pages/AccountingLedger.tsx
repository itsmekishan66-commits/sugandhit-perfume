import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, TableShell, Th, Td, Row, inputCls } from '../components/finance/FinanceUI';
import { api, money, formatDate } from '../utils/finance';

interface ChartAcc { id: number; code: string; name: string; accountType: string; active: boolean }

interface LedgerRow {
  lineId: number;
  entryId: number;
  entryNumber: string;
  entryDate: number;
  description?: string;
  referenceType?: string;
  debit: number;
  credit: number;
  lineDescription?: string;
  runningBalance: number;
}

const AccountingLedger = ({ token }: { token: string }) => {
  const [accounts, setAccounts] = useState<ChartAcc[]>([]);
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api<{ success: boolean; accounts: ChartAcc[] }>('/api/accounts/chart', token);
      setAccounts(res.accounts);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [token]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const load = async () => {
    if (!accountId) {
      toast.error('Select an account first.');
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({ accountId });
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      const res = await api<{ success: boolean; rows: LedgerRow[] }>(`/api/accounts/ledger?${q}`, token);
      setRows(res.rows);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selected = accounts.find((a) => a.id === Number(accountId));
  const closing = rows.length ? rows[rows.length - 1].runningBalance : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="General Ledger" subtitle="All journal postings for a selected account" />

      <SectionCard title="Filter">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4">
          <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Select account…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
          <input type="number" className={inputCls} placeholder="From (ms)" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="number" className={inputCls} placeholder="To (ms)" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={load} className="btn-gold px-5 py-2.5 text-sm cursor-pointer">Run</button>
        </div>
      </SectionCard>

      {selected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Account" value={selected.name} sub={`${selected.code} · ${selected.accountType}`} tint="from-gold-soft to-gold" />
          <StatCard label="Total Debits" value={money(rows.reduce((s, r) => s + r.debit, 0))} tint="from-blush to-sand" />
          <StatCard label="Closing Balance" value={money(closing)} tint="from-sand to-espresso" />
        </div>
      )}

      <SectionCard title="Ledger Entries">
        {loading ? (
          <p className="text-center text-ink-soft/60 py-10">Loading ledger…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">Select an account and run to view its ledger.</p>
        ) : (
          <TableShell head={<><Th>Date</Th><Th>Entry</Th><Th>Description</Th><Th>Reference</Th><Th right>Debit</Th><Th right>Credit</Th><Th right>Running Balance</Th></>}>
            {rows.map((r) => (
              <Row key={r.lineId}>
                <Td>{formatDate(r.entryDate)}</Td>
                <Td className="font-medium text-ink font-mono">{r.entryNumber}</Td>
                <Td className="text-ink-soft">{r.lineDescription || r.description || '—'}</Td>
                <Td className="text-ink-soft">{r.referenceType || '—'}</Td>
                <Td right className="tabular-nums">{r.debit ? money(r.debit) : '—'}</Td>
                <Td right className="tabular-nums">{r.credit ? money(r.credit) : '—'}</Td>
                <Td right className={`font-semibold tabular-nums ${r.runningBalance >= 0 ? 'text-ink' : 'text-espresso'}`}>{money(r.runningBalance)}</Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>
    </div>
  );
};

export default AccountingLedger;