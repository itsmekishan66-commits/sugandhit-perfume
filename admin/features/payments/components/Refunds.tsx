import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/data-display/PageHeader';
import SectionCard from '@/components/data-display/SectionCard';
import StatCard from '@/components/data-display/StatCard';
import TableShell from '@/components/data-display/TableShell';
import Th from '@/components/data-display/Th';
import Td from '@/components/data-display/Td';
import Row from '@/components/data-display/Row';
import GhostBtn from '@/components/ui/GhostBtn';
import Pill from '@/components/data-display/Pill';
import inputCls from '@/components/ui/input';
import Pagination from '@/components/ui/Pagination';
import { api } from '@/services/api';
import { money, formatDateTime } from '@/utils/format';
import { REFUND_STATUS_LABELS, REFUND_TYPE_LABELS } from '@/utils/labels';
import Loading from '@/components/feedback/Loading';

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

const PAGE_SIZE = 20;

const PaymentRefunds = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Refund[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
          <Loading />
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
        <Pagination total={total} perPage={PAGE_SIZE} page={page} onPage={setPage} label="Refunds" />
      </SectionCard>
    </div>
  );
};

export default PaymentRefunds;