import { useCallback, useEffect, useState } from 'react';
import { Undo2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageHeader } from '../../components';
import { SectionCard, TableShell, Th, Td, Row, Modal, Field, PrimaryBtn, GhostBtn, Pill, inputCls } from '../../components';
import { api } from '../../services/api';
import { formatDateTime, MOVEMENT_TYPE_LABELS } from '../../utils';
import { Loading } from '../../components';

interface StockItem { _id: string; id: number; name: string; stock: number; price: number; reorderLevel: number | null }
interface Movement {
  _id: string; id: number; type: string; change: number;
  referenceId?: string | null; note?: string; createdAt: number;
  product: { id: number; name: string } | null;
}
interface ReturnsData { items: Movement[]; total: number }

const InventoryReturns = ({ token }: { token: string }) => {
  const [products, setProducts] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAdjust, setShowAdjust] = useState(false);
  const [form, setForm] = useState({ productId: '', change: '', reason: '' });
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: '50' });
      if (search) q.set('search', search);
      const [prodRes, movRes] = await Promise.all([
        api<{ success: boolean; data: { items: StockItem[] } }>('/api/inventory/stock?limit=500', token),
        api<{ success: boolean; data: ReturnsData }>(`/api/inventory/movements?${q}`, token),
      ]);
      setProducts(prodRes.data.items);
      setMovements(movRes.data.items);
      setTotal(movRes.data.total);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { load(); }, [load]);

  const saveAdjust = async () => {
    const change = Math.floor(Number(form.change));
    if (!form.productId || !change) { toast.error('Select a product and a non-zero quantity change.'); return; }
    setWorking(true);
    try {
      await api('/api/inventory/stock/adjust', token, {
        method: 'POST',
        body: { productId: Number(form.productId), change, reason: form.reason || 'Manual stock adjustment' },
      });
      toast.success(change > 0 ? `Returned ${change} units to stock.` : `Removed ${Math.abs(change)} units from stock.`);
      setShowAdjust(false);
      setForm({ productId: '', change: '', reason: '' });
      load();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setWorking(false);
    }
  };

  const moodTone = (t: string) => (t === 'sale_cancel' ? 'blue' : t === 'purchase_receipt' ? 'amber' : 'gold');
  const relevant = movements.filter((m) => m.type === 'sale_cancel' || m.type === 'adjustment');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Returns & Adjustments"
        subtitle="Return stock (returns, damaged units) and record manual stock adjustments"
        trailing={
          <button className="btn-gold px-5 py-2 text-sm cursor-pointer" onClick={() => setShowAdjust(true)}>
            <Undo2 size={16} /> Add / Return Stock
          </button>
        }
      />

      <SectionCard title={`Recent Returns & Adjustments (${total})`} action={
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
          <input className={`${inputCls} w-56 pl-9`} placeholder="Search product, ref, noteâ€¦" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      }>
        <p className="px-6 pt-3 pb-2 text-xs text-ink-soft">Shows sale returns (from cancelled/returned orders) and manual adjustments. All other movements live on the Movements tab.</p>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : relevant.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No returns or adjustments yet.</p>
        ) : (
          <TableShell head={<><Th>Date</Th><Th>Type</Th><Th>Product</Th><Th right>Change</Th><Th>Note</Th></>}>
            {relevant.map((m) => (
              <Row key={m._id}>
                <Td className="text-ink-soft whitespace-nowrap">{formatDateTime(m.createdAt)}</Td>
                <Td><Pill tone={moodTone(m.type)}>{MOVEMENT_TYPE_LABELS[m.type] ?? m.type}</Pill></Td>
                <Td className="font-medium text-ink">{m.product?.name || `Product #${m.product?.id ?? '?'}`}</Td>
                <Td right className={`tabular-nums font-semibold ${m.change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {m.change >= 0 ? `+${m.change}` : m.change}
                </Td>
                <Td className="text-ink-soft grow">{m.note || 'â€”'}</Td>
              </Row>
            ))}
          </TableShell>
        )}
      </SectionCard>

      <Modal open={showAdjust} title="Add / Return Stock" onClose={() => setShowAdjust(false)}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">Positive adds units back to stock (e.g. returns, damaged-units-found). Negative removes units (e.g. damaged/lost units or corrections).</p>
          <Field label="Product">
            <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select productâ€¦</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Quantity change">
              <input type="number" className={inputCls} value={form.change} onChange={(e) => setForm({ ...form, change: e.target.value })} placeholder="e.g. 3 or -2" />
            </Field>
            <Field label="Reason">
              <input className={inputCls} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Customer return" />
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <GhostBtn onClick={() => setShowAdjust(false)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveAdjust} disabled={working}>{working ? 'Savingâ€¦' : 'Save'}</PrimaryBtn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryReturns;