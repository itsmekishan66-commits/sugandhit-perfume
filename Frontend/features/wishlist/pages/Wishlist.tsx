import { useNavigate, Link } from 'react-router-dom'
import { Heart } from "lucide-react"
import Title from '@/components/ui/Title'
import Reveal from '@/components/ui/Reveal'
import { useApp } from '@/context/AppContext'
import { useCart } from '@/context/CartContext'
import { CURRENCY } from '@/config/constants'

const Wishlist = () => {
  const { products } = useApp();
  const navigate = useNavigate();
  const wishlist = useCart((s) => s.wishlist);
  const toggleWishlist = useCart((s) => s.toggleWishlist);
  const addToCart = useCart((s) => s.addToCart);

  const wishlisted = products.filter((item) => wishlist.includes(item._id));

  return (
    <div className="pt-2 min-h-[70vh] flex flex-col">
      <Title text1={'Your'} text2={'Wishlist'} />

      {wishlisted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
          <p className="font-display text-3xl italic text-ink-soft">Your wishlist is empty…</p>
          <p className="text-ink-soft mt-3 px-4">Save the scents you adore and find them here.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button onClick={() => navigate('/collection')} className="btn-primary">Explore Collection</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {wishlisted.map((item) => (
              <Reveal key={item._id}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-gold/15 bg-white/70 p-4 card-lux">
                  <Link to={`/product/${item._id}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0 w-full">
                    <div className="w-full sm:w-20 h-48 sm:h-24 rounded-xl overflow-hidden bg-linear-to-br from-blush to-sand flex items-center justify-center shrink-0">
                      {item.image && item.image[0] ? (
                        <img className="w-full h-full object-cover" src={item.image[0]} alt="" />
                      ) : (
                        <span className="font-display text-espresso/40 italic text-xs">Sugandhit</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg sm:text-xl font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-ink-soft">
                        <span className="text-xs tracking-luxe uppercase">{item.subCategory || 'Parfum'}</span>
                      </div>
                      <p className="font-display text-lg gold-text font-semibold mt-1">{CURRENCY} {Number(item.price)}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
                    <button onClick={() => addToCart(item._id, '100ml')} className="btn-primary flex-1 sm:flex-none text-xs px-5 py-2 rounded-full whitespace-nowrap">Add to Cart</button>
                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      onClick={() => toggleWishlist(item._id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-gold/20 shadow-sm transition-transform hover:scale-110"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(item._id) ? 'fill-espresso text-espresso' : 'text-ink-soft'}`} />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <button onClick={() => navigate('/collection')} className="w-full text-sm text-ink-soft hover:text-espresso transition-colors">
              ← Continue shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist