import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '@/components/feedback/toast'
import Title from '@/components/ui/Title'
import Reveal from '@/components/ui/Reveal'
import { customAddressSchema } from '@/validate/schemas'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { CUSTOM_BLEND_DELIVERY_FEE } from '@/config/constants'
import { placeCustomOrder } from '../customization.service'
import { LAYERS, MAX_NOTES_PER_LAYER, SIZE_CONFIG } from '../customization.types'
import type { LayerKey, LayerSelection } from '../customization.types'
import type { Note, PaletteBase } from '@/types/product'

const CustomPerfume = () => {
  const { palette } = useApp();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<LayerSelection>({ top: [], heart: [], base: [] });
  const [baseOverride, setBaseOverride] = useState<PaletteBase | null>(null);
  const [size, setSize] = useState(SIZE_CONFIG[1]);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState({ name: '', phone: '', address: '', city: '' });
  const [placing, setPlacing] = useState(false);

  const base = baseOverride ?? ((palette.bases && palette.bases.length) ? palette.bases[0] : null);

  const toggleNote = (layer: LayerKey, note: Note) => {
    setSelected(prev => {
      const list = prev[layer];
      if (list.some(n => n.id === note.id)) {
        return { ...prev, [layer]: list.filter(n => n.id !== note.id) };
      }
      if (list.length >= MAX_NOTES_PER_LAYER) {
        showToast(`You can pick up to ${MAX_NOTES_PER_LAYER} notes per layer`, 'info');
        return prev;
      }
      return { ...prev, [layer]: [...list, note] };
    });
  };

  const totalPrice = useMemo(() => {
    return size.price + (base ? (base.extraPrice || 0) : 0);
  }, [size, base]);

  const canPlace = selected.top.length > 0 && selected.heart.length > 0 && selected.base.length > 0 && base;

  const placeOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) { showToast('Please sign in first', 'error'); navigate('/login'); return; }
    if (!canPlace) { showToast('Pick at least one note from each layer and a base.', 'error'); return; }
    const parsedAddress = customAddressSchema.safeParse(address);
    if (!parsedAddress.success) { showToast(parsedAddress.error.issues[0].message, 'error'); return; }

    setPlacing(true);
    try {
      const res = await placeCustomOrder(token, {
        name: label || 'My Signature Blend',
        bottleSize: size.ml,
        topNotes: selected.top.map(n => ({ name: n.name, icon: n.icon, color: n.color })),
        heartNotes: selected.heart.map(n => ({ name: n.name, icon: n.icon, color: n.color })),
        baseNotes: selected.base.map(n => ({ name: n.name, icon: n.icon, color: n.color })),
        perfumeBase: base.code,
        strength: base.code,
        strengthName: base.name,
        customLabel: label,
        amount: totalPrice + CUSTOM_BLEND_DELIVERY_FEE,
        address,
      });
      if (res.success) {
        showToast('Your signature blend has been added to the bench! ✨', 'success');
        navigate('/orders');
      } else {
        showToast(res.message || 'Order failed', 'error');
      }
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setAddress(d => ({ ...d, [e.target.name]: e.target.value }));

  const inputClass = "border border-gold/20 bg-white/70 rounded-xl py-3 px-4 w-full text-sm focus:border-gold transition-colors outline-none";

  const renderLayer = (layer: (typeof LAYERS)[number]) => {
    const notes = palette[layer.key] || [];
    return (
      <Reveal key={layer.key} direction={layer.key === 'heart' ? 'zoom' : 'up'}>
        <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h3 className="font-display text-2xl font-semibold">{layer.title}</h3>
            <span className="text-xs tracking-luxe uppercase text-gold">pick up to {MAX_NOTES_PER_LAYER}</span>
          </div>
          <p className="text-sm text-ink-soft italic mb-5">{layer.sub}</p>

          <div className="flex flex-wrap gap-3">
            {notes.map((n) => {
              const isOn = selected[layer.key].some(x => x.id === n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggleNote(layer.key, n)}
                  className={`note-dot inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-all ${isOn ? 'selected border-ink bg-ink text-cream' : 'border-gold/30 bg-white hover:border-gold'}`}
                  style={isOn ? { boxShadow: `0 10px 25px -10px ${n.color}` } : {}}
                >
                  <span>{n.icon}</span>
                  <span>{n.name}</span>
                  {isOn && <span className="text-gold-soft">✓</span>}
                </button>
              );
            })}
            {notes.length === 0 && <p className="text-sm text-ink-soft">Loading notes…</p>}
          </div>

          {selected[layer.key].length > 0 && (
            <div className="mt-5 bg-sand/50 rounded-xl p-3.5 text-sm text-ink-soft">
              <span className="font-medium text-ink">Your layers: </span>
              {selected[layer.key].map((n, i) => (
                <span key={n.id}>&quot;{n.name}&quot;{i < selected[layer.key].length - 1 ? ' + ' : ''}</span>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    );
  };

  return (
    <div className="pt-2 pb-16">
      <Title text1={'Signature'} text2={'Perfume Studio'} />
      <p className="text-center text-ink-soft max-w-xl mx-auto -mt-6 mb-10">
        Compose your scent in three layers, choose your base, and we&apos;ll hand-blend it
        fresh — just for you.
      </p>

      {!token && (
        <Reveal className="max-w-lg mx-auto mb-10 rounded-2xl bg-linear-to-r from-espresso to-ink text-cream p-6 text-center">
          <p className="font-display text-2xl">Sign in to save your blend & order.</p>
          <button onClick={() => navigate('/login')} className="btn-gold mt-4">Sign in / Register</button>
        </Reveal>
      )}

      <div className="relative">
        {!token && (
          <div className="absolute inset-0 z-20 cursor-not-allowed backdrop-blur-[1px] bg-white/10 rounded-2xl" />
        )}
      <form onSubmit={placeOrder} className={`grid lg:grid-cols-[1fr_360px] gap-8 items-start transition ${!token ? 'blur-[1px] select-none opacity-85 pointer-events-none' : ''}`}>
        <div>
          {LAYERS.map(layer => renderLayer(layer))}

          {/* Base & size */}
          <Reveal>
            <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 mb-6">
              <h3 className="font-display text-2xl font-semibold mb-1">Perfume Base</h3>
              <p className="text-sm text-ink-soft italic mb-5">This decides how your perfume wears on skin.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {(palette.bases || []).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBaseOverride(b)}
                    className={`text-left rounded-xl border p-4 transition-all ${base?.id === b.id ? 'border-ink bg-ink text-cream' : 'border-gold/25 bg-white hover:border-gold'}`}
                  >
                    <p className="font-medium">{b.name}</p>
                    <p className={`text-xs mt-1 ${base?.id === b.id ? 'text-cream/70' : 'text-ink-soft'}`}>{b.description}</p>
                    <p className={`text-sm font-semibold mt-2 ${base?.id === b.id ? 'text-gold-soft' : 'gold-text'}`}>
                      {Number(b.extraPrice) > 0 ? `+ Rs. ${b.extraPrice}` : 'Included'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 mb-6">
              <h3 className="font-display text-2xl font-semibold mb-1">Bottle Size</h3>
              <p className="text-sm text-ink-soft italic mb-5">Choose the size of your personal bottle.</p>
              <div className="grid grid-cols-3 gap-3">
                {SIZE_CONFIG.map((s) => (
                  <button
                    key={s.ml}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`text-center rounded-xl border p-4 transition-all ${size.ml === s.ml ? 'border-ink bg-ink text-cream' : 'border-gold/25 bg-white hover:border-gold'}`}
                  >
                    <p className="font-display text-xl font-semibold">{s.label}</p>
                    <p className={`text-xs mt-1 ${size.ml === s.ml ? 'text-cream/70' : 'text-ink-soft'}`}>{s.desc}</p>
                    <p className={`text-sm font-semibold mt-2 ${size.ml === s.ml ? 'text-gold-soft' : 'gold-text'}`}>Rs. {s.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 mb-6">
              <h3 className="font-display text-2xl font-semibold mb-1">Personal Label <span className="text-sm text-ink-soft font-normal">(optional)</span></h3>
              <p className="text-sm text-ink-soft italic mb-5">We&apos;ll print up to 24 characters on your bottle.</p>
              <input maxLength={24} value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="e.g. My Oud Affair" />
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-gold/15 bg-white/70 p-6">
              <h3 className="font-display text-2xl font-semibold mb-4">Delivery Details</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required name="name" value={address.name} onChange={onChange} className={inputClass} placeholder="Full name" />
                <input required name="phone" value={address.phone} onChange={onChange} className={inputClass} type="tel" placeholder="Phone" />
                <input required name="address" value={address.address} onChange={onChange} className={inputClass + " sm:col-span-2"} placeholder="Delivery address" />
                <input name="city" value={address.city} onChange={onChange} className={inputClass} placeholder="City (optional)" />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-28">
          <Reveal direction="right" className="rounded-[1.75rem] bg-deep text-cream p-6 shadow-2xl shadow-espresso/30">
            <p className="text-gold tracking-luxe uppercase text-xs mb-4">Your Blend</p>
            <div className="space-y-4 text-sm">
              {LAYERS.map(layer => {
                const pick = selected[layer.key];
                return (
                  <div key={layer.key}>
                    <p className="text-cream/50 uppercase tracking-wide text-[11px]">{layer.key} \u00b7 {pick.length}/{MAX_NOTES_PER_LAYER}</p>
                    <p className="font-display text-lg mt-0.5">
                      {pick.length ? pick.map(n => n.icon + ' ' + n.name).join('  ') : <span className="italic text-cream/40">choose {layer.key} note...</span>}
                    </p>
                  </div>
                );
              })}
              <hr className="border-cream/10" />
              <div className="flex justify-between"><span className="text-cream/60">Base</span><span>{base ? base.name : '\u2014'}</span></div>
              <div className="flex justify-between"><span className="text-cream/60">Size</span><span>{size.label}</span></div>
              {label && <div className="flex justify-between"><span className="text-cream/60">Label</span><span className="italic gold-text">&quot;{label}&quot;</span></div>}
              <hr className="border-cream/10" />
              <div className="flex justify-between items-baseline">
                <span className="text-cream/60">Blend value</span>
                <span className="font-display text-3xl gold-text font-semibold">Rs. {totalPrice}</span>
              </div>
              <div className="flex justify-between text-xs text-cream/50">
                <span>Delivery</span><span>Rs. 100</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={placing || !canPlace}
              className="btn-gold w-full mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {placing ? 'Sending to the bench...' : `Order My Blend \u2014 Rs. ${totalPrice + CUSTOM_BLEND_DELIVERY_FEE}`}
            </button>
            <p className="text-[11px] text-cream/40 text-center mt-3">Blended fresh on order \u00b7 COD available</p>
          </Reveal>
        </div>
      </form>
      </div>
    </div>
  );
};

export default CustomPerfume;