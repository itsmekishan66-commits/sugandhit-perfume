import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, Tabs, inputCls } from '../components/finance/FinanceUI';
import { api, money, num, formatDate, DEBT_STATUS_LABELS } from '../utils/finance';
import Loading from '../components/loading';

interface Vendor {
  _id: string;
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  notes?: string;
  active: boolean;
  createdAt: number | string;
}

interface Payable {
  _id: string;
  id: number;
  vendorId: number;
  vendor: { id: number; name: string; email?: string; phone?: string } | null;
  billRef?: string;
  category?: string;
  billDate: number;
  dueDate: number;
  originalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  approvalStatus: string;
  daysOverdue: number;
  notes?: string;
  payments: { id: number; amount: number; paidAt: number }[];
}

const PAGE_SIZE = 25;

const PaymentPayables = ({ token }: { token: string }) => {
  const [tab, setTab] = useState('bills');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [aging, setAging] = useState<{ current: number; d30: number; d60: number; d90: number; d90plus: number } | null>(null);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [payableTotal, setPayableTotal] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [showVendor, setShowVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', email: '', phone: '', address: '', category: '', notes: '' });
  const [showBill, setShowBill] = useState(false);
  const [billForm, setBillForm] = useState({ vendorId: '', billRef: '', category: '', billDate: '', dueDate: '', originalAmount: '', notes: '' });
  const [payBill, setPayBill] = useState<Payable | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [payAccounts, setPayAccounts] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bq = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) bq.set('status', status);
      const [billsRes, vendorRes, payAccs, agingRes] = await Promise.all([
        api<{ success: boolean; items: Payable[]; total: number; totalOutstanding: number; totalPages?: number }>(`/api/accounts/payables?${bq}`, token),
        api<{ success: boolean; items: Vendor[]; total: number }>(`/api/accounts/vendors?limit=500`, token),
        api<{ success: boolean; accounts: { id: number; name: string; active?: boolean }[] }>('/api/payment/accounts', token),
        api<{ success: boolean; data: { current: number; d30: number; d60: number; d90: number; d90plus: number } }>('/api/accounts/payables/aging', token),
      ]);
      setPayables(billsRes.items);
      setPayableTotal(billsRes.total);
      setTotalOutstanding(billsRes.totalOutstanding);
      setTotalPages(billsRes.totalPages || 1);
      setVendors(vendorRes.items);
      setVendorTotal(vendorRes.total);
      setPayAccounts(payAccs.accounts.filter((a) => a.active !== false));
      setAging(agingRes.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, status]);

  useEffect(() => {
    load();
  }, [load]);

  const createVendor = async () => {
    if (!vendorForm.name.trim()) {
      toast.error('Vendor name is required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/accounts/vendors', token, { method: 'POST', body: vendorForm });
      toast.success('Vendor created.');
      setShowVendor(false);
      setVendorForm({ name: '', email: '', phone: '', address: '', category: '', notes: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const createBill = async () => {
    if (!billForm.vendorId || num(billForm.originalAmount) <= 0 || !billForm.billDate || !billForm.dueDate) {
      toast.error('Vendor, amount, bill date and due date are required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/accounts/payables', token, {
        method: 'POST',
        body: { vendorId: Number(billForm.vendorId), billRef: billForm.billRef, category: billForm.category, billDate: Number(billForm.billDate), dueDate: Number(billForm.dueDate), originalAmount: Number(billForm.originalAmount), notes: billForm.notes },
      });
      toast.success('Bill created.');
      setShowBill(false);
      setBillForm({ vendorId: '', billRef: '', category: '', billDate: '', dueDate: '', originalAmount: '', notes: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const approve = async (p: Payable, approved: boolean) => {
    try {
      await api('/api/accounts/payables/approve', token, { method: 'POST', body: { id: p.id, approved } });
      toast.success(approved ? 'Bill approved.' : 'Bill rejected.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const submitPay = async () => {
    if (!payBill || num(payAmount) <= 0 || !payAccountId) {
      toast.error('Please select a payment account and enter a positive amount.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/accounts/payables/pay', token, { method: 'POST', body: { payableId: payBill.id, paymentAccountId: Number(payAccountId), amount: Number(payAmount) } });
      toast.success('Bill payment recorded.');
      setPayBill(null);
      setPayAmount('');
      setPayAccountId('');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payables"
        subtitle="Vendor bills and amounts owed"
        trailing={
          <div className="flex gap-2">
            <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowVendor(true)}><Plus size={16} /> Vendor</button>
            <button className="btn-primary bg-espresso px-5 py-2 text-sm cursor-pointer" onClick={() => setShowBill(true)}><Plus size={16} /> Record Bill</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Outstanding" value={money(totalOutstanding)} tint="from-gold-soft to-gold" />
        <StatCard label="Bills" value={payableTotal} tint="from-blush to-sand" />
        <StatCard label="Vendors" value={vendorTotal} tint="from-sand to-espresso" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Current" value={money(aging?.current)} tint="from-gold-soft to-gold" />
        <StatCard label="1–30 days" value={money(aging?.d30)} tint="from-blush to-sand" />
        <StatCard label="31–60 days" value={money(aging?.d60)} tint="from-sand to-espresso" />
        <StatCard label="61–90 days" value={money(aging?.d90)} tint="from-blush to-sand" />
        <StatCard label="90+ days" value={money(aging?.d90plus)} tint="from-gold-soft to-gold" />
      </div>

      <SectionCard>
        <Tabs tabs={[{ key: 'bills', label: 'Bills' }, { key: 'vendors', label: 'Vendors' }]} active={tab} onChange={setTab} />
        <div className="px-6 py-3 border-b border-gold/10 flex items-center justify-between gap-3">
          <select className={`${inputCls} w-44 select-soft`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <span className="text-xs text-ink-soft">{payableTotal} bills · {money(totalOutstanding)} outstanding</span>
        </div>
        {tab === 'bills' ? (
          loading ? (
            <div className="flex items-center justify-center py-12"><Loading /></div>
          ) : payables.length === 0 ? (
            <p className="text-center text-ink-soft/60 py-10">No bills yet. Record your first vendor bill.</p>
          ) : (
            <>
              <TableShell
                head={
                  <>
                    <Th>Bill</Th>
                    <Th>Vendor</Th>
                    <Th>Bill Date</Th>
                    <Th>Due</Th>
                    <Th right>Amount</Th>
                    <Th right>Paid</Th>
                    <Th right>Outstanding</Th>
                    <Th>Approval</Th>
                    <Th>Status</Th>
                    <Th right>Action</Th>
                  </>
                }
              >
                {payables.map((p) => (
                  <Row key={p._id}>
                    <Td>
                      <p className="font-medium text-ink">{p.billRef || `#${p.id}`}</p>
                      {p.category && <p className="text-xs text-ink-soft">{p.category}</p>}
                    </Td>
                    <Td>{p.vendor?.name || `Vendor #${p.vendorId}`}</Td>
                    <Td>{formatDate(p.billDate)}</Td>
                    <Td className="text-ink-soft">{formatDate(p.dueDate)}</Td>
                    <Td right className="tabular-nums">{money(p.originalAmount)}</Td>
                    <Td right className="tabular-nums">{money(p.paidAmount)}</Td>
                    <Td right className={`font-semibold tabular-nums ${num(p.outstandingAmount) > 0 ? 'text-espresso' : 'text-ink-soft'}`}>{money(p.outstandingAmount)}</Td>
                    <Td>
                      <Pill tone={p.approvalStatus === 'approved' ? 'green' : p.approvalStatus === 'pending' ? 'amber' : 'red'}>{p.approvalStatus}</Pill>
                    </Td>
                    <Td>
                      <Pill tone={p.status === 'paid' ? 'green' : p.status === 'overdue' ? 'red' : p.status === 'partially_paid' ? 'amber' : 'gold'}>{DEBT_STATUS_LABELS[p.status] ?? p.status}</Pill>
                    </Td>
                    <Td right>
                      <div className="inline-flex flex-col gap-1.5 items-end">
                        {p.approvalStatus === 'pending' && (
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => approve(p, true)} className="btn-gold px-3 py-1 text-xs cursor-pointer">Approve</button>
                            <button onClick={() => approve(p, false)} className="px-3 py-1 text-xs text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">Reject</button>
                          </div>
                        )}
                        {num(p.outstandingAmount) > 0 && (
                          <button onClick={() => { setPayBill(p); setPayAmount(String(p.outstandingAmount)); setPayAccountId(''); }} className="btn-primary bg-espresso px-4 py-1 text-xs cursor-pointer">Pay {money(p.outstandingAmount)}</button>
                        )}
                      </div>
                    </Td>
                  </Row>
                ))}
              </TableShell>
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gold/15 text-sm">
                  <GhostBtn onClick={() => setPage((x) => Math.max(1, x - 1))} className={page <= 1 ? 'opacity-40 pointer-events-none' : ''}>Prev</GhostBtn>
                  <span className="text-ink-soft">Page {page} of {totalPages}</span>
                  <GhostBtn onClick={() => setPage((x) => Math.min(totalPages, x + 1))} className={page >= totalPages ? 'opacity-40 pointer-events-none' : ''}>Next</GhostBtn>
                </div>
              )}
            </>
          )
        ) : (
          vendors.length === 0 ? (
            <p className="text-center text-ink-soft/60 py-10">No vendors yet.</p>
          ) : (
            <TableShell head={<><Th>Vendor</Th><Th>Contact</Th><Th>Category</Th><Th>Status</Th></>}>
              {vendors.map((v) => (
                <Row key={v._id}>
                  <Td>
                    <p className="font-medium text-ink">{v.name}</p>
                    {v.address && <p className="text-xs text-ink-soft">{v.address}</p>}
                  </Td>
                  <Td>
                    <p className="text-ink-soft">{v.email || '—'}</p>
                    <p className="text-xs text-ink-soft">{v.phone || ''}</p>
                  </Td>
                  <Td>{v.category || '—'}</Td>
                  <Td><Pill tone={v.active ? 'green' : 'red'}>{v.active ? 'Active' : 'Inactive'}</Pill></Td>
                </Row>
              ))}
            </TableShell>
          )
        )}
      </SectionCard>

      <Modal open={showVendor} title="Add Vendor" onClose={() => setShowVendor(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vendor name">
            <input className={inputCls} value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} />
          </Field>
          <Field label="Category">
            <input className={inputCls} value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} placeholder="e.g. Ingredients / Packaging" />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={vendorForm.phone} onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <input className={inputCls} value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={vendorForm.notes} onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowVendor(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={createVendor} disabled={saving}>{saving ? 'Saving…' : 'Create Vendor'}</PrimaryBtn>
        </div>
      </Modal>

      <Modal open={showBill} title="Record Vendor Bill" onClose={() => setShowBill(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vendor">
            <select className={inputCls} value={billForm.vendorId} onChange={(e) => setBillForm({ ...billForm, vendorId: e.target.value })}>
              <option value="">Select vendor…</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Bill reference">
            <input className={inputCls} value={billForm.billRef} onChange={(e) => setBillForm({ ...billForm, billRef: e.target.value })} placeholder="e.g. INV-2026-014" />
          </Field>
          <Field label="Category">
            <input className={inputCls} value={billForm.category} onChange={(e) => setBillForm({ ...billForm, category: e.target.value })} />
          </Field>
          <Field label="Amount">
            <input type="number" className={inputCls} value={billForm.originalAmount} onChange={(e) => setBillForm({ ...billForm, originalAmount: e.target.value })} />
          </Field>
          <Field label="Bill date (ms)">
            <input type="number" className={inputCls} value={billForm.billDate} onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })} placeholder={String(Date.now())} />
          </Field>
          <Field label="Due date (ms)">
            <input type="number" className={inputCls} value={billForm.dueDate} onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })} placeholder={String(Date.now() + 30 * 86400000)} />
          </Field>
          <Field label="Notes" hint="Dates are provided as epoch milliseconds.">
            <input className={inputCls} value={billForm.notes} onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowBill(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={createBill} disabled={saving}>{saving ? 'Saving…' : 'Create Bill'}</PrimaryBtn>
        </div>
      </Modal>

      <Modal open={!!payBill} title={`Pay Bill ${payBill?.billRef ?? ''}`} onClose={() => setPayBill(null)}>
        {payBill && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-gold/15 bg-white/70 p-3 text-sm">
              <p className="font-medium text-ink">{payBill.vendor?.name} — outstanding <span className="font-semibold text-espresso">{money(payBill.outstandingAmount)}</span></p>
            </div>
            <Field label="Payment account">
              <select className={inputCls} value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}>
                <option value="">Select…</option>
                {payAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Payment amount">
              <input type="number" className={inputCls} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </Field>
            <p className="text-xs text-ink-soft">Select the bank/cash account this payment flows out from.</p>
            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setPayBill(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={submitPay} disabled={saving}>{saving ? 'Recording…' : 'Record Payment'}</PrimaryBtn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPayables;