import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star } from "lucide-react"
import RelatedProducts from '@/components/product/RelatedProducts';
import Reveal from '@/components/ui/Reveal';
import { useApp } from '@/context/AppContext';
import { useCart } from '@/context/CartContext';
import { CURRENCY } from '@/config/constants';

const Product = () => {
  const { productId } = useParams();
  const { products } = useApp();
  const addToCart = useCart((s) => s.addToCart);
  const [imageState, setImageState] = useState<{ id: string | null; src: string }>({ id: null, src: '' });
  const [colors, setColors] = useState('100ml');
  const [variantName, setVariantName] = useState('');
  const [qty, setQty] = useState(1);

  const sizes = ['100ml', '50ml', '30ml'];

  const productData = useMemo(() => products.find(item => item._id === productId) || null, [products, productId]);
  const rating = Number(productData?.rating) || 0;
  const reviews = productData?.reviews || 0;

  const variants = productData?.variants || [];
  const activeVariant = variants.find((v) => v.name === (variantName || '')) || variants[0];

  const unitPrice = activeVariant ? Number(activeVariant.price) || Number(productData?.price || 0) : Number(productData?.price || 0);
  const image = imageState.id === productId ? imageState.src : (activeVariant?.image || productData?.image?.[0] || '');
  const selectedOption = activeVariant ? activeVariant.name : colors;

  const qtyChange = (v: number) => setQty((q) => Math.max(1, q + v));
  const selectVariant = (v: { name: string; image: string }) => {
    setVariantName(v.name);
    if (v.image) setImageState({ id: productId ?? null, src: v.image });
  };

  const isPopular = productData?.popular ?? (productId ? String(productId).charCodeAt(String(productId).length - 1) % 3 === 0 : false);

  return productData ? (
    <div className="mt-10">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <Reveal direction="left" className="relative flex flex-col gap-4">
          {isPopular && (
            <span className="award-badge-lg">
              Popular
            </span>
          )}
          <div className="img-zoom-wrap relative rounded-[1.75rem] bg-gradient-to-br from-white to-sand/50 border border-gold/15 flex items-center justify-center min-h-[28rem]">
            {image ? (
              <img className="w-full h-[28rem] object-cover" src={image} alt={productData.name} />
            ) : (
              <div className="flex items-center justify-center">
                <span className="font-display text-espresso/40 italic text-2xl">Sugandhit Signature</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(productData.image || []).slice(0, 8).map((img) => (
              <div
                key={img}
                onClick={() => setImageState({ id: productId ?? null, src: img })}
                className={`cursor-pointer rounded-xl overflow-hidden border transition-all ${image === img ? 'border-gold ring-2 ring-gold/30' : 'border-gold/15 hover:border-gold/50'}`}
              >
                <img className="w-full aspect-square object-cover" src={img} alt="" />
              </div>
            ))}
          </div>
        </Reveal>

        {/* Info */}
        <Reveal direction="right" className="flex flex-col justify-start">
          <div className="flex items-center gap-3">
            <p className="text-xs tracking-luxe uppercase text-gold">Sugandhit · {productData.category}</p>
            {(productData.badge || productData.bestseller) && (
              <span className="text-[0.6rem] tracking-luxe uppercase px-3 py-1 rounded-full bg-espresso text-cream">{productData.badge || 'Bestseller'}</span>
            )}
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-medium">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 ${i < Math.round(rating) ? 'fill-gold text-gold' : 'text-gold/30'}`} />
            ))}
            <p className="text-sm text-ink-soft ml-2">{rating.toFixed(1)} · {reviews} reviews</p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <p className="font-display text-3xl gold-text font-bold">{CURRENCY} {unitPrice}</p>
            <p className="text-ink-soft line-through text-lg">{Number(productData.price) + 500}</p>
            <span className="text-xs bg-blush text-espresso px-2.5 py-1 rounded-full font-medium">Introductory</span>
          </div>

          <p className="mt-6 text-ink-soft leading-relaxed">{productData.description || 'A hand-blended parfum crafted by our in-house perfumer. Notes are weighed, macerated and matured to deliver a scent that lingers elegantly on the skin.'}</p>

          <div className="mt-8">
            <p className="mb-3 font-medium">{variants.length ? 'Variant' : 'Size'}</p>
            <div className="flex flex-wrap gap-3">
              {variants.length
                ? variants.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => selectVariant(v)}
                      className={`px-5 py-3 rounded-full border text-sm transition-all ${activeVariant?.name === v.name ? 'border-ink bg-ink text-cream' : 'border-gold/40 text-ink-soft hover:border-ink'}`}
                    >
                      {v.name}
                      {v.price !== '' && <span className="ml-1 opacity-80">· {CURRENCY} {Number(v.price)}</span>}
                    </button>
                  ))
                : sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setColors(s)}
                      className={`px-6 py-3 rounded-full border text-sm transition-all ${colors === s ? 'border-ink bg-ink text-cream' : 'border-gold/40 text-ink-soft hover:border-ink'}`}
                    >
                      {s}
                    </button>
                  ))}
            </div>
            {activeVariant?.description && (
              <p className="mt-3 text-xs text-ink-soft">{activeVariant.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center rounded-full border border-gold/30 px-3 py-1.5">
              <button onClick={() => qtyChange(-1)} className="px-3 text-xl text-ink-soft">−</button>
              <span className="px-3 text-center min-w-6">{qty}</span>
              <button onClick={() => qtyChange(1)} className="px-3 text-xl text-ink-soft">+</button>
            </div>
            <button
              onClick={() => addToCart(productData._id, selectedOption, qty)}
              className="btn-primary flex-1"
            >
              Add to Cart — {CURRENCY} {unitPrice * qty}
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            ✦ Add {qty} × {selectedOption} of {productData.name} to your cart
          </p>

          <hr className="mt-8 border-gold/15" />
          <div className="flex flex-col gap-2 text-sm text-ink-soft mt-5">
            <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-gold" /> 100% original, hand-mixed in our studio</p>
            <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-gold" /> Ships in signature Sugandhit packaging</p>
            <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-gold" /> Blended fresh when you order</p>
          </div>
        </Reveal>
      </div>

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (
    <div className="py-40 text-center text-ink-soft font-display text-2xl italic">Bottling your page…</div>
  );
};

export default Product