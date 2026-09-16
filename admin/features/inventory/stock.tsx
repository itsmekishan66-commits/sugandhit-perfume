import { useCallback, useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { StatCard, SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, ConfirmDialog, inputCls } from '../../components';
import { RowActions } from '../../components';
import { Loading } from '../../components';
import { api } from '../../services/api';
import { money, num } from '../../utils';

interface StockItem {
  _id: string; id: number; name: string; sku?: string | null;
  price: number; cost: number; stock: number; reorderLevel: number | null;
}
interface StockRoot { _id: string; id: number; name: string; amount: string | number; productCount: number; unitCount: number; lowCount: number }
interface Summary { items: StockRoot[]; total: number; productCount: number; lowCount: number }

const stockTone = (s: number, r: number | null): { tone: string; label: string } => {
  if (s <= 0) return { tone: 'red', label: 'Out of Stock' };
  if (r && s <= r) return { tone: 'amber', label: 'Low Stock' };
  return { tone: 'green', label: 'In Stock' };
};

const InventoryStock = ({ token }: { token: string }) => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);

  const [editTarget, setEditTarget] = useState<StockItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', sku: '', price: '', cost: '', reorderLevel: '' });
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, page: String(page), limit: '25' });
      if (lowStock) q.set('lowStock', 'true');
      const [res, summaryRes] = await Promise.all([
        api<{ success: boolean; data: { items: StockItem[]; total: number; page: number; limit: number } }>(`/api/inventory/stock?${q}`, token),
        api<{ success: boolean; data: Summary }>('/api/inventory/summary', token),
      ]);
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(Math.max(1, Math.ceil(res.data.total / res.data.limit)));
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, search, page, lowStock]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (it: StockItem) => {
    setEditTarget(it);
    setEditForm({ name: it.name, sku: it.sku ?? '', price: String(it.price), cost: String(it.cost), reorderLevel: String(it.reorderLevel ?? 0) });
  };

  const saveEdit = async () => {
    if (!editTarget || !editForm.name.trim()) { toast.error('Product name is required.'); return; }
    setWorking(true);
    try {
      await api('/api/inventory/stock/product', token, {
        method: 'POST',
        body: {
          productId: editTarget.id,
          name: editForm.name,
          sku: editForm.sku,
          price: Number(editForm.price || 0),
          cost: Number(editForm.cost || 0),
          reorderLevel: Number(editForm.reorderLevel || 0),
        },
      });
      toast.success('Product updated.');
      setEditTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setWorking(true);
    try {
      await api('/api/inventory/stock/product/remove', token, {
        method: 'POST',
        body: { productId: deleteTarget.id },
      });
      toast.success('Product deleted.');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const courses = summary?.items?.[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products & Stock" subtitle="Selling price (SP), cost price (CP) and current inventory levels" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tracked Products" value={String(courses?.productCount ?? 0)} />
        <StatCard label="Units on Hand" value={String(num(courses?.unitCount))} />
        <StatCard label="Low / Out of Stock" value={String(courses?.lowCount ?? 0)} tint={(courses?.lowCount ?? 0) > 0 ? 'from-espresso/60 to-espresso' : 'from-blush to-sand'} />
        <StatCard label="Stock Value (Cost)" value={money(courses?.amount)} />
      </div>

      <SectionCard title={`Products (${total})`}>
        <div className="px-6 py-3 border-b border-gold/10 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
            <input className={`${inputCls} w-56 pl-9`} placeholder="Search name, skuâ€¦" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={() => { setLowStock((v) => !v); setPage(1); }} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm cursor-pointer ${lowStock ? 'border-espresso bg-espresso text-cream' : 'border-gold/25 bg-white/70 text-ink-soft hover:text-espresso'}`}>
            <SlidersHorizontal size={14} /> Low stock
          </button>
          <span className="text-xs text-ink-soft ml-auto">Stock adjustments and returns live on the Returns tab.</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No products found.</p>
        ) : (
          <TableShell head={<><Th>Product</Th><Th>SKU</Th><Th right>SP</Th><Th right>CP</Th><Th right>In Stock</Th><Th right>Min Level</Th><Th>Status</Th><Th right>Actions</Th></>}>
            {items.map((it) => {
              const st = stockTone(it.stock, it.reorderLevel);
              return (
                <Row key={it._id}>
                  <Td className="font-medium text-ink">{it.name}</Td>
                  <Td className="text-ink-soft">{it.sku || 'â€”'}</Td>
                  <Td right className="tabular-nums">{money(it.price)}</Td>
                  <Td right className="tabular-nums text-ink-soft">{money(it.cost)}</Td>
                  <Td right className="tabular-nums font-semibold text-espresso">{it.stock}</Td>
                  <Td right className="tabular-nums">{it.reorderLevel ?? 0}</Td>
                  <Td><Pill tone={st.tone}>{st.label}</Pill></Td>
                  <Td right>
                    <RowActions onEdit={() => openEdit(it)} onDelete={() => setDeleteTarget(it)} />
                  </Td>
                </Row>
              );
            })}
          </TableShell>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gold/15 text-sm">
            <GhostBtn onClick={() => setPage((p) => Math.max(1, p - 1))} className={page <= 1 ? 'opacity-40 pointer-events-none' : ''}>Prev</GhostBtn>
            <span className="text-ink-soft">Page {page} of {totalPages}</span>
            <GhostBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={page >= totalPages ? 'opacity-40 pointer-events-none' : ''}>Next</GhostBtn>
          </div>
        )}
      </SectionCard>

      <Modal open={!!editTarget} title={`Edit Product â€” ${editTarget?.name ?? ''}`} onClose={() => setEditTarget(null)}>
        <div className="flex flex-col gap-4">
          <Field label="Product name">
            <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </Field>
          <Field label="SKU">
            <input className={inputCls} value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="SP â€” Selling price">
              <input type="number" className={inputCls} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
            </Field>
            <Field label="CP â€” Cost price">
              <input type="number" className={inputCls} value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} />
            </Field>
          </div>
          <Field label="Minimum stock level" hint="Low-stock warning threshold.">
            <input type="number" className={inputCls} value={editForm.reorderLevel} onChange={(e) => setEditForm({ ...editForm, reorderLevel: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-3">
            <GhostBtn onClick={() => setEditTarget(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveEdit} disabled={working}>{working ? 'Savingâ€¦' : 'Save Product'}</PrimaryBtn>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={
          <>
            Are you sure you want to delete this product{' '}
            <span className="font-medium text-ink">â€œ{deleteTarget?.name}â€</span>? Past purchase lines and stock movements still reference it, so only the product record is removed.
          </>
        }
        confirmLabel="Delete"
        busy={working}
        danger
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default InventoryStock;