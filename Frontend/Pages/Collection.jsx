import { useContext, useMemo, useState } from 'react'
import { ShopContext } from '../Context/ShopContextObject'
import ProductItem from '../Components/ProductItem'
import Reveal from '../Components/Reveal'
import { ChevronDown } from "lucide-react";

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(true);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relevant');

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value));
    } else {
      setCategory(prev => [...prev, e.target.value]);
    }
  }

  const toggleSubCategory = (e) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory(prev => prev.filter(item => item !== e.target.value));
    } else {
      setSubCategory(prev => [...prev, e.target.value]);
    }
  }

  const filterProducts = useMemo(() => {
    let productsCopy = products.slice();

    if (showSearch && search) {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(item => subCategory.includes(item.subCategory));
    }

    if (sortType === 'low-high') {
      productsCopy.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortType === 'high-low') {
      productsCopy.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return productsCopy;
  }, [products, search, showSearch, category, subCategory, sortType]);

  const categories = ['Men', 'Women', 'Unisex'];
  const subCategories = [
    { value: 'Resins', label: '🪵 Oud · Resin' },
    { value: 'Warm & Spicy', label: '🔥 Warm & Spicy' },
    { value: 'Fresh & Aqua', label: '💧 Fresh & Aqua' },
    { value: 'Floral', label: '🌷 Floral' },
    { value: 'Sweet & Gourmand', label: '🍫 Sweet & Gourmand' },
    { value: 'Woody & Vetiver', label: '🌲 Woody & Vetiver' },
  ];

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
            <select onChange={(e) => setSortType(e.target.value)} className="select-soft bg-white/80 border border-gold/25 rounded-full px-4 py-2.5 pr-10 text-sm cursor-pointer">
              <option value="relevant">Relevant</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 gap-y-10 pt-4 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-2 lg:pb-2 no-scrollbar">
          {filterProducts.map((item, index) => (
            <Reveal key={item._id} delay={index * 50}>
              <ProductItem id={item._id} image={item.image} name={item.name} price={Number(item.price)} subCategory={item.subCategory} category={item.category} rating={item.rating} reviews={item.reviews} badge={item.badge} bestseller={item.bestseller} popular={item.popular} />
            </Reveal>
          ))}
        </div>
        {filterProducts.length === 0 && (
          <p className="text-center text-ink-soft py-20">No perfumes match those filters. Try softening your search ✨</p>
        )}
      </div>
    </div>
  );
};

export default Collection