import { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/PageHeader';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, ConfirmDialog, inputCls } from '../components/finance/FinanceUI';
import RowActions from '../components/RowActions';
import Loading from '../components/loading';
import { api } from '../utils/finance';

interface Vendor { _id: string; id: number; name: string; email: string; phone: string; address: string; category: string; notes: string }

const InventorySuppliers = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', category: '', notes: '' });
  const [working, setWorking] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', category: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: '500' });
      if (search) q.set('search', search);
      const res = await api<{ success: boolean; items: Vendor[]; total: number }>(`/api/accounts/vendors?${q}`, token);
      setItems(res.items);
      setTotal(res.total);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.name.trim()) { toast.error('Supplier name is required.'); return; }
    setWorking(true);
    try {
      await api('/api/accounts/vendors', token, { method: 'POST', body: form });
      toast.success('Supplier added.');
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', address: '', category: '', notes: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const openEdit = (v: Vendor) => {
    setEditTarget(v);
    setEditForm({ name: v.name, email: v.email, phone: v.phone, address: v.address, category: v.category, notes: v.notes });
  };

  const saveEdit = async () => {
    if (!editTarget || !editForm.name.trim()) { toast.error('Supplier name is required.'); return; }
    setWorking(true);
    try {
      await api(`/api/accounts/vendors/${editTarget.id}`, token, { method: 'PUT', body: editForm });
      toast.success('Supplier updated.');
      setEditTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const doDelete = async (v: Vendor) => {
    setWorking(true);
    try {
      await api(`/api/accounts/vendors/${v.id}`, token, { method: 'DELETE' });
      toast.success('Supplier deleted.');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Suppliers"
        subtitle="Vendors you purchase stock from"
        trailing={
          <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Supplier
          </button>
        }
      />

      <SectionCard title={`Suppliers (${total})`} action={
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
          <input className={`${inputCls} w-56 pl-9`} placeholder="Search name, category, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      }>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No suppliers yet.</p>
        ) : (
          <TableShell head={<><Th>Name</Th><Th>Category</Th><Th>Phone</Th><Th>Email</Th><Th>Address</Th><Th right>Actions</Th></>}>
            {items.map((v) => (
              <Row key={v._id}>
                <Td className="font-medium text-ink">{v.name}</Td>
                <Td className="text-ink-soft">{v.category || '—'}</Td>
                <Td className="text-ink-soft">{v.phone || '—'}</Td>
                <Td className="text-ink-soft">{v.email || '—'}</Td>
                <Td className="text-ink-soft grow">{v.address || '—'}</Td>
<Td right>
                    <RowActions onEdit={() => openEdit(v)} onDelete={() => setDeleteTarget(v)} />
                  </Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showAdd} title="Add Supplier" onClose={() => setShowAdd(false)}>
        <div className="flex flex-col gap-4">
          <Field label="Full name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunrise Fragrance Traders" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Local, Importer" />
            </Field>
            <Field label="Notes">
              <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <GhostBtn onClick={() => setShowAdd(false)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={add} disabled={working}>{working ? 'Saving…' : 'Add Supplier'}</PrimaryBtn>
          </div>
        </div>
      </Modal>

      <Modal open={!!editTarget} title="Edit Supplier" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <div className="flex flex-col gap-4">
            <Field label="Full name">
              <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone">
                <input className={inputCls} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </Field>
            </div>
            <Field label="Address">
              <input className={inputCls} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Category">
                <input className={inputCls} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="e.g. Local, Importer" />
              </Field>
              <Field label="Notes">
                <input className={inputCls} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setEditTarget(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={saveEdit} disabled={working}>{working ? 'Saving…' : 'Save Supplier'}</PrimaryBtn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Supplier"
        message={
          <>
            Are you sure you want to delete supplier <span className="font-medium text-ink">“{deleteTarget?.name}”</span>?
          </>
        }
        confirmLabel="Delete"
        busy={working}
        danger
        onConfirm={() => { if (deleteTarget) void doDelete(deleteTarget); }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default InventorySuppliers;