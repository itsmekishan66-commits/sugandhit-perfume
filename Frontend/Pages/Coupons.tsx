import { useContext, useState } from 'react'
import { ShopContext, type Coupon } from '../Context/ShopContextObject'
import Title from '../Components/Title'
import Reveal from '../Components/Reveal'
import { Check, Copy, Gift, Tag } from 'lucide-react'

const CouponsPage = () => {
  const { coupons, navigate } = useContext(ShopContext);
  const [copied, setCopied] = useState<string | null>(null);

  const formatTill = (ts: number) => new Date(Number(ts)).toLocaleDateString();

  const copyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const discountLabel = (c: Coupon) => {
    if (c.discountType === 'percent') return `${c.discountValue}% OFF`;
    return `Rs. ${c.discountValue} OFF`;
  };

  return (
    <div className="pt-2 min-h-[70vh] flex flex-col">
      <Title text1={'Coupons'} text2={'& Offers'} />

      <div className="w-full max-w-4xl mx-auto">
        <Reveal className="flex items-center justify-center gap-2 text-ink-soft text-sm mb-8">
          <Tag className="w-4 h-4 text-gold" />
          <span>Collect codes at checkout — apply them in your cart to unlock savings.</span>
        </Reveal>

        {coupons.length === 0 ? (
          <Reveal className="rounded-3xl border border-gold/15 bg-white/70 p-12 text-center">
            <Gift className="w-9 h-9 mx-auto text-ink-soft opacity-30 mb-3" />
            <p className="font-display text-2xl italic text-ink-soft">No offers right now</p>
            <button onClick={() => navigate('/collection')} className="btn-gold text-xs px-6 py-2.5 mt-6">Shop the collection</button>
          </Reveal>
        ) : (
<div className="grid gap-5 sm:grid-cols-2">
            {coupons.map((c, i) => (
              <Reveal key={c._id} delay={i * 60}>
                <div className="h-full overflow-hidden rounded-3xl border border-gold/20 bg-white/80 card-lux flex flex-col">
                  {c.image ? (
                    <div className="h-36 shrink-0" style={{ backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  ) : (
                    <div className="h-36 shrink-0 bg-gradient-to-br from-gold-soft to-gold flex items-center justify-center">
                      <Gift className="w-12 h-12 text-ink/60" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-2xl italic gold-text tracking-luxe">{discountLabel(c)}</span>
                      <span className="rounded-full bg-espresso text-cream text-xs px-3 py-1">{c.code}</span>
                    </div>

                    <div className="flex-1">
                      <p className="font-display text-xl font-semibold text-ink leading-snug">{c.title || 'Sugandhit Offer'}</p>
                      {c.description && <p className="text-sm text-ink-soft mt-1 leading-relaxed">{c.description}</p>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft">
                      <span>Min. spend: Rs. {c.minPurchase}</span>
                      <span>Valid till: {formatTill(c.validTill)}</span>
                    </div>

                    <button
                      onClick={() => copyCoupon(c.code)}
                      className="btn-gold text-xs px-5 py-2.5 w-full flex items-center justify-center gap-2"
                    >
                      {copied === c.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied === c.code ? 'Copied!' : 'Copy code'}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 text-sm text-ink-soft hover:text-espresso transition-colors">
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponsPage

