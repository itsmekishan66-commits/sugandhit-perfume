import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../Context/ShopContext'
import { Star } from "lucide-react"
import RelatedProducts from '../Components/RelatedProducts';
import Reveal from '../Components/Reveal';

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [colors, setColors] = useState('100ml');
  const [qty, setQty] = useState(1);

  const sizes = ['100ml', '50ml', '30ml'];

  useEffect(() => {
    const p = products.find(item => item._id === productId);
    if (p) {
      setProductData(p);
      setImage(p.image[0] || '');
    }
  }, [productId, products]);

  const qtyChange = (v) => setQty((q) => Math.max(1, q + v));

  return productData ? (
    <div className="mt-10">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <Reveal direction="left" className="flex flex-col gap-4">
          <div className="img-zoom-wrap rounded-[1.75rem] bg-gradient-to-br from-white to-sand/50 border border-gold/15 flex items-center justify-center min-h-[28rem]">
            {image ? (
              <img className="w-full h-[28rem] object-cover" src={image} alt={productData.name} />
            ) : (
              <div className="flex items-center justify-center">
                <span className="font-display text-espresso/40 italic text-2xl">Sugandhit Signature</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(productData.image || []).slice(0, 4).map((img) => (
              <div
                key={img}
                onClick={() => setImage(img)}
                className={`cursor-pointer rounded-xl overflow-hidden border transition-all ${image === img ? 'border-gold ring-2 ring-gold/30' : 'border-gold/15 hover:border-gold/50'}`}
              >
                <img className="w-full aspect-square object-cover" src={img} alt="" />
              </div>
            ))}
          </div>
        </Reveal>

        {/* Info */}
        <Reveal direction="right" className="flex flex-col justify-start">
          <p className="text-xs tracking-luxe uppercase text-gold">Sugandhit · {productData.category}</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-medium">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 fill-yellow-500" alt="star" />
            ))}
            <p className="text-sm text-ink-soft ml-2">Hand-blended signature</p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <p className="font-display text-3xl gold-text font-bold">{currency} {Number(productData.price)}</p>
            <p className="text-ink-soft line-through text-lg">{Number(productData.price) + 500}</p>
            <span className="text-xs bg-blush text-espresso px-2.5 py-1 rounded-full font-medium">Introductory</span>
          </div>

          <p className="mt-6 text-ink-soft leading-relaxed">{productData.description || 'A hand-blended parfum crafted by our in-house perfumer. Notes are weighed, macerated and matured to deliver a scent that lingers elegantly on the skin.'}</p>

          <div className="mt-8">
            <p className="mb-3 font-medium">Size</p>
            <div className="flex gap-3">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setColors(s)}
                  className={`px-6 py-3 rounded-full border text-sm transition-all ${colors === s ? 'border-ink bg-ink text-cream' : 'border-gold/40 text-ink-soft hover:border-ink'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center rounded-full border border-gold/30 px-3 py-1.5">
              <button onClick={() => qtyChange(-1)} className="px-3 text-xl text-ink-soft">−</button>
              <span className="px-3 text-center min-w-6">{qty}</span>
              <button onClick={() => qtyChange(1)} className="px-3 text-xl text-ink-soft">+</button>
            </div>
            <button
              onClick={() => addToCart(productData._id, colors, qty)}
              className="btn-primary flex-1"
            >
              Add to Cart — {currency} {Number(productData.price) * qty}
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            ✦ Add {qty} × {colors} of {productData.name} to your cart
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