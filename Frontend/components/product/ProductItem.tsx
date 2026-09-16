import { Link } from 'react-router-dom'
import { Star, Heart, ShoppingCart } from 'lucide-react'
import { CURRENCY } from '@/config/constants'
import { useCart } from '@/context/CartContext'

const badgeStyles: Record<string, string> = {
  Bestseller: 'bg-espresso text-cream',
  New: 'bg-ink text-cream',
  Limited: 'bg-gold text-ink',
  Sale: 'bg-blush text-espresso',
}

const categoryLabels: Record<string, string> = {
  Men: 'Men',
  Women: 'Women',
  Unisex: 'Unisex',
}

interface ProductItemProps {
  id: string;
  image?: string[];
  name: string;
  price: number;
  subCategory?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  badge?: string;
  bestseller?: boolean;
  popular?: boolean;
}

const ProductItem = ({ id, image, name, price, subCategory, category, rating, reviews, badge, bestseller, popular }: ProductItemProps) => {
  const addToCart = useCart((s) => s.addToCart);
  const toggleWishlist = useCart((s) => s.toggleWishlist);
  const wishlist = useCart((s) => s.wishlist);
  const isInWishlist = (itemId: string) => wishlist.includes(itemId);
  const label = badge || (bestseller ? 'Bestseller' : null);
  const score = Number(rating) || 0;
  const isPopular = popular ?? (String(id).charCodeAt(String(id).length - 1) % 3 === 0);
  return (
    <Link className="group text-ink cursor-pointer relative block" to={`/product/${id}`}>
      {isPopular && (
        <span className="award-badge">
          Popular
        </span>
      )}
      <div className="img-zoom-wrap relative rounded-2xl bg-white shadow-sm shadow-espresso/5 border border-gold/10 card-lux">
        {(label || category) && (
          <span className={`absolute top-2 left-2 z-10 text-[0.5rem] tracking-[0.18em] uppercase px-2 py-0.5 rounded-full font-medium shadow-sm ${label ? (badgeStyles[label] || 'bg-espresso text-cream') : 'bg-white/85 backdrop-blur text-espresso border border-gold/20'}`}>
            {label || (category ? (categoryLabels[category] || category) : '')}
          </span>
        )}
        {image && image[0] ? (
          <img className="w-full aspect-3/4 object-cover" src={image[0]} alt={name} loading="lazy" />
        ) : (
          <div className="w-full aspect-3/4 flex items-center justify-center bg-linear-to-br from-blush to-sand">
            <span className="font-display text-espresso/50 italic">Sugandhit</span>
          </div>
        )}
        <span className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-transparent px-1.5 py-0.5 text-[0.65rem] font-medium text-espresso drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
          <Star className="w-3 h-3 fill-gold text-gold" />
          {score.toFixed(1)}
          {reviews ? <span className="text-espresso/70">({reviews})</span> : null}
        </span>
      </div>
      <div className="pt-4 flex items-start justify-between">
        <div>
          <p className="font-medium tracking-wide">{name}</p>
          <p className="text-xs tracking-luxe uppercase text-ink-soft mt-1">{subCategory || 'Parfum'}</p>
        </div>
        <p className="font-display text-lg gold-text font-semibold whitespace-nowrap">{CURRENCY}{price}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(id);
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-gold/20 shadow-sm transition-transform hover:scale-110"
        >
          <Heart className={`w-4 h-4 transition-colors ${isInWishlist(id) ? 'fill-espresso text-espresso' : 'text-ink-soft'}`} />
        </button>
        <button
          type="button"
          aria-label="Add to cart"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(id, '100ml');
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink/90 py-2 text-[0.7rem] font-medium text-cream transition-colors hover:bg-ink"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      </div>
    </Link>
  );
};

export default ProductItem;