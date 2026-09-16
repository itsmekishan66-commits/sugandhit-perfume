import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../components/finance/FinanceUI';
import { api, money, num, formatDate, DEBT_STATUS_LABELS } from '../utils/finance';
import Loading from '../components/loading';

interface Receivable {
  _id: string;
  id: number;
  orderId?: number | null;
  invoiceRef?: string;
  invoiceDate: number;
  dueDate: number;
  originalAmount: number;
  paidAmount: number;
  creditApplied: number;
  refundAmount: number;
  outstandingAmount: number;
  status: string;
  daysOverdue: number;
  customerId?: number | null;
  customer: { id: number; name: string; email?: string; phone?: string } | null;
  payments: { id: number; amount: number; appliedAt: number }[];
}

interface Aging { current: number; d30: number; d60: number; d90: number; d90plus: number }

const PAGE_SIZE = 25;

const PaymentReceivables = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Receivable[]>([]);
  const [total, setTotal] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [aging, setAging] = useState<Aging | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjust, setAdjust] = useState<Receivable | null>(null);
  const [adjustMode, setAdjustMode] = useState<'adjust' | 'write_off'>('adjust');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [working, setWorking] = useState(false);
  const [statement, setStatement] = useState<{ customer: { id: number; name: string } | null; balance: number; receivables: Receivable[] } | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) query.set('status', status);
      const [listRes, agingRes] = await Promise.all([
        api<{ success: boolean; items: Receivable[]; total: number; totalOutstanding: number; totalPages?: number }>(`/api/accounts/receivables?${query}`, token),
        api<{ success: boolean; data: Aging }>('/api/accounts/receivables/aging', token),
      ]);
      setItems(listRes.items);
      setTotal(listRes.total);
      setTotalOutstanding(listRes.totalOutstanding);
      setTotalPages(listRes.totalPages || 1);
      setAging(agingRes.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openStatement = async (r: Receivable) => {
    if (!r.customerId) {
      toast.error('This receivable has no linked customer.');
      return;
    }
    setStatementLoading(true);
    setStatement(null);
    try {
      const res = await api<{ success: boolean; data: { customerId: number; balance: number; receivables: Receivable[] } }>(`/api/accounts/receivables/statement/${r.customerId}`, token);
      setStatement({ customer: r.customer, balance: res.data.balance, receivables: res.data.receivables });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setStatementLoading(false);
    }
  };

  const submitAdjust = async () => {
    if (!adjust) return;
    if (adjustMode === 'adjust' && num(adjustAmount) <= 0) {
      toast.error('Adjustment amount must be positive.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/accounts/receivables/adjust', token, {
        method: 'POST',
        body: { id: adjust.id, mode: adjustMode, amount: adjustMode === 'adjust' ? Number(adjustAmount) : undefined, reason: adjustReason },
      });
      toast.success(adjustMode === 'write_off' ? 'Receivable written off.' : 'Receivable adjusted.');
      setAdjust(null);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustMode('adjust');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const agingRows: { label: string; value: number; tone: string }[] = aging
    ? [
        { label: 'Current', value: aging.current, tone: 'green' },
        { label: '1–30 days', value: aging.d30, tone: 'gold' },
        { label: '31–60 days', value: aging.d60, tone: 'amber' },
        { label: '61–90 days', value: aging.d90, tone: 'amber' },
        { label: '90+ days', value: aging.d90plus, tone: 'red' },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Receivables" subtitle="Amounts owed by customers" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Outstanding" value={money(totalOutstanding)} tint="from-gold-soft to-gold" />
        <StatCard label="Invoices" value={total} tint="from-blush to-sand" />
        <StatCard label="Receivable Balance" value={money(items.reduce((s, r) => s + num(r.outstandingAmount), 0))} sub="shown page" tint="from-sand to-espresso" />
        <StatCard label="Unpaid / Overdue" value={items.filter((r) => r.status === 'overdue' || r.status === 'unpaid').length} tint="from-blush to-espresso" />
      </div>

      <SectionCard title="Aging Summary">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4">
          {agingRows.map((a) => (
            <div key={a.label} className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-center">
              <p className={`text-xl font-semibold tabular-nums ${a.tone === 'red' ? 'text-espresso' : 'text-ink'}`}>{money(a.value)}</p>
              <p className="mt-1 text-xs text-ink-soft">{a.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Receivables" subtitle={`${total} invoices`} action={
        <select className={`${inputCls} w-44 select-soft`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {Object.entries(DEBT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      }>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No receivables found.</p>
        ) : (
          <TableShell
            head={
              <>
                <Th>Customer</Th>
                <Th>Invoice</Th>
                <Th>Invoice Date</Th>
                <Th>Due</Th>
                <Th right>Amount</Th>
                <Th right>Paid</Th>
                <Th right>Outstanding</Th>
                <Th>Status</Th>
                <Th right>Action</Th>
              </>
            }
          >
            {items.map((r) => (
              <Row key={r._id}>
                <Td>
                  <p className="font-medium text-ink">{r.customer?.name || (r.customerId ? `Customer #${r.customerId}` : '—')}</p>
                </Td>
                <Td className="text-ink-soft">{r.invoiceRef || (r.orderId ? `Order #${r.orderId}` : `#${r.id}`)}</Td>
                <Td>{formatDate(r.invoiceDate)}</Td>
                <Td className="text-ink-soft">{formatDate(r.dueDate)}</Td>
                <Td right className="tabular-nums">{money(r.originalAmount)}</Td>
                <Td right className="tabular-nums">{money(r.paidAmount)}</Td>
                <Td right className={`font-semibold tabular-nums ${num(r.outstandingAmount) > 0 ? 'text-espresso' : 'text-ink-soft'}`}>{money(r.outstandingAmount)}</Td>
                <Td>
                  <Pill tone={r.status === 'paid' ? 'green' : r.status === 'overdue' ? 'red' : r.status === 'partially_paid' ? 'amber' : 'gold'}>{labelStatus(r.status)}</Pill>
                </Td>
                <Td right>
                  <div className="inline-flex flex-col items-end gap-1.5">
                    <button onClick={() => openStatement(r)} className="px-3 py-1 text-xs text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">Statement</button>
                    <button onClick={() => { setAdjust(r); setAdjustMode('adjust'); setAdjustAmount(String(r.outstandingAmount)); setAdjustReason(''); }} className="btn-gold px-4 py-1 text-sm cursor-pointer">
                      Adjust / Write off
                    </button>
                  </div>
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gold/15 text-sm">
            <GhostBtn onClick={() => setPage((p) => Math.max(1, p - 1))} className={page <= 1 ? 'opacity-40 pointer-events-none' : ''}>Prev</GhostBtn>
            <span className="text-ink-soft">Page {page} of {totalPages}</span>
            <GhostBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={page >= totalPages ? 'opacity-40 pointer-events-none' : ''}>Next</GhostBtn>
          </div>
        )}
      </SectionCard>

      <Modal open={!!adjust} title={adjustMode === 'write_off' ? 'Write Off Receivable' : 'Adjust Receivable'} onClose={() => setAdjust(null)}>
        {adjust && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-gold/15 bg-white/70 p-3 text-sm">
              <p className="font-medium text-ink">{adjust.customer?.name || 'Customer'} — outstanding <span className="font-semibold text-espresso">{money(adjust.outstandingAmount)}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAdjustMode('adjust')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${adjustMode === 'adjust' ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft border border-gold/20'}`}>Adjust balance</button>
              <button onClick={() => setAdjustMode('write_off')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${adjustMode === 'write_off' ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft border border-gold/20'}`}>Write off</button>
            </div>
            {adjustMode === 'adjust' && (
              <Field label="Adjustment amount">
                <input type="number" className={inputCls} value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder={String(adjust.outstandingAmount)} />
              </Field>
            )}
            <Field label="Reason">
              <input className={inputCls} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Why is this adjusted / written off?" />
            </Field>
            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setAdjust(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={submitAdjust} disabled={working}>{working ? 'Saving…' : adjustMode === 'write_off' ? 'Write Off' : 'Apply Adjustment'}</PrimaryBtn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!statement || statementLoading} title="Customer Statement" onClose={() => setStatement(null)} wide>
        {statementLoading ? (
          <div className="flex items-center justify-center py-16"><Loading /></div>
        ) : statement ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-sm flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-ink">{statement.customer?.name ?? `Customer #${statement.customer?.id ?? ''}`}</p>
              <p className="text-ink-soft">Balance outstanding <span className="font-semibold text-espresso">{money(statement.balance)}</span></p>
            </div>
            {statement.receivables.length === 0 ? (
              <p className="text-center text-ink-soft/60 py-8">No receivables for this customer.</p>
            ) : (
              <TableShell head={<><Th>Invoice</Th><Th>Invoice Date</Th><Th>Due</Th><Th right>Amount</Th><Th right>Paid</Th><Th right>Outstanding</Th><Th>Status</Th></>}>
                {statement.receivables.map((r) => (
                  <Row key={r._id}>
                    <Td className="font-medium text-ink">{r.invoiceRef || (r.orderId ? `Order #${r.orderId}` : `#${r.id}`)}</Td>
                    <Td>{formatDate(r.invoiceDate)}</Td>
                    <Td className="text-ink-soft">{formatDate(r.dueDate)}</Td>
                    <Td right className="tabular-nums">{money(r.originalAmount)}</Td>
                    <Td right className="tabular-nums">{money(r.paidAmount)}</Td>
                    <Td right className={`font-semibold tabular-nums ${num(r.outstandingAmount) > 0 ? 'text-espresso' : 'text-ink-soft'}`}>{money(r.outstandingAmount)}</Td>
                    <Td><Pill tone={r.status === 'paid' ? 'green' : r.status === 'overdue' ? 'red' : r.status === 'partially_paid' ? 'amber' : 'gold'}>{labelStatus(r.status)}</Pill></Td>
                  </Row>
                ))}
              </TableShell>
            )}
            <div className="flex justify-end">
              <GhostBtn onClick={() => setStatement(null)}>Close</GhostBtn>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

const labelStatus = (s: string) => DEBT_STATUS_LABELS[s] ?? s;

export default PaymentReceivables;