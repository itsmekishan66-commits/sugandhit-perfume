import { useCallback, useEffect, useState } from 'react';
import { Plus, Eye, X, Power } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { money, num, label, formatDate, PAYMENT_ACCOUNT_TYPE_LABELS, TXN_TYPE_LABELS } from '../../utils';
import { Loading } from '../../components';

interface PaymentAccount {
  _id: string;
  id: number;
  name: string;
  accountType: string;
  provider?: string;
  currency: string;
  openingBalance: number;
  calculatedBalance: number;
  currentBalance: number;
  availableBalance: number;
  pendingSettlement: number;
  transactionCount: number;
  accountNumber?: string;
  branch?: string;
  notes?: string;
  active: boolean;
  createdAt: number | string;
}

const emptyForm = { name: '', accountType: 'bank', provider: '', currency: 'NPR', openingBalance: '', accountNumber: '', branch: '', notes: '' };

const PaymentAccounts = ({ token }: { token: string }) => {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [ledger, setLedger] = useState<{ account: PaymentAccount; transactions: unknown[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; accounts: PaymentAccount[] }>('/api/payment/accounts', token);
      setAccounts(res.accounts);
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
    if (!form.name.trim()) {
      toast.error('Account name is required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/payment/accounts', token, {
        method: 'POST',
        body: { ...form, openingBalance: form.openingBalance === '' ? 0 : Number(form.openingBalance) },
      });
      toast.success('Payment account created.');
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (account: PaymentAccount) => {
    try {
      await api(`/api/payment/accounts/${account.id}/deactivate`, token, { method: 'POST' });
      toast.success('Account deactivated.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openLedger = async (account: PaymentAccount) => {
    setLedger(null);
    try {
      const res = await api<{ success: boolean; data: { account: PaymentAccount; transactions: unknown[] } }>(`/api/payment/accounts/${account.id}/ledger`, token);
      setLedger(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + num(a.currentBalance), 0);
  const totalPending = accounts.reduce((s, a) => s + num(a.pendingSettlement), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Accounts"
        subtitle="Cash, bank and digital wallet accounts"
        trailing={
          <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Account
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Balance" value={money(totalBalance)} sub={`${accounts.length} accounts`} tint="from-gold-soft to-gold" />
        <StatCard label="Pending Settlement" value={money(totalPending)} tint="from-blush to-sand" />
        <StatCard label="Active Accounts" value={accounts.filter((a) => a.active).length} sub={accounts.filter((a) => !a.active).length + ' inactive'} tint="from-sand to-espresso" />
      </div>

      <SectionCard title="Accounts">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : accounts.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No payment accounts yet. Add your first account to start recording payments.</p>
        ) : (
          <TableShell
            head={
              <>
                <Th>Account</Th>
                <Th>Type</Th>
                <Th right>Balance</Th>
                <Th right>Pending</Th>
                <Th right>Transactions</Th>
                <Th>Status</Th>
                <Th right>Actions</Th>
              </>
            }
          >
            {accounts.map((a) => (
              <Row key={a._id}>
                <Td>
                  <p className="font-medium text-ink">{a.name}</p>
                  <p className="text-xs text-ink-soft">{a.accountNumber || 'â€”'} {a.branch ? `Â· ${a.branch}` : ''}</p>
                </Td>
                <Td>
                  <Pill tone={a.accountType === 'cash' ? 'gold' : a.accountType === 'bank' ? 'green' : 'blue'}>{label(PAYMENT_ACCOUNT_TYPE_LABELS, a.accountType, a.accountType)}</Pill>
                </Td>
                <Td right className="font-semibold text-espresso tabular-nums">{money(a.currentBalance)}</Td>
                <Td right className="tabular-nums">{money(a.pendingSettlement)}</Td>
                <Td right>{a.transactionCount}</Td>
                <Td>
                  <Pill tone={a.active ? 'green' : 'red'}>{a.active ? 'Active' : 'Inactive'}</Pill>
                </Td>
                <Td right>
                  <div className="inline-flex gap-2">
                    <button onClick={() => openLedger(a)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso hover:border-gold cursor-pointer" title="Ledger">
                      <Eye size={16} />
                    </button>
                    {a.active && (
                      <button onClick={() => deactivate(a)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer" title="Deactivate">
                        <Power size={16} />
                      </button>
                    )}
                  </div>
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showForm} title="Add Payment Account" onClose={() => setShowForm(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Account name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nabil Bank - Main" />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
              {Object.entries(PAYMENT_ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Provider">
            <input className={inputCls} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. Nabil, eSewa, Khalti" />
          </Field>
          <Field label="Currency">
            <input className={inputCls} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </Field>
          <Field label="Opening balance">
            <input type="number" className={inputCls} value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Account number">
            <input className={inputCls} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          </Field>
          <Field label="Branch">
            <input className={inputCls} value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex gap-3 justify-end">
          <GhostBtn onClick={() => setShowForm(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={create} disabled={saving}>{saving ? 'Savingâ€¦' : 'Create Account'}</PrimaryBtn>
        </div>
      </Modal>

      <Modal open={!!ledger} title={ledger?.account ? `${ledger.account.name} â€” Ledger` : 'Ledger'} onClose={() => setLedger(null)} wide>
        {ledger && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <StatCard label="Current Balance" value={money(ledger.account.currentBalance)} tint="from-gold-soft to-gold" />
            <StatCard label="Available" value={money(ledger.account.availableBalance)} tint="from-blush to-sand" />
            <StatCard label="Opening Balance" value={money(ledger.account.openingBalance)} tint="from-sand to-espresso" />
          </div>
        )}
        {ledger && ledger.transactions.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-8">No transactions for this account.</p>
        ) : (
          <TableShell
            head={
              <>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th right>Amount</Th>
                <Th right>Fee</Th>
                <Th right>Net</Th>
                <Th right>Actions</Th>
              </>
            }
          >
            {(ledger?.transactions ?? []).map((t) => {
              const trx = t as { id: number; initiatedAt: number | string; transactionType: string; status: string; amount: number; processingFee: number; netAmount: number; reference?: string };
              return (
                <Row key={trx.id}>
                  <Td>{formatDate(trx.initiatedAt)}</Td>
                  <Td>{label(TXN_TYPE_LABELS, trx.transactionType, trx.transactionType)}</Td>
                  <Td>
                    <Pill tone={trx.status === 'successful' || trx.status === 'reconciled' ? 'green' : trx.status === 'failed' ? 'red' : 'amber'}>{trx.status}</Pill>
                  </Td>
                  <Td right>{money(trx.amount)}</Td>
                  <Td right>{money(trx.processingFee)}</Td>
                  <Td right className="font-semibold text-espresso">{money(trx.netAmount)}</Td>
                  <Td right>
                    <button onClick={() => setLedger(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft cursor-pointer" title="Close">
                      <X size={16} />
                    </button>
                  </Td>
                </Row>
              );
            })}
          </TableShell>
        )}
      </Modal>
    </div>
  );
};

export default PaymentAccounts;