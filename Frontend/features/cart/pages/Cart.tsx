import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash } from "lucide-react"
import Title from '@/components/ui/Title';
import CartTotal from '@/components/cart/CartTotal';
import Reveal from '@/components/ui/Reveal';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { CURRENCY } from '@/config/constants';
import { LAYERS } from '@/features/customization/customization.types';
import type { CustomBlendCartItem } from '@/types/common';

type CartTab = 'all' | 'perfumes' | 'blends';

const BlendCard = ({
  blend,
  bottleImage,
  onQtyChange,
  onRemove,
}: {
  blend: CustomBlendCartItem;
  bottleImage?: string;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}) => (
  <Reveal>
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-gold/15 bg-white/70 p-4 card-lux">
      <div className="w-20 h-24 rounded-xl overflow-hidden bg-linear-to-br from-blush to-sand flex items-center justify-center shrink-0">
        {bottleImage
          ? <img src={bottleImage} alt={`${blend.bottleTypeName || blend.bottleType} bottle`} loading="lazy" className="w-full h-full object-cover" />
          : <span className="font-display text-espresso/40 italic text-xs">Blend</span>}
      </div>

      <div className="flex-1 w-full">
        <p className="font-display text-xl font-medium">{blend.name}</p>
        <div className="flex items-center gap-2 mt-1 text-sm text-ink-soft">
          <span className="text-xs tracking-luxe uppercase">Custom Blend</span>
          <span className="w-1 h-1 rounded-full bg-gold" />
          <span>{blend.bottleSize}</span>
          {blend.bottleTypeName && (
            <>
              <span className="w-1 h-1 rounded-full bg-gold" />
              <span>{blend.bottleTypeName}</span>
            </>
          )}
        </div>
        <div className="mt-3 space-y-1">
          {LAYERS.map((layer) => {
            const pick = blend[`${layer.key}Notes` as const] || [];
            return (
              <p key={layer.key} className="text-xs text-ink-soft">
                <span className="tracking-luxe uppercase text-[10px] text-gold">{layer.key}</span>{' '}
                {pick.length ? pick.map(n => `${n.icon} ${n.name}`).join('  ') : '—'}
              </p>
            );
          })}
        </div>
        <p className="text-xs text-ink-soft mt-2">
          <span className="tracking-luxe uppercase text-[10px] text-gold">Base</span> {blend.strengthName}
        </p>
        {blend.customLabel && (
          <p className="text-xs text-ink-soft mt-1">
            <span className="tracking-luxe uppercase text-[10px] text-gold">Label</span>{' '}
            <span className="italic">&quot;{blend.customLabel}&quot;</span>
          </p>
        )}
        <p className="font-display text-lg gold-text font-semibold mt-2">
          {CURRENCY} {Number(blend.price) * blend.qty}
          {blend.qty > 1 && <span className="text-xs text-ink-soft font-normal"> ({CURRENCY} {blend.price} each)</span>}
        </p>
      </div>

      <div className="flex items-center gap-3 sm:ml-auto">
        <div className="flex items-center rounded-full border border-gold/30 px-3 py-1">
          <button onClick={() => onQtyChange(blend.qty - 1)} className="px-2.5 text-xl text-ink-soft">−</button>
          <span className="px-2 min-w-6 text-center">{blend.qty}</span>
          <button onClick={() => onQtyChange(blend.qty + 1)} className="px-2.5 text-xl text-ink-soft">+</button>
        </div>
        <Trash onClick={onRemove} className="w-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  </Reveal>
);

const Cart = () => {
  const { products, palette } = useApp();
  const navigate = useNavigate();
  const cartItems = useCart((s) => s.cartItems);
  const customBlends = useCart((s) => s.customBlends);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const updateCustomBlendQty = useCart((s) => s.updateCustomBlendQty);
  const removeCustomBlend = useCart((s) => s.removeCustomBlend);
  const [tab, setTab] = useState<CartTab>('all');

  const cartData = Object.entries(cartItems).filter(([itemId]) => products.some((p) => p._id === itemId));
  const perfumeLines = cartData.flatMap(([itemId, detail]) => {
    const productData = products.find((product) => product._id === itemId);
    if (!productData) return [];
    return Object.entries(detail)
      .filter(([, quantity]) => quantity > 0)
      .map(([size, quantity]) => ({ itemId, size, quantity, productData }));
  });

  const isEmpty = perfumeLines.length === 0 && customBlends.length === 0;
  const showPerfumes = tab === 'all' || tab === 'perfumes';
  const showBlends = tab === 'all' || tab === 'blends';

  const perfumeCount = perfumeLines.reduce((sum, line) => sum + line.quantity, 0);
  const blendCount = customBlends.reduce((sum, blend) => sum + blend.qty, 0);

  const tabs: [CartTab, string, number][] = [
    ['all', 'All', perfumeCount + blendCount],
    ['perfumes', 'Perfumes', perfumeCount],
    ['blends', 'Custom Blends', blendCount],
  ];

  return (
    <div className="pt-2 min-h-[60vh]">
      <Title text1={'Your'} text2={'Cart'} />

      {isEmpty ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl italic text-ink-soft">Your cart is empty…</p>
          <p className="text-ink-soft mt-3">Explore our collection or compose your own scent.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button onClick={() => navigate('/collection')} className="btn-primary">Explore Collection</button>
            <button onClick={() => navigate('/customize')} className="btn-gold">Build a Custom Perfume</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-6 justify-center flex-wrap">
            {tabs.map(([value, label, count]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-5 py-2 rounded-full text-sm uppercase tracking-wide transition-colors ${tab === value ? 'bg-ink text-cream' : 'bg-white/70 border border-gold/20 text-ink-soft hover:border-ink'}`}
              >
                {label} <span className="opacity-60">({count})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-10 mt-4">
            {/* Items */}
            <div className="flex-1 space-y-4">
              {showPerfumes && perfumeLines.map(({ itemId, size, quantity, productData }) => {
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
              })}

              {showPerfumes && perfumeLines.length === 0 && (
                <p className="text-center text-ink-soft border border-dashed border-gold/25 rounded-2xl py-10">
                  No perfumes in your cart.
                </p>
              )}

              {showBlends && customBlends.map((blend) => (
                <BlendCard
                  key={blend.key}
                  blend={blend}
                  bottleImage={palette.bottleTypes?.find(t => t.code === blend.bottleType)?.image}
                  onQtyChange={(qty) => updateCustomBlendQty(blend.key, qty)}
                  onRemove={() => removeCustomBlend(blend.key)}
                />
              ))}

              {showBlends && customBlends.length === 0 && (
                <p className="text-center text-ink-soft border border-dashed border-gold/25 rounded-2xl py-10">
                  No custom blends yet — <button onClick={() => navigate('/customize')} className="text-gold underline">compose one</button>.
                </p>
              )}
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
        </>
      )}
    </div>
  );
};

export default Cart
