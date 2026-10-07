import { useEffect, useRef, useState } from 'react'
import ProductItem from '@/components/product/ProductItem'
import Reveal from '@/components/ui/Reveal'
import Loading from '@/components/ui/Loading'
import { ChevronDown } from "lucide-react";
import { useApp } from '@/context/AppContext';
import { useChunkedPaging } from '@/hooks/useChunkedPaging';
import { fetchProductsPage } from '@/features/products/products.service';
import { showToast } from '@/components/feedback/toast';
import { PRODUCT_CATEGORIES, FRAGRANCE_FAMILIES } from '@/features/categories/catalog';

const PAGE_SIZE = 20
const NEAR_BOTTOM_PX = 360

const Collection = () => {
  const { search, showSearch } = useApp();
  const [showFilter, setShowFilter] = useState(true);
  const [category, setCategory] = useState<string[]>([]);
  const [subCategory, setSubCategory] = useState<string[]>([]);
  const [sortType, setSortType] = useState('relevant');
  const gridRef = useRef<HTMLDivElement>(null);

  const appliedSearch = showSearch && search.trim() ? search.trim() : '';

  const { rows, total, page, totalPages, setPage, loading, searching, loadingMore } = useChunkedPaging({
    fetcher: async (page: number, limit: number) =>
      fetchProductsPage({
        page,
        limit,
        search: appliedSearch,
        categories: category,
        subCategories: subCategory,
        sort: sortType === 'relevant' ? undefined : sortType,
      }),
    query: [appliedSearch, category, subCategory, sortType],
    onError: (error) => showToast((error as Error).message, 'error'),
    // Keep every loaded row in memory so the list only ever grows as pages load.
    windowSize: Number.MAX_SAFE_INTEGER,
  });

  // Infinite scroll: when the user scrolls near the bottom of the grid (or of the
  // page on small screens), advance to the next 20-row page. The hook prefetches
  // the next server chunk in the background, so items appear gradually.
  useEffect(() => {
    const scroller = gridRef.current;
    const check = () => {
      if (loading || searching || loadingMore || page >= totalPages) return;
      const el = scroller && scroller.scrollHeight > scroller.clientHeight
        ? scroller
        : document.scrollingElement;
      if (!el) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - NEAR_BOTTOM_PX) {
        setPage(page + 1);
      }
    };
    scroller?.addEventListener('scroll', check, { passive: true });
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      scroller?.removeEventListener('scroll', check);
      window.removeEventListener('scroll', check);
    };
  }, [page, totalPages, loading, searching, loadingMore, setPage]);

  const visibleItems = rows.slice(0, page * PAGE_SIZE);

  const toggleCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value));
    } else {
      setCategory(prev => [...prev, e.target.value]);
    }
  }

  const toggleSubCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory(prev => prev.filter(item => item !== e.target.value));
    } else {
      setSubCategory(prev => [...prev, e.target.value]);
    }
  }

  const categories = PRODUCT_CATEGORIES;
  const subCategories = FRAGRANCE_FAMILIES;

  return (
    <div className="flex flex-col lg:flex-row gap-2 md:gap-8 pt-2 no-scrollbar">
      {/* Filter sidebar */}
      <div className="lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto no-scrollbar">
        <p onClick={() => setShowFilter(!showFilter)} className="my-2 lg:hidden cursor-pointer flex items-center justify-between font-medium">
          Filters
          <ChevronDown className={`h-3 w-3 transition ${showFilter ? 'rotate-90' : ''}`} />
        </p>
        <div className={`lg:block ${showFilter ? '' : 'hidden'}`}>
          <Reveal className="p-6 rounded-2xl bg-white/70 border border-gold/15 backdrop-blur">
            <div className="border-b border-gold/15 pb-4">
              <p className="font-display text-xl font-medium mb-3">Category</p>
              <div className="flex flex-col gap-2 text-sm text-ink-soft">
                {categories.map((c) => (
                  <label key={c} className="flex gap-3 items-center cursor-pointer group">
                    <input className="w-4 h-4 accent-gold cursor-pointer" type="checkbox" value={c} onChange={toggleCategory} />
                    <span className="group-hover:text-espresso transition-colors">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="font-display text-xl font-medium mb-3">Fragrance Family</p>
              <div className="flex flex-col gap-2 text-sm text-ink-soft">
                {subCategories.map(({ value, label }) => (
                  <label key={value} className="flex gap-3 items-center cursor-pointer group">
                    <input className="w-4 h-4 accent-gold cursor-pointer" type="checkbox" value={value} onChange={toggleSubCategory} />
                    <span className="group-hover:text-espresso transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft hidden sm:block">Sort by</span>
            <select onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortType(e.target.value)} className="select-soft bg-white/80 border border-gold/25 rounded-full px-4 py-2.5 pr-10 text-sm cursor-pointer">
              <option value="relevant">Relevant</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loading variant="inline" className="w-55 md:w-100" label="Loading collection" />
          </div>
        ) : (
          <>
            <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-10 pt-4 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-2 lg:pb-2 no-scrollbar">
              {visibleItems.map((item, index) => (
                <Reveal key={item._id} delay={(index % PAGE_SIZE) * 50}>
                  <ProductItem id={item._id} image={item.image} name={item.name} price={Number(item.price)} subCategory={item.subCategory} category={item.category} rating={item.rating} reviews={item.reviews} badge={item.badge} bestseller={item.bestseller} popular={item.popular} />
                </Reveal>
              ))}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loading variant="inline" className="w-48" label="Loading more scents" />
              </div>
            )}

            {!searching && total === 0 && (
              <p className="text-center text-ink-soft py-20">No perfumes match those filters. Try softening your search ✨</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Collection