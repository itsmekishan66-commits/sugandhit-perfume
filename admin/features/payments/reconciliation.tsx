import { useCallback, useEffect, useState } from 'react';
import { Plus, Eye, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { money, formatDate, RECON_ITEM_STATUS_LABELS } from '../../utils';
import { Loading } from '../../components';

interface PaymentAccountBrief { id: number; name: string; accountType: string; active: boolean }

interface ReconItem {
  _id: string;
  id: number;
  externalRef: string;
  externalAmount: number;
  discrepancy: number;
  status: string;
  matched: boolean;
  transactionId?: number | null;
}

interface Reconciliation {
  _id: string;
  id: number;
  paymentAccountId: number;
  accountName?: string;
  periodStart: number;
  periodEnd: number;
  openingExternalBalance: number;
  closingExternalBalance: number;
  status: string;
  notes?: string;
  items: ReconItem[];
  summary: { total: number; matched: number; missingInternal: number; missingExternal: number; mismatched: number; duplicates: number; discrepancy: number };
}

interface Dashboard { unreconciledAmount: number; [k: string]: unknown }

const PaymentReconciliation = ({ token }: { token: string }) => {
  const [list, setList] = useState<Reconciliation[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccountBrief[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ paymentAccountId: '', periodStart: '', periodEnd: '', openingExternalBalance: '', closingExternalBalance: '', notes: '' });
  const [detail, setDetail] = useState<Reconciliation | null>(null);
  const [candidates, setCandidates] = useState<{ id: number; transactionId: string; amount: number; initiatedAt: number | string; status: string }[]>([]);
  const [working, setWorking] = useState(false);
  const [itemForm, setItemForm] = useState({ externalRef: '', externalAmount: '' });
  const [matchSel, setMatchSel] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, dashRes, accRes] = await Promise.all([
        api<{ success: boolean; data: Reconciliation[] }>('/api/payment/reconciliations', token),
        api<{ success: boolean; data: Dashboard }>('/api/payment/reconciliations/summary', token),
        api<{ success: boolean; accounts: PaymentAccountBrief[] }>('/api/payment/accounts', token),
      ]);
      setList(listRes.data);
      setDashboard(dashRes.data);
      setAccounts(accRes.accounts.filter((a) => a.active));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!createForm.paymentAccountId || !createForm.periodStart || !createForm.periodEnd) {
      toast.error('Account, period start and period end are required.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/payment/reconciliations', token, {
        method: 'POST',
        body: {
          paymentAccountId: Number(createForm.paymentAccountId),
          periodStart: Number(createForm.periodStart),
          periodEnd: Number(createForm.periodEnd),
          openingExternalBalance: Number(createForm.openingExternalBalance || 0),
          closingExternalBalance: Number(createForm.closingExternalBalance || 0),
          notes: createForm.notes,
        },
      });
      toast.success('Reconciliation created.');
      setShowCreate(false);
      setCreateForm({ paymentAccountId: '', periodStart: '', periodEnd: '', openingExternalBalance: '', closingExternalBalance: '', notes: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const openDetail = async (r: Reconciliation) => {
    setDetail(null);
    setCandidates([]);
    try {
      const [recRes, txnRes] = await Promise.all([
        api<{ success: boolean; data: Reconciliation }>(`/api/payment/reconciliations/${r.id}`, token),
        api<{ success: boolean; items: { id: number; transactionId: string; amount: number; initiatedAt: number | string; status: string }[] }>(
          `/api/payment/transactions?accountId=${r.paymentAccountId}&reconciliationStatus=unreconciled&page=1&limit=200`,
          token
        ),
      ]);
      setDetail(recRes.data);
      setCandidates(txnRes.items);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const reloadDetail = async () => {
    if (!detail) return;
    try {
      const [recRes, txnRes] = await Promise.all([
        api<{ success: boolean; data: Reconciliation }>(`/api/payment/reconciliations/${detail.id}`, token),
        api<{ success: boolean; items: { id: number; transactionId: string; amount: number; initiatedAt: number | string; status: string }[] }>(
          `/api/payment/transactions?accountId=${detail.paymentAccountId}&reconciliationStatus=unreconciled&page=1&limit=200`,
          token
        ),
      ]);
      setDetail(recRes.data);
      setCandidates(txnRes.items);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const addItem = async () => {
    if (!detail) return;
    if (!itemForm.externalRef.trim()) {
      toast.error('External reference is required.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/payment/reconciliations/items', token, {
        method: 'POST',
        body: { reconciliationId: detail.id, externalRef: itemForm.externalRef.trim(), externalAmount: Number(itemForm.externalAmount || 0) },
      });
      toast.success('Statement line added.');
      setItemForm({ externalRef: '', externalAmount: '' });
      await reloadDetail();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const matchItem = async (item: ReconItem) => {
    const txnId = matchSel[item.id];
    if (!detail || !txnId) {
      toast.error('Select a transaction to match.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/payment/reconciliations/match', token, {
        method: 'POST',
        body: { itemId: item.id, transactionId: Number(txnId) },
      });
      toast.success('Item matched.');
      setMatchSel((p) => { const n = { ...p }; delete n[item.id]; return n; });
      await reloadDetail();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const lock = async (r: Reconciliation) => {
    setWorking(true);
    try {
      await api('/api/payment/reconciliations/lock', token, { method: 'POST', body: { id: r.id } });
      toast.success('Reconciliation period locked.');
      setDetail(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const itemTone = (s: string) => (s === 'matched' ? 'green' : s === 'amount_mismatch' ? 'amber' : s === 'duplicate' ? 'blue' : 'red');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reconciliation"
        subtitle="Match internal transactions with external statements"
        trailing={
          <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Start Reconciliation
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Unreconciled Amount" value={money(dashboard?.unreconciledAmount)} tint="from-gold-soft to-gold" />
        <StatCard label="Reconciliations" value={list.length} tint="from-blush to-sand" />
        <StatCard label="Active (in progress)" value={list.filter((r) => r.status === 'in_progress').length} tint="from-sand to-espresso" />
      </div>

      <SectionCard title="Reconciliation Periods">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : list.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No reconciliations yet.</p>
        ) : (
          <TableShell head={<><Th>Period</Th><Th>Account</Th><Th right>Matched</Th><Th right>Total</Th><Th right>Discrepancy</Th><Th>Status</Th><Th right>Action</Th></>}>
            {list.map((r) => (
              <Row key={r._id}>
                <Td>
                  <p className="font-medium text-ink">{formatDate(r.periodStart)} — {formatDate(r.periodEnd)}</p>
                  <p className="text-xs text-ink-soft">{r.notes || ''}</p>
                </Td>
                <Td>{r.accountName || `Account #${r.paymentAccountId}`}</Td>
                <Td right>{r.summary?.matched ?? 0} / {r.summary?.total ?? 0}</Td>
                <Td right>{r.summary?.total ?? 0}</Td>
                <Td right className={r.summary?.discrepancy ? 'text-espresso font-semibold' : ''}>{money(r.summary?.discrepancy ?? 0)}</Td>
                <Td><Pill tone={r.status === 'in_progress' ? 'amber' : 'green'}>{r.status}</Pill></Td>
                <Td right>
                  <button onClick={() => openDetail(r)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer" title="Open">
                    <Eye size={16} />
                  </button>
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showCreate} title="Start Reconciliation" onClose={() => setShowCreate(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Payment account">
            <select className={inputCls} value={createForm.paymentAccountId} onChange={(e) => setCreateForm({ ...createForm, paymentAccountId: e.target.value })}>
              <option value="">Select account…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Period start (ms)">
            <input type="number" className={inputCls} value={createForm.periodStart} onChange={(e) => setCreateForm({ ...createForm, periodStart: e.target.value })} placeholder={String(Date.now() - 30 * 86400000)} />
          </Field>
          <Field label="Period end (ms)">
            <input type="number" className={inputCls} value={createForm.periodEnd} onChange={(e) => setCreateForm({ ...createForm, periodEnd: e.target.value })} placeholder={String(Date.now())} />
          </Field>
          <Field label="Opening external balance">
            <input type="number" className={inputCls} value={createForm.openingExternalBalance} onChange={(e) => setCreateForm({ ...createForm, openingExternalBalance: e.target.value })} />
          </Field>
          <Field label="Closing external balance">
            <input type="number" className={inputCls} value={createForm.closingExternalBalance} onChange={(e) => setCreateForm({ ...createForm, closingExternalBalance: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowCreate(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={create} disabled={working}>{working ? 'Creating…' : 'Create'}</PrimaryBtn>
        </div>
      </Modal>

      <Modal open={!!detail} title={`Reconciliation #${detail?._id ?? ''}`} onClose={() => setDetail(null)} wide>
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Matched</p><p className="font-semibold text-espresso">{detail.summary.matched} / {detail.summary.total}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Missing internal</p><p className="font-medium text-ink">{detail.summary.missingInternal}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Missing external</p><p className="font-medium text-ink">{detail.summary.missingExternal}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Discrepancy</p><p className={`font-semibold ${detail.summary.discrepancy ? 'text-espresso' : 'text-ink'}`}>{money(detail.summary.discrepancy)}</p></div>
            </div>

            <TableShell head={<><Th>External Ref</Th><Th>Status</Th><Th right>External Amount</Th><Th right>Discrepancy</Th><Th>Matched Txn</Th></>}>
              {detail.items.map((i) => (
                <Row key={i._id}>
                  <Td className="font-medium text-ink">{i.externalRef || '—'}</Td>
                  <Td><Pill tone={itemTone(i.status)}>{RECON_ITEM_STATUS_LABELS[i.status] ?? i.status}</Pill></Td>
                  <Td right className="tabular-nums">{money(i.externalAmount)}</Td>
                  <Td right className={`tabular-nums ${i.discrepancy ? 'text-espresso font-semibold' : 'text-ink-soft'}`}>{money(i.discrepancy)}</Td>
                  <Td>
                    {i.transactionId ? (
                      <span className="text-ink font-medium">#{i.transactionId}</span>
                    ) : detail.status === 'in_progress' ? (
                      <div className="inline-flex items-center gap-2">
                        <select className={inputCls} value={matchSel[i.id] ?? ''} onChange={(e) => setMatchSel((p) => ({ ...p, [i.id]: e.target.value }))}>
                          <option value="">Select txn…</option>
                          {candidates.filter((t) => !detail.items.some((x) => x.transactionId === t.id)).map((t) => (
                            <option key={t.id} value={t.id}>#{t.id} — {money(t.amount)}</option>
                          ))}
                        </select>
                        <button onClick={() => matchItem(i)} disabled={working || !matchSel[i.id]} className="btn-gold px-3 py-1 text-xs cursor-pointer disabled:opacity-40">Match</button>
                      </div>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </Td>
                </Row>
              ))}
            </TableShell>

            {detail.status === 'in_progress' && (
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3">
                <p className="text-sm font-medium text-ink mb-2">Add missing statement line</p>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-ink-soft">External ref</span>
                    <input className={inputCls} placeholder="e.g. TXN-8871" value={itemForm.externalRef} onChange={(e) => setItemForm({ ...itemForm, externalRef: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-ink-soft">Amount</span>
                    <input type="number" className={inputCls} placeholder="0.00" value={itemForm.externalAmount} onChange={(e) => setItemForm({ ...itemForm, externalAmount: e.target.value })} />
                  </div>
                  <button onClick={addItem} disabled={working} className="btn-gold px-4 py-2 text-sm cursor-pointer disabled:opacity-40">Add line</button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-sm text-ink-soft">
              {detail.status === 'in_progress'
                ? 'Open period. Items are auto-matched by provider reference on creation. Lock the period once the statement balances.'
                : 'Period locked.'}
            </div>

            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setDetail(null)}>Close</GhostBtn>
              {detail.status === 'in_progress' && (
                <PrimaryBtn onClick={() => lock(detail)} disabled={working}><Lock size={16} /> Lock Period</PrimaryBtn>
              )}
            </div>
            <p className="text-xs text-ink-soft">Candidates loaded: {candidates.length} unreconciled internal transaction(s). Use the Match select to pair a statement line with an internal transaction, or add any missing statement lines above.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentReconciliation;