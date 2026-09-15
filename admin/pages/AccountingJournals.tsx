import { useCallback, useEffect, useState } from 'react';
import { Plus, Eye, Minus } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../components/finance/FinanceUI';
import { api, money, formatDate, JOURNAL_STATUS_LABELS } from '../utils/finance';

interface ChartAcc { id: number; code: string; name: string; active: boolean }

interface JournalLine { accountId: number; debit: number; credit: number; description?: string }
interface Journal { id: number; _id: string; entryNumber: string; entryDate: number; description?: string; referenceType?: string; status: string; lines: JournalLine[] }

const PAGE_SIZE = 25;

const AccountingJournals = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Journal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartAccounts, setChartAccounts] = useState<ChartAcc[]>([]);
  const [detail, setDetail] = useState<Journal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(String(Date.now()));
  const [formDesc, setFormDesc] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([{ accountId: 0, debit: 0, credit: 0, description: '' }, { accountId: 0, debit: 0, credit: 0, description: '' }]);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) q.set('status', status);
      const [listRes, chartRes] = await Promise.all([
        api<{ success: boolean; items: Journal[]; total: number; totalPages?: number }>(`/api/accounts/journals?${q}`, token),
        api<{ success: boolean; accounts: ChartAcc[] }>('/api/accounts/chart', token),
      ]);
      setItems(listRes.items);
      setTotal(listRes.total);
      setTotalPages(listRes.totalPages || 1);
      setChartAccounts(chartRes.accounts.filter((a) => a.active));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, status]);

  useEffect(() => { load(); }, [load]);

  const addLine = () => setLines([...lines, { accountId: 0, debit: 0, credit: 0, description: '' }]);
  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };
  const updateLine = (idx: number, patch: Partial<JournalLine>) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

  const submit = async () => {
    if (!formDate || lines.length < 2) { toast.error('At least 2 lines required.'); return; }
    const invalid = lines.find((l) => !l.accountId || (l.debit <= 0 && l.credit <= 0));
    if (invalid) { toast.error('Each line must have a non-zero debit or credit and an account selected.'); return; }
    if (Math.abs(totalDebit - totalCredit) > 0.01) { toast.error(`Debits (${totalDebit}) must equal credits (${totalCredit}).`); return; }
    setWorking(true);
    try {
      await api('/api/accounts/journals', token, { method: 'POST', body: { entryDate: Number(formDate), description: formDesc, lines } });
      toast.success('Draft journal entry created.');
      setShowForm(false);
      setFormDate(String(Date.now()));
      setFormDesc('');
      setLines([{ accountId: 0, debit: 0, credit: 0, description: '' }, { accountId: 0, debit: 0, credit: 0, description: '' }]);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const openDetail = async (j: Journal) => {
    setDetail(null);
    try {
      const res = await api<{ success: boolean; journal: Journal }>(`/api/accounts/journals/${j.id}`, token);
      setDetail(res.journal);
    } catch (error) { toast.error((error as Error).message); }
  };

  const post = async (j: Journal) => {
    try {
      await api('/api/accounts/journals/post', token, { method: 'POST', body: { id: j.id } });
      toast.success('Journal entry posted.');
      load();
    } catch (error) { toast.error((error as Error).message); }
  };

  const reverse = async (j: Journal) => {
    try {
      await api('/api/accounts/journals/reverse', token, { method: 'POST', body: { id: j.id, reason: `Reversed via admin` } });
      toast.success('Journal entry reversed.');
      load();
    } catch (error) { toast.error((error as Error).message); }
  };

  const voidEntry = async (j: Journal) => {
    try {
      await api('/api/accounts/journals/void', token, { method: 'POST', body: { id: j.id } });
      toast.success('Journal entry voided.');
      load();
    } catch (error) { toast.error((error as Error).message); }
  };

  const statusTone = (s: string) => s === 'posted' ? 'green' : s === 'draft' ? 'amber' : s === 'reversed' ? 'blue' : 'red';
  const accountName = (id: number) => chartAccounts.find((a) => a.id === id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Journal Entries"
        subtitle={`${total} entries`}
        trailing={<button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => { setLines([{ accountId: 0, debit: 0, credit: 0, description: '' }, { accountId: 0, debit: 0, credit: 0, description: '' }]); setShowForm(true); }}><Plus size={16} /> New Entry</button>}
      />

      <SectionCard title="Journal Entries" action={
        <select className={`${inputCls} w-40 select-soft`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {Object.entries(JOURNAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      }>
        {loading ? (
          <p className="text-center text-ink-soft/60 py-10">Loading journals…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No journal entries found.</p>
        ) : (
          <>
            <TableShell head={<><Th>Entry</Th><Th>Date</Th><Th>Description</Th><Th>Status</Th><Th right>Action</Th></>}>
              {items.map((j) => (
                <Row key={j._id}>
                  <Td className="font-medium text-ink font-mono">{j.entryNumber || `#${j.id}`}</Td>
                  <Td>{formatDate(j.entryDate)}</Td>
                  <Td className="max-w-[20rem] text-ink-soft">{j.description || '—'}</Td>
                  <Td><Pill tone={statusTone(j.status)}>{JOURNAL_STATUS_LABELS[j.status] ?? j.status}</Pill></Td>
                  <Td right>
                    <div className="inline-flex gap-2">
                      <button onClick={() => openDetail(j)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer" title="View"><Eye size={16} /></button>
                      {j.status === 'draft' && (
                        <>
                          <button onClick={() => post(j)} className="btn-gold px-4 py-1.5 text-sm cursor-pointer">Post</button>
                          <button onClick={() => voidEntry(j)} className="px-4 py-1.5 text-sm text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">Void</button>
                        </>
                      )}
                      {j.status === 'posted' && (
                        <button onClick={() => reverse(j)} className="px-4 py-1.5 text-sm text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">Reverse</button>
                      )}
                    </div>
                  </Td>
                </Row>
              ))}
            </TableShell>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gold/15 text-sm">
                <GhostBtn onClick={() => setPage((p) => Math.max(1, p - 1))} className={page <= 1 ? 'opacity-40 pointer-events-none' : ''}>Prev</GhostBtn>
                <span className="text-ink-soft">Page {page} of {totalPages}</span>
                <GhostBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={page >= totalPages ? 'opacity-40 pointer-events-none' : ''}>Next</GhostBtn>
              </div>
            )}
          </>
        )}
      </SectionCard>

      <Modal open={!!detail} title={`Journal ${detail?.entryNumber ?? ''}`} onClose={() => setDetail(null)} wide>
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Date</p><p className="font-medium text-ink">{formatDate(detail.entryDate)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Status</p><Pill tone={statusTone(detail.status)}>{detail.status}</Pill></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3 col-span-2"><p className="text-xs text-ink-soft mb-1">Description</p><p className="font-medium text-ink">{detail.description || '—'}</p></div>
            </div>

            <TableShell head={<><Th>Account</Th><Th right>Debit</Th><Th right>Credit</Th><Th>Description</Th></>}>
              {detail.lines.map((l, i) => (
                <Row key={i}>
                  <Td>{accountName(l.accountId) ? `${accountName(l.accountId)!.code} — ${accountName(l.accountId)!.name}` : `Account #${l.accountId}`}</Td>
                  <Td right className="tabular-nums">{l.debit ? money(l.debit) : ''}</Td>
                  <Td right className="tabular-nums">{l.credit ? money(l.credit) : ''}</Td>
                  <Td className="text-ink-soft">{l.description || '—'}</Td>
                </Row>
              ))}
            </TableShell>
            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setDetail(null)}>Close</GhostBtn>
              {detail.status === 'draft' && (
                <>
                  <PrimaryBtn onClick={() => { post(detail); setDetail(null); }}>Post Entry</PrimaryBtn>
                  <GhostBtn onClick={() => { voidEntry(detail); setDetail(null); }}>Void</GhostBtn>
                </>
              )}
              {detail.status === 'posted' && (
                <PrimaryBtn onClick={() => { reverse(detail); setDetail(null); }}>Reverse</PrimaryBtn>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showForm} title="Create Journal Entry" onClose={() => setShowForm(false)} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <Field label="Entry date (ms)"><input type="number" className={inputCls} value={formDate} onChange={(e) => setFormDate(e.target.value)} /></Field>
          <Field label="Description"><input className={inputCls} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Entry purpose" /></Field>
        </div>

        <div className="rounded-xl border border-gold/15 bg-cream/60 p-4 mb-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <p className="font-medium text-ink">Journal Lines</p>
            <GhostBtn onClick={addLine}>Add line</GhostBtn>
          </div>
          <TableShell head={<><Th>Account</Th><Th right>Debit</Th><Th right>Credit</Th><Th>Description</Th><Th right></Th></>}>
            {lines.map((l, idx) => (
              <Row key={idx}>
                <Td>
                  <select className={`${inputCls} text-sm`} value={l.accountId} onChange={(e) => updateLine(idx, { accountId: Number(e.target.value) })}>
                    <option value={0}>Select…</option>
                    {chartAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                  </select>
                </Td>
                <Td right><input type="number" className={`${inputCls} w-32 text-sm text-right`} value={l.debit || ''} onChange={(e) => updateLine(idx, { debit: Number(e.target.value) })} placeholder="0" /></Td>
                <Td right><input type="number" className={`${inputCls} w-32 text-sm text-right`} value={l.credit || ''} onChange={(e) => updateLine(idx, { credit: Number(e.target.value) })} placeholder="0" /></Td>
                <Td><input className={`${inputCls} text-sm`} value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} placeholder="optional" /></Td>
                <Td right>
                  <button onClick={() => removeLine(idx)} disabled={lines.length <= 2} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer disabled:opacity-30"><Minus size={16} /></button>
                </Td>
              </Row>
            ))}
          </TableShell>
          <div className="mt-3 flex justify-end text-sm text-ink-soft gap-4">
            <span>Total Debit: <span className="font-semibold text-ink">{money(totalDebit)}</span></span>
            <span>Total Credit: <span className="font-semibold text-ink">{money(totalCredit)}</span></span>
            <span className={Math.abs(totalDebit - totalCredit) > 0.01 ? 'text-espresso font-semibold' : 'text-espresso/70'}>{Math.abs(totalDebit - totalCredit) > 0.01 ? `Difference: ${money(Math.abs(totalDebit - totalCredit))}` : 'Balanced ✓'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <GhostBtn onClick={() => setShowForm(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submit} disabled={working}>{working ? 'Saving…' : 'Create Entry'}</PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
};

export default AccountingJournals;