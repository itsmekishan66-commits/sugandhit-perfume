import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendUrl, currency } from '../../config';
import { toast } from 'react-toastify';
import { productIdSchema } from '../../validate/schemas';
import { PageHeader, ConfirmDialog, Modal, RowActions } from '../../components';
import { money } from '../../utils';

interface VariantLike {
  name?: string;
  price?: string | number;
  description?: string;
  image?: string;
}

interface Product {
  _id: string;
  id: number;
  name: string;
  category: string;
  subCategory?: string;
  price: string | number;
  image: string[];
  description?: string;
  variants?: VariantLike[];
  sku?: string | null;
  cost?: number;
  stock?: number;
  reorderLevel?: number;
  bestseller?: boolean;
  rating?: number;
  reviews?: number;
  badge?: string | null;
  date?: number;
}

interface ListProps {
  token: string;
}

const List = ({ token }: ListProps) => {
  const navigate = useNavigate();
  const [list, setList] = useState<Product[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [viewTarget, setViewTarget] = useState<Product | null>(null);

  const fetchList = async () => {
    try {
      const response = await fetch(backendUrl + '/api/product/list', {
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setList(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  const removeProduct = async (id: string | number) => {
    if (!token) {
      toast.error("Unauthorized: Please log in to remove products.");
      return;
    }

    const parsed = productIdSchema.safeParse({ id });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    try {
      const response = await fetch(backendUrl + '/api/product/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await fetchList();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    fetch(backendUrl + '/api/product/list', {
      headers: { token }
    })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setList(data.products);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error((error as Error).message);
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <>
      <PageHeader
        title="All Perfumes"
        subtitle="Manage the perfumes in your boutique"
        trailing={
          <span className="rounded-full border border-gold/20 bg-white/80 px-3 py-1 text-sm text-ink-soft">
            {list.length} {list.length === 1 ? 'scent' : 'scents'}
          </span>
        }
      />
      <div className='bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur'>
      <div className='flex flex-col gap-2'>
        {/* Table Headers */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-3 px-3 border border-gold/15 bg-cream text-sm font-semibold text-ink-soft rounded-lg'>
          <b>Image</b>
          <b>Name</b>
          <b>Audience</b>
          <b>Price</b>
          {token && <b className='text-center'>Action</b>}
        </div>

        {/* Product List */}
        {list.map((item) => (
          <div
            className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-2 px-3 border border-gold/10 text-sm text-ink-soft hover:bg-sand/40 hover:border-gold/30 transition-colors rounded-lg'
            key={item._id}
          >
            <img className='w-12 h-12 object-cover rounded-lg border border-gold/15' src={item.image[0]} alt='' />
            <p className='text-ink'>{item.name}</p>
            <p>{item.category}</p>
            <p className='font-medium text-ink'>{currency}{item.price}</p>
            {token && (
              <div className='flex justify-center'>
                <RowActions
                  onView={() => setViewTarget(item)}
                  onEdit={() => navigate(`/edit/${item.id}`)}
                  onDelete={() => setDeleteTarget(item)}
                />
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className='text-center text-ink-soft/60 py-8'>No perfumes yet. Add your first one!</p>}
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Perfume"
        message={
          <>
            Are you sure you want to delete <span className="font-medium text-ink">“{deleteTarget?.name}”</span>? This will permanently remove it from the store.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) void removeProduct(deleteTarget._id); setDeleteTarget(null); }}
        onClose={() => setDeleteTarget(null)}
      />

      <Modal open={!!viewTarget} title={viewTarget?.name ?? 'Product Details'} onClose={() => setViewTarget(null)} wide>
        {viewTarget && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-4">
              <img
                className="w-32 h-32 shrink-0 rounded-2xl border border-gold/15 object-cover bg-cream"
                src={viewTarget.image?.[0]}
                alt=""
              />
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <p className="font-display text-2xl font-semibold text-ink">{viewTarget.name}</p>
                <p className="text-sm text-ink-soft">
                  {viewTarget.category}{viewTarget.subCategory ? ` · ${viewTarget.subCategory}` : ''}
                </p>
                <p className="font-medium text-xl text-espresso">{currency}{viewTarget.price}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewTarget.bestseller && <span className="rounded-full bg-gold/20 text-espresso px-3 py-0.5 text-xs font-medium">Bestseller</span>}
                  {viewTarget.badge && <span className="rounded-full bg-espresso/10 text-espresso border border-espresso/20 px-3 py-0.5 text-xs font-medium">{viewTarget.badge}</span>}
                  {typeof viewTarget.stock === 'number' && (
                    <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${viewTarget.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {viewTarget.stock > 0 ? `${viewTarget.stock} in stock` : 'Out of stock'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {viewTarget.description && (
              <div>
                <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-ink whitespace-pre-wrap">{viewTarget.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {viewTarget.sku != null && (
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-xs text-ink-soft">SKU</p>
                  <p className="font-medium text-ink">{viewTarget.sku || '—'}</p>
                </div>
              )}
              {typeof viewTarget.cost === 'number' && (
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-xs text-ink-soft">Cost price</p>
                  <p className="font-medium text-ink">{money(viewTarget.cost)}</p>
                </div>
              )}
              {typeof viewTarget.reorderLevel === 'number' && (
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-xs text-ink-soft">Min. stock level</p>
                  <p className="font-medium text-ink">{viewTarget.reorderLevel}</p>
                </div>
              )}
              {typeof viewTarget.rating === 'number' && viewTarget.rating > 0 && (
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-xs text-ink-soft">Rating</p>
                  <p className="font-medium text-ink">{viewTarget.rating} ★ ({viewTarget.reviews ?? 0} reviews)</p>
                </div>
              )}
              {viewTarget.date && (
                <div className="rounded-xl border border-gold/15 bg-cream/60 p-3">
                  <p className="text-xs text-ink-soft">Added on</p>
                  <p className="font-medium text-ink">{new Date(viewTarget.date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {!!viewTarget.variants?.length && (
              <div>
                <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-2">Variants ({viewTarget.variants.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewTarget.variants.map((v, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-gold/15 p-3">
                      {v.image && <img className="w-14 h-14 rounded-lg object-cover border border-gold/15" src={v.image} alt="" />}
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{v.name || `Variant ${i + 1}`}</p>
                        {v.price != null && v.price !== '' && <p className="text-sm text-espresso">{currency}{v.price}</p>}
                        {v.description && <p className="text-xs text-ink-soft mt-0.5">{v.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
    </>
  );
};

export default List;