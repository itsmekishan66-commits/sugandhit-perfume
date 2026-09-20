import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, StatCard, TableShell, Th, Td, Row, GhostBtn, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { money, formatDateTime, REFUND_STATUS_LABELS, REFUND_TYPE_LABELS } from '../../utils';
import { Loading } from '../../components';

interface Refund {
  _id: string;
  id: number;
  transactionId: number;
  refundRef?: string;
  amount: number;
  reason?: string;
  type?: string;
  status: string;
  chargeback: boolean;
  createdAt: number | string;
  processedAt?: number | string | null;
}

const PAGE_SIZE = 25;

const PaymentRefunds = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Refund[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) query.set('status', status);
      const res = await api<{ success: boolean; items: Refund[]; total: number; totalPages?: number }>(`/api/payment/refunds?${query}`, token);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (r: Refund, approved: boolean) => {
    setWorking(true);
    try {
      await api('/api/payment/refunds/approve', token, { method: 'POST', body: { id: r.id, approved } });
      toast.success(approved ? 'Refund approved and processed.' : 'Refund rejected.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const pending = items.filter((r) => r.status === 'requested').length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Refunds" subtitle="Refund requests and chargebacks" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Refunds" value={total} tint="from-gold-soft to-gold" />
        <StatCard label="Pending Approval" value={pending} tint="from-blush to-sand" />
        <StatCard label="Total Refunded (page)" value={money(items.reduce((s, r) => s + Number(r.amount || 0), 0))} tint="from-sand to-espresso" />
      </div>

      <SectionCard title="Refund Requests" subtitle={`${total} refunds`} action={
        <select className={`${inputCls} w-44 select-soft`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {Object.entries(REFUND_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      }>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No refunds found.</p>
        ) : (
          <TableShell head={<><Th>Date</Th><Th>Transaction</Th><Th>Type</Th><Th>Reason</Th><Th right>Amount</Th><Th>Status</Th><Th right>Action</Th></>}>
            {items.map((r) => (
              <Row key={r._id}>
                <Td className="whitespace-nowrap text-ink-soft">{formatDateTime(r.createdAt)}</Td>
                <Td className="font-medium text-ink">{r.refundRef || `#${r.id}`}<p className="text-xs text-ink-soft">On transaction #{r.transactionId}</p></Td>
                <Td>{r.chargeback ? <Pill tone="red">Chargeback</Pill> : REFUND_TYPE_LABELS[r.type ?? ''] ?? r.type ?? '—'}</Td>
                <Td className="max-w-[16rem] text-ink-soft">{r.reason || '—'}</Td>
                <Td right className="font-semibold text-espresso tabular-nums">{money(r.amount)}</Td>
                <Td><Pill tone={r.status === 'processed' ? 'green' : r.status === 'requested' ? 'amber' : r.status === 'failed' || r.status === 'reversed' ? 'red' : 'blue'}>{REFUND_STATUS_LABELS[r.status] ?? r.status}</Pill></Td>
                <Td right>
                  {r.status === 'requested' ? (
                    <div className="inline-flex gap-2">
                      <button onClick={() => decide(r, true)} disabled={working} className="btn-gold px-4 py-1.5 text-sm cursor-pointer">Approve</button>
                      <button onClick={() => decide(r, false)} disabled={working} className="px-4 py-1.5 text-sm text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">Reject</button>
                    </div>
                  ) : (
                    <GhostBtn className="opacity-40 pointer-events-none">No action</GhostBtn>
                  )}
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
    </div>
  );
};

export default PaymentRefunds;