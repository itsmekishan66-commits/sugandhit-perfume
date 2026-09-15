import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, Pill } from '../components/finance/FinanceUI';
import { api } from '../utils/finance';
import { currency } from '../config';

interface LinkStatus { configured: boolean; accountCount: number; note: string }

const PaymentSettings = ({ token }: { token: string }) => {
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; data: LinkStatus }>('/api/payment/status', token);
      setStatus(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payment Settings" subtitle="Gateway configuration and webhooks" />

      {loading && !status ? (
        <p className="text-center text-ink-soft/60 py-10">Loading settings…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Payment Accounts" value={status?.accountCount ?? 0} tint="from-gold-soft to-gold" />
            <StatCard label="Gateway Linked" value={status?.configured ? 'Yes' : 'No'} tint={status?.configured ? 'from-blush to-sand' : 'from-espresso/60 to-espresso'} />
            <StatCard label="Currency" value={currency} tint="from-sand to-espresso" />
          </div>

          <SectionCard title="Webhook Configuration" subtitle="Incoming provider event endpoint">
            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-sm text-ink-soft">
                <p className="font-medium text-ink mb-2">Incoming Webhook URL</p>
                <code className="bg-white/70 border border-gold/20 rounded-xl px-4 py-2 block break-all text-ink">POST {`${window.location.protocol}//${window.location.hostname}:4000/api/payment/webhook`}</code>
                <p className="mt-2">Point your payment provider's webhook configuration to this URL. The server identifies events by the <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">eventId</code> field to ensure idempotent processing.</p>
              </div>

              <div className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-sm">
                <p className="font-medium text-ink mb-2">Required payload fields</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-ink-soft">
                  {['provider', 'eventId', 'eventType', 'transactionId (optional)', 'payload'].map((f) => (
                    <div key={f} className="rounded-xl border border-gold/20 bg-white/70 p-3 text-center">{f}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-sm">
                <p className="font-medium text-ink mb-1">How it works</p>
                <ul className="list-disc list-inside text-ink-soft space-y-1">
                  <li>POST with the raw provider event.</li>
                  <li>If <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">eventId</code> has already been processed, the response is marked <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">idempotent</code> with no duplicate effects.</li>
                  <li>Supported types: <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">payment.success</code>, <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">payment.failed</code>, <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">refund.created</code>, <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">refund.completed</code>.</li>
                  <li>Requires an existing internal transaction with the matching <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">transactionId</code> (the server finds it by the <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">transactionId</code> string field).</li>
                </ul>
              </div>

              <div className="rounded-xl border border-gold/15 bg-cream/60 p-4 text-sm text-ink-soft">
                <p className="font-medium text-ink mb-1">Provider mapping</p>
                <p>The <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">provider</code> field identifies the gateway (esewa, khalti, stripe, etc). The <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">eventType</code> string is normalized internally — e.g. <code className="bg-white/70 border border-gold/20 rounded px-2 py-0.5 text-xs">charge.refunded</code> maps to a refund event.</p>
              </div>

              <Pill tone="green">Endpoint is public (no admin auth required).</Pill>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default PaymentSettings;