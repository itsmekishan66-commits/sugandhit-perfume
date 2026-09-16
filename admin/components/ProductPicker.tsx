import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

interface PickerProduct {
  id: number;
  name: string;
  sku?: string | null;
  price?: number | string;
}

interface ProductPickerProps {
  products: PickerProduct[];
  onAdd: (product: PickerProduct) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ProductPicker = ({ products, onAdd, placeholder = 'Search product to add…', disabled = false }: ProductPickerProps) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku && String(p.sku).toLowerCase().includes(q)))
      .slice(0, 12);
  }, [products, query]);

  const pick = (p: PickerProduct) => {
    onAdd(p);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/50" />
        <input
          className="w-full px-9 py-2 rounded-xl border border-gold/20 bg-white/70 text-sm outline-none focus:border-gold/50 cursor-text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft hover:text-espresso cursor-pointer"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && query.trim() && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-gold/15 bg-white shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-soft">No products match.</p>
          ) : (
            matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-cream cursor-pointer"
              >
                <span className="truncate">{p.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  {p.sku && <span className="text-xs text-ink-soft">{p.sku}</span>}
                  <Plus size={14} className="text-espresso" />
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPicker;