import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, AlertTriangle, RefreshCw, CheckCircle2, Clock, XCircle, TrendingUp, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Pill } from '../components/finance/FinanceUI';
import { Download } from 'lucide-react';
import Loading from '../components/loading';
import { api, money, label, CHANNEL_LABELS } from '../utils/finance';

interface Overview {
  receivedToday: number;
  receivedThisWeek: number;
  receivedThisMonth: number;
  successfulCount: number;
  successfulAmount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  refundedAmount: number;
  chargebackAmount: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  awaitingSettlement: number;
  successRate: number;
  unprocessedWebhookEvents: number;
  channelTotals?: Record<string, { count: number; gross: number; fees: number; refunds: number; chargebacks: number; net: number; successful: number; failed: number; pending: number }>;
}

const Payment = ({ token }: { token: string }) => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; data: Overview }>('/api/payment', token);
      setData(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const exportCsv = async (type: 'transactions' | 'refunds' | 'channel' | 'reconciliation') => {
    try {
      const res = await fetch('/api/payment/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Export failed.');
      const text = await res.text();
      const name = `payments-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export downloaded.');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const channels = Object.entries(data?.channelTotals ?? {});

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payments"
        subtitle="Payment accounts, transactions and reconciliation"
        trailing={
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 text-sm text-ink-soft border border-gold/20 rounded-xl hover:text-espresso cursor-pointer" onClick={() => exportCsv('transactions')}><Download size={15} className="inline mr-1" /> Transactions</button>
            <button className="px-4 py-2 text-sm text-ink-soft border border-gold/20 rounded-xl hover:text-espresso cursor-pointer" onClick={() => exportCsv('refunds')}><Download size={15} className="inline mr-1" /> Refunds</button>
            <button className="px-4 py-2 text-sm text-ink-soft border border-gold/20 rounded-xl hover:text-espresso cursor-pointer" onClick={() => exportCsv('channel')}><Download size={15} className="inline mr-1" /> Channels</button>
            <button className="px-4 py-2 text-sm text-ink-soft border border-gold/20 rounded-xl hover:text-espresso cursor-pointer" onClick={() => exportCsv('reconciliation')}><Download size={15} className="inline mr-1" /> Reconciliation</button>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex items-center justify-center py-12"><Loading /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Received Today" value={money(data?.receivedToday)} icon={<ArrowDownLeft size={20} />} tint="from-gold-soft to-gold" />
            <StatCard label="Received This Week" value={money(data?.receivedThisWeek)} icon={<TrendingUp size={20} />} tint="from-sand to-gold-soft" />
            <StatCard label="Received This Month" value={money(data?.receivedThisMonth)} icon={<Layers size={20} />} tint="from-blush to-sand" />
            <StatCard label="Outstanding Receivables" value={money(data?.outstandingReceivables)} icon={<ArrowUpRight size={20} />} tint="from-blush to-espresso" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Successful Payments" value={money(data?.successfulAmount)} sub={`${data?.successfulCount} transactions`} icon={<CheckCircle2 size={20} />} tint="from-sand to-gold" />
            <StatCard label="Pending" value={money(data?.pendingAmount)} sub={`${data?.pendingCount} transactions`} icon={<Clock size={20} />} tint="from-blush to-sand" />
            <StatCard label="Failed" value={money(data?.failedAmount)} sub={`${data?.failedCount} transactions`} icon={<XCircle size={20} />} tint="from-espresso/60 to-espresso" />
            <StatCard label="Refunds / Chargebacks" value={money((data?.refundedAmount ?? 0) + (data?.chargebackAmount ?? 0))} sub={`Refunds ${money(data?.refundedAmount)} · Chargebacks ${money(data?.chargebackAmount)}`} icon={<RefreshCw size={20} />} tint="from-gold to-espresso" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Success Rate" value={`${data?.successRate ?? 0}%`} icon={<TrendingUp size={20} />} tint="from-blush to-gold-soft" />
            <StatCard label="Awaiting Settlement" value={money(data?.awaitingSettlement)} icon={<Wallet size={20} />} tint="from-sand to-espresso" />
            <StatCard label="Outstanding Payables" value={money(data?.outstandingPayables)} icon={<ArrowUpRight size={20} />} tint="from-gold-soft to-sand" />
            <StatCard label="Unprocessed Webhook Events" value={data?.unprocessedWebhookEvents ?? 0} icon={<AlertTriangle size={20} />} tint="from-espresso to-deep" />
          </div>

          <SectionCard title="Channel Breakdown" subtitle="Gross, fees and net amounts by payment channel">
            {channels.length === 0 ? (
              <p className="text-center text-ink-soft/60 py-10">No transactions recorded yet.</p>
            ) : (
              <TableShell
                head={
                  <>
                    <Th>Channel</Th>
                    <Th right>Transactions</Th>
                    <Th right>Successful</Th>
                    <Th right>Failed</Th>
                    <Th right>Gross</Th>
                    <Th right>Fees</Th>
                    <Th right>Refunds</Th>
                    <Th right>Chargebacks</Th>
                    <Th right>Net</Th>
                  </>
                }
              >
                {channels.map(([ch, c]) => (
                  <Row key={ch}>
                    <Td className="font-medium text-ink">{label(CHANNEL_LABELS, ch, ch)}</Td>
                    <Td right>{c.count}</Td>
                    <Td right>
                      <Pill tone="green">{c.successful}</Pill>
                    </Td>
                    <Td right>
                      <Pill tone="red">{c.failed}</Pill>
                    </Td>
                    <Td right>{money(c.gross)}</Td>
                    <Td right>{money(c.fees)}</Td>
                    <Td right>{money(c.refunds)}</Td>
                    <Td right>{money(c.chargebacks)}</Td>
                    <Td right className="font-semibold text-espresso">{money(c.net)}</Td>
                  </Row>
                ))}
              </TableShell>
            )}
          </SectionCard>

          <div className="flex flex-wrap items-center gap-3 px-1 text-sm text-ink-soft">
            <Pill tone={data?.unprocessedWebhookEvents ? 'amber' : 'green'}>
              {data?.unprocessedWebhookEvents
                ? `${data.unprocessedWebhookEvents} unprocessed webhook event(s) in the queue`
                : 'Webhook queue healthy'}
            </Pill>
          </div>
        </>
      )}
    </div>
  );
};

export default Payment;