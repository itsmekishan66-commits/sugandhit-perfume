import { useCallback, useEffect, useState } from 'react';
import { Plus, Eye, Undo2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../components/finance/FinanceUI';
import { api, money, num, label, formatDateTime, CHANNEL_LABELS, TXN_TYPE_LABELS, TXN_STATUS_LABELS } from '../utils/finance';
import Loading from '../components/loading';

interface Transaction {
  id: number;
  _id: string;
  transactionId: string;
  providerTransactionId?: string;
  orderId?: number | null;
  customOrderId?: number | null;
  customerId?: number | null;
  customerName?: string;
  channel: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
  processingFee: number;
  netAmount: number;
  taxAmount: number;
  status: string;
  transactionType: string;
  paymentAccountId?: number | null;
  initiatedAt: number | string;
  completedAt?: number | string | null;
  failureReason?: string;
  refundRef?: string;
  reconciliationStatus?: string;
  source?: string;
}

const PAGE_SIZE = 25;

const PaymentTransactions = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<{ status: string; channel: string; type: string }>({ status: '', channel: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [working, setWorking] = useState(false);

  const [manual, setManual] = useState({ customerName: '', channel: 'cash', paymentMethod: '', amount: '', processingFee: '0', taxAmount: '0', transactionType: 'payment', providerTransactionId: '' });
  const [refund, setRefund] = useState({ amount: '', reason: '', type: 'full_refund', chargeback: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filters.status) query.set('status', filters.status);
      if (filters.channel) query.set('channel', filters.channel);
      if (filters.type) query.set('type', filters.type);
      const res = await api<{ success: boolean; items: Transaction[]; total: number; totalPages: number }>(`/api/payment/transactions?${query}`, token);
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: number) => {
    setDetail(null);
    try {
      const res = await api<{ success: boolean; transaction: Transaction }>(`/api/payment/transactions/${id}`, token);
      setDetail(res.transaction);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitManual = async () => {
    if (!num(manual.amount) || num(manual.amount) <= 0) {
      toast.error('Amount must be positive.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/payment/transactions/manual', token, {
        method: 'POST',
        body: {
          customerName: manual.customerName,
          channel: manual.channel,
          paymentMethod: manual.paymentMethod,
          amount: Number(manual.amount),
          processingFee: Number(manual.processingFee || 0),
          taxAmount: Number(manual.taxAmount || 0),
          transactionType: manual.transactionType,
          providerTransactionId: manual.providerTransactionId,
        },
      });
      toast.success('Payment recorded.');
      setShowManual(false);
      setManual({ customerName: '', channel: 'cash', paymentMethod: '', amount: '', processingFee: '0', taxAmount: '0', transactionType: 'payment', providerTransactionId: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const submitRefund = async () => {
    if (!detail) return;
    if (!num(refund.amount) || num(refund.amount) <= 0) {
      toast.error('Refund amount must be positive.');
      return;
    }
    if (!refund.reason.trim()) {
      toast.error('Reason is required.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/payment/refunds', token, {
        method: 'POST',
        body: { transactionId: detail.id, amount: Number(refund.amount), reason: refund.reason, type: refund.type, chargeback: refund.chargeback },
      });
      toast.success(refund.chargeback ? 'Chargeback filed.' : 'Refund requested.');
      setShowRefund(false);
      setRefund({ amount: '', reason: '', type: 'full_refund', chargeback: false });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const setStatus = async (t: Transaction, status: string) => {
    try {
      await api('/api/payment/transactions/status', token, { method: 'POST', body: { id: t.id, status } });
      toast.success('Status updated.');
      load();
      if (detail?.id === t.id) setDetail({ ...detail, status });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const markReconciled = async (t: Transaction) => {
    try {
      await api('/api/payment/transactions/reconcile', token, { method: 'POST', body: { id: t.id, status: 'reconciled' } });
      toast.success('Marked reconciled.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const select = (options: [string, string][], value: string, onChange: (v: string) => void) => (
    <select className={`${inputCls} select-soft`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All</option>
      {options.map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transactions"
        subtitle={`${total} transactions`}
        trailing={
          <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowManual(true)}>
            <Plus size={16} /> Record Payment
          </button>
        }
      />

      <SectionCard title="Filters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          {select(Object.entries(TXN_STATUS_LABELS), filters.status, (v) => { setFilters({ ...filters, status: v }); setPage(1); })}
          {select(Object.entries(CHANNEL_LABELS), filters.channel, (v) => { setFilters({ ...filters, channel: v }); setPage(1); })}
          {select(Object.entries(TXN_TYPE_LABELS), filters.type, (v) => { setFilters({ ...filters, type: v }); setPage(1); })}
        </div>
      </SectionCard>

      <SectionCard title="Payment Transactions">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No transactions found.</p>
        ) : (
          <TableShell
            head={
              <>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Channel</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th right>Amount</Th>
                <Th right>Net</Th>
                <Th>Recon</Th>
                <Th right>Action</Th>
              </>
            }
          >
            {items.map((t) => (
              <Row key={t.id}>
                <Td className="whitespace-nowrap text-ink-soft">{formatDateTime(t.initiatedAt)}</Td>
                <Td>
                  <p className="font-medium text-ink">{t.customerName || (t.customerId ? `Customer #${t.customerId}` : '—')}</p>
                  {t.orderId && <p className="text-xs text-ink-soft">Order #{t.orderId}</p>}
                </Td>
                <Td>{label(CHANNEL_LABELS, t.channel, t.channel)}</Td>
                <Td>{label(TXN_TYPE_LABELS, t.transactionType, t.transactionType)}</Td>
                <Td>
                  <Pill tone={t.status === 'successful' || t.status === 'reconciled' ? 'green' : t.status === 'failed' || t.status === 'chargeback' || t.status === 'reversed' ? 'red' : t.status === 'pending' || t.status === 'initiated' || t.status === 'authorized' ? 'amber' : 'gray'}>{label(TXN_STATUS_LABELS, t.status, t.status)}</Pill>
                </Td>
                <Td right className="tabular-nums">{money(t.amount)}</Td>
                <Td right className="font-semibold text-espresso tabular-nums">{money(t.netAmount)}</Td>
                <Td>
                  <Pill tone={t.reconciliationStatus === 'reconciled' ? 'green' : 'amber'}>{t.reconciliationStatus}</Pill>
                </Td>
                <Td right>
                  <button onClick={() => openDetail(t.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer" title="View details">
                    <Eye size={16} />
                  </button>
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

      <Modal open={!!detail} title={`Transaction ${detail?.transactionId ?? ''}`} onClose={() => setDetail(null)}>
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Customer</p><p className="font-medium text-ink">{detail.customerName || (detail.customerId ? `Customer #${detail.customerId}` : '—')}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Status</p><Pill tone={detail.status === 'successful' ? 'green' : 'amber'}>{label(TXN_STATUS_LABELS, detail.status, detail.status)}</Pill></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Type</p><p className="font-medium text-ink">{label(TXN_TYPE_LABELS, detail.transactionType, detail.transactionType)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Channel / Method</p><p className="font-medium text-ink">{label(CHANNEL_LABELS, detail.channel, detail.channel)}{detail.paymentMethod ? ` · ${detail.paymentMethod}` : ''}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Amount</p><p className="font-display text-lg font-semibold text-espresso">{money(detail.amount)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Fee / Tax / Net</p><p className="font-medium text-ink">{money(detail.processingFee)} / {money(detail.taxAmount)} / {money(detail.netAmount)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Initiated</p><p className="font-medium text-ink">{formatDateTime(detail.initiatedAt)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Order</p><p className="font-medium text-ink">{detail.orderId ? `#${detail.orderId}` : detail.customOrderId ? `Custom #${detail.customOrderId}` : '—'}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3 col-span-2"><p className="text-xs text-ink-soft mb-1">Provider Ref</p><p className="font-medium text-ink break-all">{detail.providerTransactionId || '—'}</p></div>
            </div>

            {detail.failureReason && (
              <div className="rounded-xl border border-espresso/20 bg-espresso/10 p-3 text-sm text-espresso">{detail.failureReason}</div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <PrimaryBtn onClick={() => { setRefund({ amount: String(detail.amount > 0 ? Math.min(detail.amount, Math.abs(detail.netAmount) || detail.amount) : detail.amount), reason: '', type: 'full_refund', chargeback: false }); setShowRefund(true); }}>
                <Undo2 size={16} /> Request Refund
              </PrimaryBtn>
              {detail.reconciliationStatus !== 'reconciled' && (
                <button onClick={() => markReconciled(detail)} className="btn-gold px-5 py-2 text-sm cursor-pointer">
                  <CheckCircle2 size={16} /> Mark Reconciled
                </button>
              )}
              {detail.status === 'successful' || detail.status === 'reconciled' ? (
                <GhostBtn onClick={() => setStatus(detail, 'failed')}>Mark Failed</GhostBtn>
              ) : (
                <GhostBtn onClick={() => setStatus(detail, 'successful')}>Mark Successful</GhostBtn>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showManual} title="Record Manual Payment" onClose={() => setShowManual(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Customer name">
            <input className={inputCls} value={manual.customerName} onChange={(e) => setManual({ ...manual, customerName: e.target.value })} />
          </Field>
          <Field label="Channel">
            <select className={inputCls} value={manual.channel} onChange={(e) => setManual({ ...manual, channel: e.target.value })}>
              {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={manual.transactionType} onChange={(e) => setManual({ ...manual, transactionType: e.target.value })}>
              {Object.entries(TXN_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Payment method (optional)">
            <input className={inputCls} value={manual.paymentMethod} onChange={(e) => setManual({ ...manual, paymentMethod: e.target.value })} placeholder="e.g. COD, QR" />
          </Field>
          <Field label="Amount">
            <input type="number" className={inputCls} value={manual.amount} onChange={(e) => setManual({ ...manual, amount: e.target.value })} />
          </Field>
          <Field label="Processing fee">
            <input type="number" className={inputCls} value={manual.processingFee} onChange={(e) => setManual({ ...manual, processingFee: e.target.value })} />
          </Field>
          <Field label="Tax">
            <input type="number" className={inputCls} value={manual.taxAmount} onChange={(e) => setManual({ ...manual, taxAmount: e.target.value })} />
          </Field>
          <Field label="Provider transaction ID">
            <input className={inputCls} value={manual.providerTransactionId} onChange={(e) => setManual({ ...manual, providerTransactionId: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowManual(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submitManual} disabled={working}>{working ? 'Saving…' : 'Record Payment'}</PrimaryBtn>
        </div>
      </Modal>

      <Modal open={showRefund} title={`Request Refund on ${detail?.transactionId ?? ''}`} onClose={() => setShowRefund(false)}>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={refund.chargeback} onChange={(e) => setRefund({ ...refund, chargeback: e.target.checked })} className="accent-gold" />
            File as chargeback (dispute)
          </label>
          <Field label="Refund amount">
            <input type="number" className={inputCls} value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
          </Field>
          <Field label="Reason">
            <input className={inputCls} value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} placeholder="e.g. Customer cancelled order" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowRefund(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submitRefund} disabled={working}>{working ? 'Submitting…' : refund.chargeback ? 'File Chargeback' : 'Request Refund'}</PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentTransactions;