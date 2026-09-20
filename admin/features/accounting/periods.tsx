import { useCallback, useEffect, useState } from 'react';
import { Plus, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { formatDate, PERIOD_STATUS_LABELS, formatDateTime } from '../../utils';
import { Loading } from '../../components';

interface Period { id: number; _id: string; name: string; startDate: number; endDate: number; status: string; closedAt?: number | null; closedBy?: number | null }

const AccountingPeriods = ({ token }: { token: string }) => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [current, setCurrent] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: String(Date.now() - 30 * 86400000), endDate: String(Date.now()) });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; periods: Period[]; current: Period | null }>('/api/accounts/periods', token);
      setPeriods(res.periods);
      setCurrent(res.current);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error('Name, start and end dates are required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/accounts/periods', token, { method: 'POST', body: { name: form.name.trim(), startDate: Number(form.startDate), endDate: Number(form.endDate) } });
      toast.success('Period created.');
      setShowForm(false);
      setForm({ name: '', startDate: String(Date.now() - 30 * 86400000), endDate: String(Date.now()) });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const close = async (p: Period) => {
    try {
      await api('/api/accounts/periods/close', token, { method: 'POST', body: { id: p.id } });
      toast.success('Period closed.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const reopen = async (p: Period) => {
    try {
      await api('/api/accounts/periods/reopen', token, { method: 'POST', body: { id: p.id } });
      toast.success('Period reopened.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const statusTone = (s: string) => s === 'open' ? 'green' : s === 'closed' ? 'gray' : 'amber';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Accounting Periods"
        subtitle="Open and close reporting periods"
        trailing={<button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowForm(true)}><Plus size={16} /> New Period</button>}
      />

      {current && (
        <div className="rounded-xl border border-gold/25 bg-sand/50 p-4 text-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Current Period: {current.name}</p>
            <p className="text-ink-soft">{formatDate(current.startDate)} — {formatDate(current.endDate)}</p>
          </div>
          <Pill tone="green">Open</Pill>
        </div>
      )}

      <SectionCard title="Periods">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : periods.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No accounting periods defined.</p>
        ) : (
          <TableShell head={<><Th>Name</Th><Th>From</Th><Th>To</Th><Th>Status</Th><Th>Closed At</Th><Th right>Action</Th></>}>
            {periods.map((p) => (
              <Row key={p._id}>
                <Td className="font-medium text-ink">{p.name}</Td>
                <Td>{formatDate(p.startDate)}</Td>
                <Td>{formatDate(p.endDate)}</Td>
                <Td><Pill tone={statusTone(p.status)}>{PERIOD_STATUS_LABELS[p.status] ?? p.status}</Pill></Td>
                <Td className="text-ink-soft">{p.closedAt ? formatDateTime(p.closedAt) : '—'}</Td>
                <Td right>
                  <div className="inline-flex gap-2">
                    {(p.status === 'open' || p.status === 'locked') && (
                      <button onClick={() => close(p)} className="btn-gold px-4 py-1.5 text-sm cursor-pointer"><Lock size={14} /> Close</button>
                    )}
                    {p.status === 'closed' && (
                      <button onClick={() => reopen(p)} className="px-4 py-1.5 text-sm text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer"><Unlock size={14} /> Reopen</button>
                    )}
                  </div>
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showForm} title="Create Accounting Period" onClose={() => setShowForm(false)}>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. FY 2026 Q3" /></Field>
          <Field label="Start date (ms)"><input type="number" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End date (ms)"><input type="number" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowForm(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={create} disabled={saving}>{saving ? 'Saving…' : 'Create Period'}</PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
};

export default AccountingPeriods;