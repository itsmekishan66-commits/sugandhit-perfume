import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Power } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { money, ACCOUNT_TYPE_LABELS } from '../../utils';
import { Loading } from '../../components';

interface Account {
  _id: string;
  id: number;
  code: string;
  name: string;
  accountType: string;
  accountTypeLabel: string;
  normalBalance: string;
  active: boolean;
  description?: string;
  journalLineCount: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

const emptyForm = { code: '', name: '', accountType: 'asset', normalBalance: 'debit', description: '' };

const AccountingChart = ({ token }: { token: string }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: boolean; accounts: Account[] }>('/api/accounts/chart', token);
      setAccounts(res.accounts);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required.');
      return;
    }
    setSaving(true);
    try {
      if (editAcc) {
        await api(`/api/accounts/chart/${editAcc.id}`, token, { method: 'PUT', body: form });
        toast.success('Account updated.');
      } else {
        await api('/api/accounts/chart', token, { method: 'POST', body: form });
        toast.success('Account created.');
      }
      setShowForm(false);
      setEditAcc(null);
      setForm(emptyForm);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (acc: Account) => {
    try {
      await api(`/api/accounts/chart/${acc.id}/deactivate`, token, { method: 'POST' });
      toast.success('Account deactivated.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openEdit = (acc: Account) => {
    setEditAcc(acc);
    setForm({ code: acc.code, name: acc.name, accountType: acc.accountType, normalBalance: acc.normalBalance, description: acc.description ?? '' });
    setShowForm(true);
  };

  const openNew = () => {
    setEditAcc(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Chart of Accounts"
        subtitle={`${accounts.length} accounts`}
        trailing={<button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={openNew}><Plus size={16} /> Add Account</button>}
      />

      <SectionCard title="Chart of Accounts">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : accounts.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No chart accounts yet. Add the first account to begin.</p>
        ) : (
          <TableShell head={<><Th>Code</Th><Th>Name</Th><Th>Type</Th><Th>Balance</Th><Th right>Lines</Th><Th>Status</Th><Th right>Action</Th></>}>
            {accounts.map((a) => (
              <Row key={a._id}>
                <Td className="font-medium text-ink font-mono">{a.code}</Td>
                <Td>
                  <p className="font-medium text-ink">{a.name}</p>
                  {a.description && <p className="text-xs text-ink-soft">{a.description}</p>}
                </Td>
                <Td><Pill tone={a.accountType === 'asset' ? 'green' : a.accountType === 'liability' || a.accountType === 'equity' ? 'amber' : a.accountType === 'revenue' ? 'gold' : 'red'}>{a.accountTypeLabel}</Pill></Td>
                <Td className={`tabular-nums font-semibold ${a.balance >= 0 ? 'text-ink' : 'text-espresso'}`}>{money(a.balance)}</Td>
                <Td right>{a.journalLineCount}</Td>
                <Td><Pill tone={a.active ? 'green' : 'red'}>{a.active ? 'Active' : 'Inactive'}</Pill></Td>
                <Td right>
                  <div className="inline-flex gap-2">
                    <button onClick={() => openEdit(a)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer" title="Edit"><Edit2 size={16} /></button>
                    {a.active && (
                      <button onClick={() => deactivate(a)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso cursor-pointer" title="Deactivate"><Power size={16} /></button>
                    )}
                  </div>
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showForm} title={editAcc ? `Edit ${editAcc.name}` : 'Add Chart Account'} onClose={() => { setShowForm(false); setEditAcc(null); }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Code">
            <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. 1010" />
          </Field>
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Normal balance">
            <select className={inputCls} value={form.normalBalance} onChange={(e) => setForm({ ...form, normalBalance: e.target.value })}>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </Field>
          <Field label="Description" hint="Optional description for this account.">
            <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => { setShowForm(false); setEditAcc(null); }}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submit} disabled={saving}>{saving ? 'Savingâ€¦' : editAcc ? 'Update Account' : 'Create Account'}</PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
};

export default AccountingChart;