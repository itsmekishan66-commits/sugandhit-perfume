import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '@/components/feedback/toast'
import Title from '@/components/ui/Title'
import Reveal from '@/components/ui/Reveal'
import { profileSchema } from '@/validate/schemas'
import { Bell, BellRing, Camera, Copy, Gift, Heart, Pencil, Star, Tag } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { CURRENCY } from '@/config/constants'
import { fetchUserOrders } from '@/features/orders/orders.service'
import { formatDateTime } from '@/utils/dates'
import type { ApiOrder } from '@/types/common'
import type { ReactNode } from 'react'

const Dashboard = () => {
  const { token, userProfile, updateUserProfile, uploadProfileImage, logout } = useAuth();
  const { products, coupons, notifications, unreadNotifications, markNotificationsRead } = useApp();
  const wishlist = useCart((s) => s.wishlist);
  const toggleWishlist = useCart((s) => s.toggleWishlist);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [custom, setCustom] = useState<ApiOrder[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' });
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchUserOrders(token)
      .then(({ orders: o, customOrders: c }) => {
        setOrders(o);
        setCustom(c);
      })
      .catch((error) => console.log(error));
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p className="font-display text-3xl italic text-ink-soft">Sign in to view your dashboard.</p>
        <button onClick={() => navigate('/login')} className="btn-gold mt-6">Sign in</button>
      </div>
    );
  }

  const totalSpent = [...orders, ...custom].reduce((s, o) => s + Number(o.amount || 0), 0);
  const activeOrders = [...orders, ...custom].filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      showToast(parsed.error.issues[0].message, 'error');
      return;
    }
    setSaving(true);
    const ok = await updateUserProfile({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: { address: parsed.data.address, city: parsed.data.city || '' },
    });
    setSaving(false);
    if (ok) { setEdit(false); showToast('Profile updated', 'success'); }
  };

  const startEdit = () => {
    setForm({
      name: userProfile?.name || '',
      phone: userProfile?.phone || '',
      address: (userProfile?.address && userProfile.address.address) || (typeof userProfile?.address === 'string' ? userProfile.address : ''),
      city: (userProfile?.address && userProfile.address.city) || '',
    });
    setEdit(true);
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ok = await uploadProfileImage(file);
    setUploading(false);
    if (ok) showToast('Profile photo updated', 'success');
    e.target.value = '';
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm(d => ({ ...d, [e.target.name]: e.target.value }));

  const wishlisted = products.filter((item) => wishlist.includes(item._id));

  const notificationMeta: Record<string, { icon: ReactNode; tint: string }> = {
    order: { icon: <Bell />, tint: 'bg-espresso/10 text-espresso' },
    promo: { icon: <Gift />, tint: 'bg-gold/20 text-espresso' },
    sale: { icon: <Tag />, tint: 'bg-blush text-espresso' },
    system: { icon: <Star />, tint: 'bg-sand text-espresso' },
  };

  const copyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Code ${code} copied`, 'success');
    } catch {
      showToast('Could not copy code', 'error');
    }
  };

  return (
    <div className="pt-8 pb-10">
      <Title text1={'My'} text2={'Dashboard'} />

      <div className="grid md:grid-cols-5 gap-6 mb-10 max-w-4xl mx-auto">
        <Reveal className="md:col-span-2">
          <div className="rounded-3xl bg-deep text-cream p-6 h-full flex flex-col">
<div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <label className="group relative block w-16 h-16 shrink-0 cursor-pointer">
                  {userProfile?.image ? (
                    <img src={userProfile.image} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gold/40" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-gold-soft to-gold font-display text-2xl italic text-ink/60 border-2 border-gold/40">
                      {(userProfile?.name || form.name || 'S')[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-espresso text-cream border-2 border-deep shadow-sm transition-transform group-hover:scale-110">
                    <Camera className="w-3 h-3" />
                  </span>
                  {uploading && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-espresso/50 text-cream text-xs">…</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploading} />
                </label>
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold truncate">{userProfile?.name || form.name || 'Guest'}</p>
                  <p className="text-cream/60 text-sm whitespace-nowrap">{userProfile?.email}</p>
                </div>
              </div>
              {!edit && (
                <button onClick={startEdit} className="shrink-0 flex items-center gap-1.5 text-sm text-gold font-medium hover:text-cream transition-colors cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {!edit ? (
              <>
                <div className="mt-0 space-y-3 text-sm text-cream/70 border-t border-cream/15 pt-5">
                  <p><span className="block text-[11px] uppercase tracking-wide opacity-60">Phone</span>{userProfile?.phone || '—'}</p>
                  <p><span className="block text-[11px] uppercase tracking-wide opacity-60">Address</span>{typeof userProfile?.address === 'string' ? userProfile.address : ((userProfile?.address?.address || '') + (userProfile?.address?.city ? ', ' + userProfile.address.city : '')) || '—'}</p>
                </div>
                <button onClick={logout} className="mt-6 w-full py-2.5 rounded-full border border-cream/25 text-sm hover:bg-red-300 hover:text-ink transition-colors cursor-pointer">
                  Log Out
                </button>
              </>
            ) : (
              <form onSubmit={onSave} className="mt-5 space-y-3 border-t border-cream/15 pt-5">
                <input name="name" value={form.name} onChange={onChange} className="bg-ink/20 border border-cream/20 rounded-xl px-3 py-2.5 w-full text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none transition-colors" placeholder="Full name" required />
                <input name="phone" value={form.phone} onChange={onChange} className="bg-ink/20 border border-cream/20 rounded-xl px-3 py-2.5 w-full text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none transition-colors" type="tel" placeholder="Phone" required />
                <input name="address" value={form.address} onChange={onChange} className="bg-ink/20 border border-cream/20 rounded-xl px-3 py-2.5 w-full text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none transition-colors" placeholder="Delivery address" required />
                <input name="city" value={form.city} onChange={onChange} className="bg-ink/20 border border-cream/20 rounded-xl px-3 py-2.5 w-full text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none transition-colors" placeholder="City" />
                <div className="flex gap-2 pt-1">
                  <button disabled={saving} className="flex-1 py-2.5 rounded-full bg-gold text-ink text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save Profile'}</button>
                  <button type="button" onClick={() => setEdit(false)} className="px-5 rounded-full border border-cream/25 text-sm">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </Reveal>

        <Reveal delay={80} className="md:col-span-3">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="rounded-3xl bg-linear-to-br from-gold-soft to-gold text-ink p-6 flex flex-col justify-center">
              <p className="font-display text-4xl font-bold">{activeOrders}</p>
              <p className="text-sm font-medium tracking-wide opacity-80 mt-1">Active / In-progress</p>
            </div>
            <div className="rounded-3xl bg-blush text-espresso p-6 flex flex-col justify-center">
              <p className="font-display text-4xl font-bold">{orders.length + custom.length}</p>
              <p className="text-sm font-medium tracking-wide opacity-80 mt-1">Total orders</p>
            </div>
            <div className="rounded-3xl bg-sand text-espresso p-6 flex flex-col justify-center col-span-2">
              <p className="text-sm tracking-luxe uppercase opacity-60 mb-1">Lifetime spend</p>
              <p className="font-display text-4xl font-bold gold-text">{CURRENCY} {totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Notifications + Wishlist */}
      <div className="grid md:grid-cols-2 gap-6 mb-10 max-w-4xl mx-auto">

        {/* Notifications */}
        <Reveal>
          <div className="rounded-3xl border border-gold/15 bg-white/70 p-6 h-full card-lux">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-gold" />
                <h3 className="font-display text-2xl font-semibold">Notifications</h3>
                {unreadNotifications > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-espresso text-cream text-xs px-2">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {unreadNotifications > 0 && (
                  <button onClick={() => markNotificationsRead()} className="text-sm text-gold font-medium hover:text-espresso transition-colors">
                    Mark all read
                  </button>
                )}
                <button onClick={() => navigate('/notifications')} className="text-sm text-gold font-medium hover:text-espresso transition-colors">
                  View all →
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 mx-auto text-ink-soft opacity-30 mb-2" />
                <p className="text-ink-soft text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                {notifications.slice(0, 8).map((n) => {
                  const meta = notificationMeta[n.type] || notificationMeta.system;
                  return (
                    <div key={n._id} className={`flex items-start gap-3 rounded-2xl border p-3.5 text-sm transition-colors ${n.read ? 'border-gold/10 bg-white/50 opacity-70' : 'border-gold/30 bg-gold/10'}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                        {meta.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{n.title}</p>
                        <p className="text-ink-soft text-xs mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-xs text-ink-soft/60 mt-1.5">{formatDateTime(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold mt-2" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* Wishlist items */}
        <Reveal delay={80}>
          <div className="rounded-3xl border border-gold/15 bg-white/70 p-6 h-full card-lux">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-espresso" />
                <h3 className="font-display text-2xl font-semibold">Saved Scents</h3>
                {wishlisted.length > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold text-ink text-xs px-2">{wishlisted.length}</span>
                )}
              </div>
              {wishlisted.length > 0 && (
                <button onClick={() => navigate('/wishlist')} className="text-sm text-gold font-medium hover:text-espresso transition-colors">View all →</button>
              )}
            </div>

            {wishlisted.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-8 h-8 mx-auto text-ink-soft opacity-30 mb-2" />
                <p className="text-ink-soft text-sm">Your wishlist is empty.</p>
                <button onClick={() => navigate('/collection')} className="btn-gold text-xs px-5 py-2.5 mt-4">Explore Collection</button>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlisted.slice(0, 4).map((item) => (
                  <div key={item._id} className="flex items-center gap-3 rounded-2xl border border-gold/15 bg-white/60 p-3">
                    <button onClick={() => navigate(`/product/${item._id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-linear-to-br from-blush to-sand shrink-0 flex items-center justify-center">
                        {item.image && item.image[0] ? (
                          <img className="w-full h-full object-cover" src={item.image[0]} alt="" />
                        ) : (
                          <span className="font-display text-espresso/40 italic text-[10px]">Sugandhit</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-sm gold-text font-semibold">{CURRENCY} {Number(item.price).toLocaleString()}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      onClick={() => toggleWishlist(item._id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-gold/20 shadow-sm transition-transform hover:scale-110"
                    >
                      <Heart className="w-3.5 h-3.5 fill-espresso text-espresso" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Coupon cards */}
      <Reveal className="max-w-4xl mx-auto rounded-3xl border border-gold/15 bg-white/70 p-6 mb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold" />
            <h3 className="font-display text-2xl font-semibold">Coupons</h3>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-ink-soft hidden md:block">Tap a code to copy and use it at checkout</p>
            <button onClick={() => navigate('/coupons')} className="text-sm text-gold font-medium hover:text-espresso transition-colors">View all →</button>
          </div>
        </div>

        {coupons.length === 0 ? (
          <p className="text-center text-ink-soft py-8 text-sm">No coupons right now — check back soon!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon, i) => (
              <div key={coupon._id} className={`relative overflow-hidden rounded-2xl border border-gold/20 bg-white/70 card-lux ${i > 1 ? 'hidden sm:block' : ''}`}>
                {coupon.image ? (
                  <div className="h-28 overflow-hidden bg-linear-to-br from-blush to-sand">
                    <img className="w-full h-full object-cover" src={coupon.image} alt="" />
                  </div>
                ) : (
                  <div className="h-28 bg-linear-to-br from-gold-soft to-gold flex items-center justify-center">
                    <Gift className="w-9 h-9 text-ink/60" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-display text-lg font-medium leading-snug">{coupon.title}</p>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">{coupon.description}</p>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <p className="font-display text-xl gold-text font-bold">{coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `${CURRENCY} ${coupon.discountValue} off`}</p>
                    <button
                      onClick={() => copyCoupon(coupon.code)}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-gold/50 px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-gold/15 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {coupon.code}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold/10 text-[11px] text-ink-soft">
                    <span>{coupon.minPurchase > 0 ? `Min. spend ${CURRENCY} ${coupon.minPurchase}` : 'No minimum spend'}</span>
                    <span>Valid till {new Date(coupon.validTill).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Reveal>

      {/* Recent orders */}
      <Reveal className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl font-semibold">Recent Orders</h3>
          <button onClick={() => navigate('/orders')} className="text-sm text-gold font-medium hover:text-espresso transition-colors">View all →</button>
        </div>
        <div className="space-y-3">
          {[...custom.slice(0, 3).map(o => ({ type: 'custom', ...o })), ...orders.slice(0, 3).map(o => ({ type: 'order', ...o }))]
            .sort((a, b) => Number(b.date) - Number(a.date))
            .map((o) => (
              <div key={o.type + o._id} className="rounded-2xl border border-gold/15 bg-white/70 p-4 text-sm card-lux">
                <div>
                  <p className="font-display text-lg font-medium">
                    {o.type === 'custom' ? `${o.name} ✦` : (o.items?.[0]?.name || 'Perfume Order')}
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">{new Date(o.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg gold-text font-semibold">{CURRENCY} {Number(o.amount).toLocaleString()}</p>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">{o.status}</p>
                </div>
              </div>
            ))}
          {orders.length === 0 && custom.length === 0 && (
            <p className="text-center text-ink-soft py-10">No orders yet. <button className="text-gold font-medium" onClick={() => navigate('/customize')}>Design your first signature blend →</button></p>
          )}
        </div>
      </Reveal>
    </div>
  );
};

export default Dashboard;