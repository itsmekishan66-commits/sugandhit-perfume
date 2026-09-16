import { useCallback, useEffect, useState } from 'react';
import { Plus, PackageCheck, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, ConfirmDialog, inputCls } from '../../components';
import { RowActions } from '../../components';
import { Loading } from '../../components';
import { ProductPicker } from '../../components';
import { api } from '../../services/api';
import { money, formatDate, PO_STATUS_LABELS } from '../../utils';

interface ProductBrief { id: number; name: string; price: number; stock?: number }
interface SupplierBrief { id: number; name: string }
interface POLine { id: number; _id: string; productId: number; quantity: number; unitCost: number; lineTotal: number; reorderLevel: number | null; product: ProductBrief | null }
interface PurchaseOrder {
  _id: string; id: number; poNumber: string; supplierId: number; supplier: SupplierBrief | null;
  orderDate: number; expectedDate?: number | null; receivedDate?: number | null;
  status: string; subTotal: number; taxAmount: number; totalAmount: number; notes?: string;
  lineCount?: number; lines?: POLine[];
}

interface LineForm { productId: string; quantity: string; unitCost: string; reorderLevel: string }

const InventoryPurchases = ({ token }: { token: string }) => {
  const [list, setList] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [vendors, setVendors] = useState<SupplierBrief[]>([]);
  const [products, setProducts] = useState<ProductBrief[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ supplierId: '', poNumber: '', orderDate: String(Date.now()), expectedDate: '', notes: '' });
  const [lines, setLines] = useState<LineForm[]>([{ productId: '', quantity: '', unitCost: '', reorderLevel: '' }]);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [working, setWorking] = useState(false);

  const [editTarget, setEditTarget] = useState<PurchaseOrder | null>(null);
  const [editForm, setEditForm] = useState({ supplierId: '', poNumber: '', orderDate: '', expectedDate: '', notes: '' });
  const [editLines, setEditLines] = useState<LineForm[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: '25' });
      if (status) q.set('status', status);
      if (search) q.set('search', search);
      const [res, vendorRes, productRes] = await Promise.all([
        api<{ success: boolean; data: { items: PurchaseOrder[]; total: number; page: number; limit: number } }>(`/api/inventory/purchases?${q}`, token),
        api<{ success: boolean; items: SupplierBrief[] }>('/api/accounts/vendors?limit=500', token),
        api<{ success: boolean; data: { items: ProductBrief[] } }>('/api/inventory/stock?limit=500', token),
      ]);
      setList(res.data.items);
      setTotal(res.data.total);
      setTotalPages(Math.max(1, Math.ceil(res.data.total / res.data.limit)));
      setVendors(vendorRes.items);
      setProducts(productRes.data.items);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, status, search, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: number) => {
    try {
      const res = await api<{ success: boolean; data: PurchaseOrder }>(`/api/inventory/purchases/${id}`, token);
      setDetail(res.data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const create = async () => {
    if (!form.supplierId || lines.some((l) => !l.productId || Number(l.quantity) <= 0)) {
      toast.error('Supplier and at least one line with a product and quantity are required.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/inventory/purchases', token, {
        method: 'POST',
        body: {
          supplierId: Number(form.supplierId),
          poNumber: form.poNumber,
          orderDate: Number(form.orderDate),
          expectedDate: form.expectedDate ? Number(form.expectedDate) : undefined,
          notes: form.notes,
          lines: lines
            .filter((l) => l.productId && Number(l.quantity) > 0)
            .map((l) => ({
              productId: Number(l.productId),
              quantity: Number(l.quantity),
              unitCost: Number(l.unitCost || 0),
              reorderLevel: l.reorderLevel !== '' ? Number(l.reorderLevel) : undefined,
            })),
        },
      });
      toast.success('Purchase order created.');
      setShowCreate(false);
      setLines([{ productId: '', quantity: '', unitCost: '', reorderLevel: '' }]);
      setForm({ ...form, poNumber: '', expectedDate: '', notes: '' });
      setPage(1);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const receive = async (po: PurchaseOrder) => {
    setWorking(true);
    try {
      await api('/api/inventory/purchases/receive', token, { method: 'POST', body: { id: po.id } });
      toast.success('Received â€” stock added, bill and journal entry created.');
      setDetail(null);
      setReceiveTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const cancel = async (po: PurchaseOrder) => {
    setWorking(true);
    try {
      await api('/api/inventory/purchases/cancel', token, { method: 'POST', body: { id: po.id } });
      toast.success('Purchase order cancelled.');
      setDetail(null);
      setReceiveTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const cancelFromDialog = async (po: PurchaseOrder) => {
    setWorking(true);
    try {
      await api('/api/inventory/purchases/cancel', token, { method: 'POST', body: { id: po.id } });
      toast.success('Purchase order cancelled â€” stock was not added.');
      setReceiveTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (!editForm.supplierId || editLines.some((l) => !l.productId || Number(l.quantity) <= 0)) {
      toast.error('Supplier and at least one line with a product and quantity are required.');
      return;
    }
    setWorking(true);
    try {
      await api('/api/inventory/purchases/update', token, {
        method: 'POST',
        body: {
          id: editTarget.id,
          supplierId: Number(editForm.supplierId),
          poNumber: editForm.poNumber,
          orderDate: Number(editForm.orderDate),
          expectedDate: editForm.expectedDate ? Number(editForm.expectedDate) : null,
          notes: editForm.notes,
          lines: editLines
            .filter((l) => l.productId && Number(l.quantity) > 0)
            .map((l) => ({
              productId: Number(l.productId),
              quantity: Number(l.quantity),
              unitCost: Number(l.unitCost || 0),
              reorderLevel: l.reorderLevel !== '' ? Number(l.reorderLevel) : undefined,
            })),
        },
      });
      toast.success('Purchase order updated.');
      setEditTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const openEdit = async (po: PurchaseOrder) => {
    try {
      const res = await api<{ success: boolean; data: PurchaseOrder }>(`/api/inventory/purchases/${po.id}`, token);
      const full = res.data;
      setEditTarget(full);
      setEditForm({
        supplierId: String(full.supplierId),
        poNumber: full.poNumber,
        orderDate: String(full.orderDate),
        expectedDate: full.expectedDate ? String(full.expectedDate) : '',
        notes: full.notes ?? '',
      });
      setEditLines(
        (full.lines ?? []).map((l) => ({
          productId: String(l.productId),
          quantity: String(l.quantity),
          unitCost: String(l.unitCost),
          reorderLevel: l.reorderLevel !== null ? String(l.reorderLevel) : '',
        }))
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const editUpdateLine = (idx: number, field: keyof LineForm, value: string) => {
    setEditLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const removeEditLine = (idx: number) => setEditLines((prev) => prev.filter((_, i) => i !== idx));

  const addEditLine = (p: { id: number; name: string; price?: number | string }) => {
    setEditLines((prev) => [
      ...prev,
      { productId: String(p.id), quantity: '1', unitCost: p.price !== undefined ? String(p.price) : '', reorderLevel: '' },
    ]);
  };

  const doDelete = async (po: PurchaseOrder) => {
    setWorking(true);
    try {
      await api('/api/inventory/purchases/delete', token, { method: 'POST', body: { id: po.id } });
      toast.success('Purchase order deleted.');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const updateLine = (idx: number, field: keyof LineForm, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const addProductLine = (p: { id: number; name: string; price?: number | string }) => {
    setLines((prev) => [
      ...prev,
      { productId: String(p.id), quantity: '1', unitCost: p.price !== undefined ? String(p.price) : '', reorderLevel: '' },
    ]);
  };

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const setLineProduct = (idx: number, productId: string) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const p = products.find((x) => x.id === Number(productId));
        return { ...l, productId, unitCost: p ? String(p.price) : l.unitCost };
      })
    );
  };

  const rowTone = (s: string) => (s === 'received' ? 'green' : s === 'cancelled' ? 'gray' : 'gold');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchases"
        subtitle="Purchase orders and stock receiving from suppliers"
        trailing={
          <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Purchase Order
          </button>
        }
      />

      <SectionCard title={`Purchase Orders (${total})`}>
        <div className="px-6 py-3 border-b border-gold/10 flex flex-wrap items-center justify-between gap-1">
            <div className="relative min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
              <input className={`${inputCls} w-5 pl-9`} placeholder="Search PO, supplier, notesâ€¦" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          <div className="flex items-center gap-8">
            <select className={`${inputCls} w-44 select-soft`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <span className="text-xs text-ink-soft">Receiving stock also creates a vendor bill and posts Inventory Dr / AP Cr.</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : list.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No purchase orders yet.</p>
        ) : (
          <TableShell head={<><Th>PO Number</Th><Th>Supplier</Th><Th>Ordered</Th><Th>Expected</Th><Th right>Items</Th><Th right>Total</Th><Th>Status</Th><Th right>Action</Th></>}>
            {list.map((po) => (
              <Row key={po._id}>
                <Td className="font-medium text-ink">{po.poNumber}</Td>
                <Td>{po.supplier?.name || `Supplier #${po.supplierId}`}</Td>
                <Td className="text-ink-soft">{formatDate(po.orderDate)}</Td>
                <Td className="text-ink-soft">{formatDate(po.expectedDate)}</Td>
                <Td right>{po.lineCount ?? 0}</Td>
                <Td right className="tabular-nums font-semibold text-espresso">{money(po.totalAmount)}</Td>
                <Td><Pill tone={rowTone(po.status)}>{PO_STATUS_LABELS[po.status] ?? po.status}</Pill></Td>
                <Td right>
                  <div className="inline-flex gap-1.5">
                    {po.status === 'ordered' && (
                      <button onClick={() => setReceiveTarget(po)} className="btn-gold px-3 py-1 text-xs cursor-pointer" title="Receive stock"><PackageCheck size={14} /></button>
                    )}
                    <RowActions
                      onView={() => openDetail(po.id)}
onEdit={(po.status !== 'cancelled') ? () => void openEdit(po) : undefined}
                    onDelete={(po.status !== 'cancelled') ? () => setDeleteTarget(po) : undefined}
                    />
                  </div>
                </Td>
              </Row>
            ))}
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

      <Modal open={showCreate} title="New Purchase Order" onClose={() => setShowCreate(false)} wide>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Supplier">
              <select className={inputCls} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Select supplierâ€¦</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="PO number">
              <input className={inputCls} value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} placeholder="e.g. PO-2026-015 (auto if blank)" />
            </Field>
            <Field label="Order date (ms)">
              <input type="number" className={inputCls} value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
            </Field>
            <Field label="Expected date (ms)" hint="Optional">
              <input type="number" className={inputCls} value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} placeholder={String(Date.now() + 7 * 86400000)} />
            </Field>
            <Field label="Notes">
              <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-xl border border-gold/15 bg-white/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm font-medium text-ink">Lines</p>
              <div className="w-full sm:w-72">
                <ProductPicker
                  products={products}
                  onAdd={addProductLine}
                  placeholder="Search product to add to the orderâ€¦"
                  disabled={working}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1.6fr_0.6fr_0.6fr_0.8fr_auto] gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-ink-soft">Product</span>
                    <select className={inputCls} value={l.productId} onChange={(e) => setLineProduct(idx, e.target.value)}>
                      <option value="">Selectâ€¦</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock ?? 0})</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-ink-soft">Qty</span>
                    <input type="number" className={inputCls} value={l.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-ink-soft">Unit cost</span>
                    <input type="number" className={inputCls} value={l.unitCost} onChange={(e) => updateLine(idx, 'unitCost', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-ink-soft">Min stock level</span>
                    <input type="number" className={inputCls} value={l.reorderLevel} onChange={(e) => updateLine(idx, 'reorderLevel', e.target.value)} placeholder="Optional" />
                  </div>
                  <button
                    onClick={() => removeLine(idx)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-red-600 cursor-pointer disabled:opacity-40"
                    title="Remove line"
                    disabled={lines.length <= 1}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setLines((prev) => [...prev, { productId: '', quantity: '', unitCost: '', reorderLevel: '' }])} className="mt-3 px-3 py-1 text-xs text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">
              + Add line
            </button>
            <p className="mt-2 text-xs text-ink-soft">Min stock level, when set, is applied to the product on receipt.</p>
          </div>

          <div className="flex justify-end gap-3">
            <GhostBtn onClick={() => setShowCreate(false)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={create} disabled={working}>{working ? 'Creatingâ€¦' : 'Create Purchase Order'}</PrimaryBtn>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} title={`Purchase Order ${detail?.poNumber ?? ''}`} onClose={() => setDetail(null)} wide>
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Supplier</p><p className="font-medium text-ink">{detail.supplier?.name || `#${detail.supplierId}`}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Ordered</p><p className="text-ink">{formatDate(detail.orderDate)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Received</p><p className="text-ink">{formatDate(detail.receivedDate)}</p></div>
              <div className="rounded-xl border border-gold/15 bg-white/70 p-3"><p className="text-xs text-ink-soft mb-1">Total</p><p className="font-semibold text-espresso">{money(detail.totalAmount)}</p></div>
            </div>

            <TableShell head={<><Th>Product</Th><Th right>Qty</Th><Th right>Unit Cost</Th><Th right>Line Total</Th><Th right>Min Stock</Th></>}>
              {(detail.lines ?? []).map((l) => (
                <Row key={l._id}>
                  <Td className="font-medium text-ink">{l.product?.name || `Product #${l.productId}`}</Td>
                  <Td right className="tabular-nums">{l.quantity}</Td>
                  <Td right className="tabular-nums">{money(l.unitCost)}</Td>
                  <Td right className="tabular-nums">{money(l.lineTotal)}</Td>
                  <Td right className="tabular-nums">{l.reorderLevel !== null ? l.reorderLevel : 'â€”'}</Td>
                </Row>
              ))}
            </TableShell>

            <div className="rounded-xl border border-gold/15 bg-cream/60 p-3 text-sm text-ink-soft">
              {detail.status === 'received'
                ? 'Received. Stock was added, a vendor bill was created under Payables, and a journal entry was posted (Inventory Dr / Accounts Payable Cr).'
                : detail.status === 'cancelled'
                  ? 'This purchase order was cancelled â€” no stock changes were made.'
                  : 'Ordered. Receiving adds stock for every line, applies any min stock levels, creates a vendor bill, and posts the inventory journal entry.'}
            </div>

            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setDetail(null)}>Close</GhostBtn>
              {detail.status === 'ordered' && (
                <>
                  <GhostBtn onClick={() => { if (!working) void cancel(detail); }} className={working ? 'opacity-50 pointer-events-none' : ''}>Cancel PO</GhostBtn>
                  <PrimaryBtn onClick={() => setReceiveTarget(detail)} disabled={working}><PackageCheck size={16} /> Receive Stock</PrimaryBtn>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editTarget} title={`Edit Purchase Order â€” ${editTarget?.poNumber ?? ''}`} onClose={() => setEditTarget(null)} wide>
        {editTarget && (
          <div className="flex flex-col gap-4">
            {editTarget.status === 'received' && (
              <div className="rounded-xl border border-gold/20 bg-gold/10 p-3 text-xs text-ink-soft">
                This order was already received. Changes here update the order and its lines only â€” stock, the vendor bill and the posted journal entry are <span className="font-medium text-ink">not</span> affected.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Supplier">
                <select className={inputCls} value={editForm.supplierId} onChange={(e) => setEditForm({ ...editForm, supplierId: e.target.value })}>
                  <option value="">Select supplierâ€¦</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
              <Field label="PO number">
                <input className={inputCls} value={editForm.poNumber} onChange={(e) => setEditForm({ ...editForm, poNumber: e.target.value })} />
              </Field>
              <Field label="Order date (ms)">
                <input type="number" className={inputCls} value={editForm.orderDate} onChange={(e) => setEditForm({ ...editForm, orderDate: e.target.value })} />
              </Field>
              <Field label="Expected date (ms)" hint="Leave blank to clear.">
                <input type="number" className={inputCls} value={editForm.expectedDate} onChange={(e) => setEditForm({ ...editForm, expectedDate: e.target.value })} placeholder={String(Date.now() + 7 * 86400000)} />
              </Field>
              <Field label="Notes">
                <input className={inputCls} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </Field>
            </div>

            <div className="rounded-xl border border-gold/15 bg-white/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-ink">Lines</p>
                <div className="w-full sm:w-72">
                  <ProductPicker
                    products={products}
                    onAdd={addEditLine}
                    placeholder="Search product to add to the orderâ€¦"
                    disabled={working}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {editLines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1.6fr_0.6fr_0.6fr_0.8fr_auto] gap-2 items-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ink-soft">Product</span>
                      <select className={inputCls} value={l.productId} onChange={(e) => editUpdateLine(idx, 'productId', e.target.value)}>
                        <option value="">Selectâ€¦</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock ?? 0})</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ink-soft">Qty</span>
                      <input type="number" className={inputCls} value={l.quantity} onChange={(e) => editUpdateLine(idx, 'quantity', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ink-soft">Unit cost</span>
                      <input type="number" className={inputCls} value={l.unitCost} onChange={(e) => editUpdateLine(idx, 'unitCost', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ink-soft">Min stock level</span>
                      <input type="number" className={inputCls} value={l.reorderLevel} onChange={(e) => editUpdateLine(idx, 'reorderLevel', e.target.value)} placeholder="Optional" />
                    </div>
                    <button
                      onClick={() => removeEditLine(idx)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-red-600 cursor-pointer disabled:opacity-40"
                      title="Remove line"
                      disabled={editLines.length <= 1}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setEditLines((prev) => [...prev, { productId: '', quantity: '', unitCost: '', reorderLevel: '' }])} className="mt-3 px-3 py-1 text-xs text-ink-soft border border-gold/20 rounded-full hover:text-espresso cursor-pointer">
                + Add line
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <GhostBtn onClick={() => setEditTarget(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={saveEdit} disabled={working}>{working ? 'Savingâ€¦' : 'Save Changes'}</PrimaryBtn>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!receiveTarget}
        title="Receive or Cancel Purchase Order?"
        message={
          <>
            <span className="font-medium text-ink">â€œ{receiveTarget?.poNumber}â€</span> from{' '}
            <span className="font-medium text-ink">{receiveTarget?.supplier?.name || `supplier #${receiveTarget?.supplierId}`}</span> is currently ordered.
            <span className="mt-3 block text-ink-soft">By clicking <span className="font-medium text-espresso">Receive Stock</span> the stock level will increase for every line, a vendor bill is created under Payables, and the inventory journal entry is posted (Inventory Dr / Accounts Payable Cr). This cannot be undone.</span>
            <span className="mt-3 block text-ink-soft">By clicking <span className="font-medium text-espresso">Cancel Purchase Order</span> the purchase order will be cancelled instead â€” stock will <span className="font-medium text-ink">not</span> be added and the order status becomes Cancelled.</span>
          </>
        }
        confirmLabel="Receive Stock"
        secondaryLabel="Cancel Purchase Order"
        busy={working}
        danger={false}
        onConfirm={() => { if (receiveTarget) void receive(receiveTarget); }}
        onSecondary={() => { if (receiveTarget) void cancelFromDialog(receiveTarget); }}
        onClose={() => setReceiveTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Purchase Order"
        message={
          <>
            Are you sure you want to delete purchase order <span className="font-medium text-ink">â€œ{deleteTarget?.poNumber}â€</span> for{' '}
            <span className="font-medium text-ink">{deleteTarget?.supplier?.name || `supplier #${deleteTarget?.supplierId}`}</span>? Its lines will be removed too.
            {deleteTarget?.status === 'received' && (
              <span className="mt-2 block">This order was already received â€” the vendor bill and posted journal entry are not deleted.</span>
            )}
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

export default InventoryPurchases;