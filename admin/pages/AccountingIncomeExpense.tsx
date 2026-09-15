import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, StatCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, Tabs, inputCls } from '../components/finance/FinanceUI';
import { api, money, formatDate } from '../utils/finance';

interface ChartAcc { id: number; code: string; name: string; accountType: string; active: boolean }
interface PaymentAcc { id: number; name: string; active: boolean }

interface IncomeRow { id: number; _id: string; date: number; source: string; accountId: number; accountName: string; amount: number; reference?: string; description?: string }
interface ExpenseRow {
  id: number; _id: string; date: number; vendorId?: number | null; vendorName?: string;
  accountId: number; accountName: string; amount: number; taxAmount: number;
  paymentAccountId?: number | null; description?: string; approvalStatus: string; paymentStatus: string;
}

const PAGE_SIZE = 25;

const AccountingIncomeExpense = ({ token }: { token: string }) => {
  const [tab, setTab] = useState('income');
  const [income, setIncome] = useState<IncomeRow[]>([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartAccounts, setChartAccounts] = useState<ChartAcc[]>([]);
  const [payAccounts, setPayAccounts] = useState<PaymentAcc[]>([]);
  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [saving, setSaving] = useState(false);

  const [incomeForm, setIncomeForm] = useState({ date: String(Date.now()), source: '', accountId: '', amount: '', reference: '', description: '' });
  const [expenseForm, setExpenseForm] = useState({ date: String(Date.now()), vendorName: '', accountId: '', amount: '', taxAmount: '0', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inc, exp, incTot, expTot, chartRes, payRes] = await Promise.all([
        api<{ success: boolean; items: IncomeRow[]; total: number }>(`/api/accounts/income?page=1&limit=${PAGE_SIZE}`, token),
        api<{ success: boolean; items: ExpenseRow[]; total: number }>(`/api/accounts/expenses?page=1&limit=${PAGE_SIZE}`, token),
        api<{ success: boolean; total: number }>('/api/accounts/income/totals', token),
        api<{ success: boolean; total: number }>('/api/accounts/expenses/totals', token),
        api<{ success: boolean; accounts: ChartAcc[] }>('/api/accounts/chart', token),
        api<{ success: boolean; accounts: PaymentAcc[] }>('/api/payment/accounts', token),
      ]);
      setIncome(inc.items);
      setIncomeCount(inc.total);
      setIncomeTotal(incTot.total);
      setExpenses(exp.items);
      setExpenseCount(exp.total);
      setExpenseTotal(expTot.total);
      setChartAccounts(chartRes.accounts.filter((a) => a.active));
      setPayAccounts(payRes.accounts.filter((a) => a.active));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submitIncome = async () => {
    if (!incomeForm.accountId || Number(incomeForm.amount) <= 0 || !incomeForm.date) {
      toast.error('Account, amount and date are required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/accounts/income', token, { method: 'POST', body: { date: Number(incomeForm.date), source: incomeForm.source, accountId: Number(incomeForm.accountId), amount: Number(incomeForm.amount), reference: incomeForm.reference, description: incomeForm.description } });
      toast.success('Income recorded and journal posted.');
      setShowIncome(false);
      setIncomeForm({ date: String(Date.now()), source: '', accountId: '', amount: '', reference: '', description: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const submitExpense = async () => {
    if (!expenseForm.accountId || Number(expenseForm.amount) <= 0 || !expenseForm.date) {
      toast.error('Account, amount and date are required.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/accounts/expenses', token, { method: 'POST', body: { date: Number(expenseForm.date), vendorName: expenseForm.vendorName, accountId: Number(expenseForm.accountId), amount: Number(expenseForm.amount), taxAmount: Number(expenseForm.taxAmount || 0), description: expenseForm.description } });
      toast.success('Expense created (pending approval).');
      setShowExpense(false);
      setExpenseForm({ date: String(Date.now()), vendorName: '', accountId: '', amount: '', taxAmount: '0', description: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const approveExpense = async (e: ExpenseRow, approved: boolean) => {
    try {
      await api('/api/accounts/expenses/approve', token, { method: 'POST', body: { id: e.id, approved } });
      toast.success(approved ? 'Expense approved and journal posted.' : 'Expense rejected.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const payExpense = async (e: ExpenseRow) => {
    try {
      const account = payAccounts[0];
      if (!account) { toast.error('No payment account configured.'); return; }
      await api('/api/accounts/expenses/pay', token, { method: 'POST', body: { id: e.id, paymentAccountId: account.id } });
      toast.success('Expense marked as paid.');
      load();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Income & Expenses"
        subtitle="Record income and expense entries"
        trailing={
          <div className="flex gap-2">
            <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowIncome(true)}><Plus size={16} /> Record Income</button>
            <button className="btn-primary bg-espresso px-5 py-2 text-sm cursor-pointer" onClick={() => setShowExpense(true)}><Plus size={16} /> Record Expense</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={money(incomeTotal)} tint="from-gold-soft to-gold" />
        <StatCard label="Income Records" value={incomeCount} tint="from-blush to-sand" />
        <StatCard label="Total Expenses" value={money(expenseTotal)} tint="from-espresso/60 to-espresso" />
        <StatCard label="Expense Records" value={expenseCount} tint="from-sand to-espresso" />
      </div>

      <SectionCard>
        <Tabs tabs={[{ key: 'income', label: `Income (${income.length})` }, { key: 'expenses', label: `Expenses (${expenses.length})` }]} active={tab} onChange={setTab} />
        {loading ? (
          <p className="text-center text-ink-soft/60 py-10">Loading…</p>
        ) : tab === 'income' ? (
          income.length === 0 ? (
            <p className="text-center text-ink-soft/60 py-10">No income records yet.</p>
          ) : (
            <TableShell head={<><Th>Date</Th><Th>Source</Th><Th>Account</Th><Th>Description</Th><Th right>Amount</Th></>}>
              {income.map((i) => (
                <Row key={i._id}>
                  <Td>{formatDate(i.date)}</Td>
                  <Td className="font-medium text-ink">{i.source || '—'}</Td>
                  <Td className="text-ink-soft">{i.accountName || `Account #${i.accountId}`}</Td>
                  <Td className="text-ink-soft">{i.description || i.reference || '—'}</Td>
                  <Td right className="font-semibold text-espresso tabular-nums">{money(i.amount)}</Td>
                </Row>
              ))}
            </TableShell>
          )
        ) : expenses.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No expenses yet.</p>
        ) : (
          <TableShell head={<><Th>Date</Th><Th>Vendor</Th><Th>Account</Th><Th>Description</Th><Th right>Amount</Th><Th>Approval</Th><Th>Payment</Th><Th right>Action</Th></>}>
            {expenses.map((e) => (
              <Row key={e._id}>
                <Td>{formatDate(e.date)}</Td>
                <Td className="font-medium text-ink">{e.vendorName || '—'}</Td>
                <Td className="text-ink-soft">{e.accountName || `Account #${e.accountId}`}</Td>
                <Td className="text-ink-soft">{e.description || '—'}</Td>
                <Td right className="font-semibold text-espresso tabular-nums">{money(e.amount)}{e.taxAmount ? <span className="text-xs text-ink-soft block">+tax {money(e.taxAmount)}</span> : null}</Td>
                <Td><Pill tone={e.approvalStatus === 'approved' ? 'green' : e.approvalStatus === 'pending' ? 'amber' : 'red'}>{e.approvalStatus}</Pill></Td>
                <Td><Pill tone={e.paymentStatus === 'paid' ? 'green' : 'gold'}>{e.paymentStatus}</Pill></Td>
                <Td right>
                  <div className="inline-flex flex-col gap-1.5 items-end">
                    {e.approvalStatus === 'pending' && (
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => approveExpense(e, true)} className="btn-gold px-3 py-1 text-xs cursor-pointer">Approve</button>
                        <button onClick={() => approveExpense(e, false)} className="px-3 py-1 text-xs text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">Reject</button>
                      </div>
                    )}
                    {e.approvalStatus === 'approved' && e.paymentStatus !== 'paid' && (
                      <button onClick={() => payExpense(e)} className="btn-primary bg-espresso px-4 py-1 text-xs cursor-pointer">Mark Paid</button>
                    )}
                  </div>
                </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showIncome} title="Record Income" onClose={() => setShowIncome(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date (ms)"><input type="number" className={inputCls} value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} /></Field>
          <Field label="Source"><input className={inputCls} value={incomeForm.source} onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })} placeholder="e.g. Order #123" /></Field>
          <Field label="Revenue account">
            <select className={inputCls} value={incomeForm.accountId} onChange={(e) => setIncomeForm({ ...incomeForm, accountId: e.target.value })}>
              <option value="">Select…</option>
              {chartAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" className={inputCls} value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} /></Field>
          <Field label="Reference"><input className={inputCls} value={incomeForm.reference} onChange={(e) => setIncomeForm({ ...incomeForm, reference: e.target.value })} /></Field>
          <Field label="Description"><input className={inputCls} value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowIncome(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submitIncome} disabled={saving}>{saving ? 'Saving…' : 'Record Income'}</PrimaryBtn>
        </div>
      </Modal>

      <Modal open={showExpense} title="Record Expense" onClose={() => setShowExpense(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date (ms)"><input type="number" className={inputCls} value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /></Field>
          <Field label="Vendor name"><input className={inputCls} value={expenseForm.vendorName} onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })} /></Field>
          <Field label="Expense account">
            <select className={inputCls} value={expenseForm.accountId} onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })}>
              <option value="">Select…</option>
              {chartAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input type="number" className={inputCls} value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></Field>
          <Field label="Tax amount"><input type="number" className={inputCls} value={expenseForm.taxAmount} onChange={(e) => setExpenseForm({ ...expenseForm, taxAmount: e.target.value })} /></Field>
          <Field label="Description"><input className={inputCls} value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <GhostBtn onClick={() => setShowExpense(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submitExpense} disabled={saving}>{saving ? 'Saving…' : 'Record Expense'}</PrimaryBtn>
        </div>
      </Modal>
    </div>
  );
};

export default AccountingIncomeExpense;