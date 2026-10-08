import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '@/components/data-display/PageHeader';
import SectionCard from '@/components/data-display/SectionCard';
import TableShell from '@/components/data-display/TableShell';
import Th from '@/components/data-display/Th';
import Td from '@/components/data-display/Td';
import Row from '@/components/data-display/Row';
import Pill from '@/components/data-display/Pill';
import inputCls from '@/components/ui/input';
import Pagination from '@/components/ui/Pagination';
import { api } from '@/services/api';
import { formatDateTime } from '@/utils/format';
import { MOVEMENT_TYPE_LABELS } from '@/utils/labels';
import Loading from '@/components/feedback/Loading';

interface Movement {
  _id: string; id: number; type: string; change: number; before: number; after: number;
  referenceId?: string | null; note?: string; createdAt: number;
  product: { id: number; name: string; sku?: string | null } | null;
  actor: { id: number; name: string } | null;
}

const PAGE_SIZE = 20;

const toneFor = (t: string) => (t === 'sale' ? 'green' : t === 'sale_cancel' ? 'blue' : t === 'purchase_receipt' ? 'amber' : 'gold');

const InventoryMovements = ({ token }: { token: string }) => {
  const [items, setItems] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (type) q.set('type', type);
      if (search) q.set('search', search);
      const res = await api<{ success: boolean; data: { items: Movement[]; total: number; page: number; limit: number } }>(`/api/inventory/movements?${q}`, token);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page, type, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Stock Movements" subtitle="Full ledger of every stock change across sales, purchases and adjustments" />

      <SectionCard title={`Movements (${total})`}>
        <div className="px-6 py-3 border-b border-gold/10 flex flex-wrap items-center gap-3">
          <div className="w-46">
            <select className={`${inputCls} select-soft`} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
              <option value="">All types</option>
              <option value="opening">Opening Stock</option>
              <option value="adjustment">Adjustment</option>
              <option value="purchase_receipt">Purchase Receipt</option>
              <option value="sale">Sale</option>
              <option value="sale_cancel">Sale Cancel / Return</option>
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
            <input className={`${inputCls} w-56 pl-9`} placeholder="Search product, ref, note…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <p className="text-center text-ink-soft/60 py-10">No movements found.</p>
        ) : (
          <TableShell head={<><Th>Date</Th><Th>Type</Th><Th>Product</Th><Th>Ref</Th><Th right>Change</Th><Th right>Before</Th><Th right>After</Th><Th>Note</Th></>}>
            {items.map((m) => (
              <Row key={m._id}>
                <Td className="text-ink-soft whitespace-nowrap">{formatDateTime(m.createdAt)}</Td>
                <Td><Pill tone={toneFor(m.type)}>{MOVEMENT_TYPE_LABELS[m.type] ?? m.type}</Pill></Td>
                <Td className="font-medium text-ink">{m.product?.name || `Product #${m.product?.id ?? '?'}`}</Td>
                <Td className="text-ink-soft">{m.referenceId || '—'}</Td>
                <Td right className={`tabular-nums font-semibold ${m.change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {m.change >= 0 ? `+${m.change}` : m.change}
                </Td>
                <Td right className="tabular-nums text-ink-soft">{m.before}</Td>
                <Td right className="tabular-nums font-semibold text-espresso">{m.after}</Td>
                <Td className="text-ink-soft grow">{m.note || '—'}</Td>
              </Row>
            ))}
          </TableShell>
        )}
        <Pagination total={total} perPage={PAGE_SIZE} page={page} onPage={setPage} label="Movements" />
      </SectionCard>
    </div>
  );
};

export default InventoryMovements;