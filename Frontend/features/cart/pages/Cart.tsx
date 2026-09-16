import { useNavigate } from 'react-router-dom'
import { Trash } from "lucide-react"
import Title from '@/components/ui/Title';
import CartTotal from '@/components/cart/CartTotal';
import Reveal from '@/components/ui/Reveal';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { CURRENCY } from '@/config/constants';

const Cart = () => {
  const { products } = useApp();
  const navigate = useNavigate();
  const cartItems = useCart((s) => s.cartItems);
  const updateQuantity = useCart((s) => s.updateQuantity);

  const cartData = Object.entries(cartItems);

  return (
    <div className="pt-2min-h-[60vh]">
      <Title text1={'Your'} text2={'Cart'} />

      {cartData.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl italic text-ink-soft">Your cart is empty…</p>
          <p className="text-ink-soft mt-3">Explore our collection or compose your own scent.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button onClick={() => navigate('/collection')} className="btn-primary">Explore Collection</button>
            <button onClick={() => navigate('/customize')} className="btn-gold">Build a Custom Perfume</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10 mt-4">
          {/* Items */}
          <div className="flex-1 space-y-4">
            {cartData.map(([itemId, detail]) => {
              const productData = products.find((product) => product._id === itemId);
              if (!productData) return null;
              return Object.entries(detail).map(([size, quantity]) => {
                const variant = (productData.variants || []).find((v) => v.name === size);
                const linePrice = variant ? Number(variant.price) || Number(productData.price) : Number(productData.price);
                return (
                <Reveal key={itemId + size}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-gold/15 bg-white/70 p-4 card-lux">
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-linear-to-br from-blush to-sand flex items-center justify-center shrink-0">
                      {productData.image && productData.image[0] ? (
                        <img className="w-full h-full object-cover" src={productData.image[0]} alt="" />
                      ) : (
                        <span className="font-display text-espresso/40 italic text-xs">Sugandhit</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-display text-xl font-medium">{productData.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-ink-soft">
                        <span className="text-xs tracking-luxe uppercase">{productData.subCategory}</span>
                        <span className="w-1 h-1 rounded-full bg-gold" />
                        <span>{size}</span>
                      </div>
                      <p className="font-display text-lg gold-text font-semibold mt-1">{CURRENCY} {linePrice}</p>
                    </div>

                    <div className="flex items-center gap-3 sm:ml-auto">
                      <div className="flex items-center rounded-full border border-gold/30 px-3 py-1">
                        <button onClick={() => updateQuantity(itemId, size, Math.max(1, quantity - 1))} className="px-2.5 text-xl text-ink-soft">−</button>
                        <span className="px-2 min-w-6 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(itemId, size, quantity + 1)} className="px-2.5 text-xl text-ink-soft">+</button>
                      </div>
                      <Trash
                        onClick={() => updateQuantity(itemId, size, 0)}
                        className="w-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </Reveal>
                );
              });
            })}
          </div>

          {/* Totals */}
          <div className="lg:w-96">
            <CartTotal />
            <button onClick={() => navigate('/Place-Order')} className="btn-gold w-full mt-6">Proceed to Checkout</button>
            <button onClick={() => navigate('/collection')} className="w-full mt-3 text-sm text-ink-soft hover:text-espresso transition-colors">
              ← Continue shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart