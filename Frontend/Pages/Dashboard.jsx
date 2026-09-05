import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../Context/ShopContext'
import { toast } from 'react-toastify'
import Title from '../Components/Title'
import Reveal from '../Components/Reveal'

const Dashboard = () => {
  const { backendUrl, token, navigate, userProfile, updateUserProfile, logout } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [custom, setCustom] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '' });
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        address: (userProfile.address && userProfile.address.address) || (typeof userProfile.address === 'string' ? userProfile.address : ''),
        city: (userProfile.address && userProfile.address.city) || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      try {
        const [oRes, cRes] = await Promise.all([
          fetchApi(backendUrl + '/api/order/userorders', { method: 'POST', headers: { token } }),
          fetchApi(backendUrl + '/api/custom-order/userorders', { method: 'POST', headers: { token } }),
        ]);
        if (oRes.success) setOrders(oRes.data?.orders);
        if (cRes.success) setCustom(cRes.data?.orders);
      } catch (error) { console.log(error); }
    };
    fetch();
  }, [token, backendUrl]);

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

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateUserProfile({
      name: form.name,
      phone: form.phone,
      address: { address: form.address, city: form.city },
    });
    setSaving(false);
    if (ok) { setEdit(false); toast.success('Profile updated'); }
  };

  const onChange = (e) => setForm(d => ({ ...d, [e.target.name]: e.target.value }));
  const inputClass = "border border-gold/20 bg-white/80 rounded-xl py-3 px-4 w-full text-sm focus:border-gold transition-colors outline-none";

  return (
    <div className="pt-8 pb-10">
      <Title text1={'My'} text2={'Dashboard'} />

      <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
        <Reveal className="md:col-span-1">
          <div className="rounded-3xl bg-deep text-cream p-6 h-full">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-espresso flex items-center justify-center font-display text-3xl mb-4">
              {(form.name || userProfile?.name || 'S')[0]?.toUpperCase()}
            </div>
            <p className="font-display text-2xl font-semibold">{userProfile?.name || form.name || 'Guest'}</p>
            <p className="text-cream/60 text-sm">{userProfile?.email}</p>
            <button onClick={logout} className="mt-6 w-full py-2.5 rounded-full border border-cream/25 text-sm hover:bg-cream hover:text-ink transition-colors">
              Log Out
            </button>
          </div>
        </Reveal>

        <Reveal delay={80} className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="rounded-3xl bg-gradient-to-br from-gold-soft to-gold text-ink p-6 flex flex-col justify-center">
              <p className="font-display text-4xl font-bold">{activeOrders}</p>
              <p className="text-sm font-medium tracking-wide opacity-80 mt-1">Active / In-progress</p>
            </div>
            <div className="rounded-3xl bg-blush text-espresso p-6 flex flex-col justify-center">
              <p className="font-display text-4xl font-bold">{orders.length + custom.length}</p>
              <p className="text-sm font-medium tracking-wide opacity-80 mt-1">Total orders</p>
            </div>
            <div className="rounded-3xl bg-sand text-espresso p-6 flex flex-col justify-center col-span-2">
              <p className="text-sm tracking-luxe uppercase opacity-60 mb-1">Lifetime spend</p>
              <p className="font-display text-4xl font-bold gold-text">Rs. {totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Profile */}
      <Reveal className="max-w-4xl mx-auto rounded-3xl border border-gold/15 bg-white/70 p-6 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl font-semibold">Profile</h3>
          {!edit && <button onClick={() => setEdit(true)} className="text-sm text-gold font-medium hover:text-espresso transition-colors">Edit</button>}
        </div>

        {!edit && userProfile ? (
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-ink-soft">
            <p><span className="block text-xs uppercase tracking-wide opacity-60">Name</span>{userProfile.name || '—'}</p>
            <p><span className="block text-xs uppercase tracking-wide opacity-60">Phone</span>{userProfile.phone || '—'}</p>
            <p className="sm:col-span-2"><span className="block text-xs uppercase tracking-wide opacity-60">Address</span>{typeof userProfile.address === 'string' ? userProfile.address : (userProfile.address?.address || '') + (userProfile.address?.city ? ', ' + userProfile.address.city : '') || '—'}</p>
          </div>
        ) : (
          <form onSubmit={onSave} className="grid sm:grid-cols-2 gap-4">
            <input name="name" value={form.name} onChange={onChange} className={inputClass} placeholder="Full name" required />
            <input name="phone" value={form.phone} onChange={onChange} className={inputClass} type="tel" placeholder="Phone" required />
            <input name="address" value={form.address} onChange={onChange} className={inputClass + " sm:col-span-2"} placeholder="Delivery address" required />
            <input name="city" value={form.city} onChange={onChange} className={inputClass} placeholder="City" />
            <div className="sm:col-span-2 flex gap-3">
              <button disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving…' : 'Save Profile'}</button>
              <button type="button" onClick={() => setEdit(false)} className="px-6 rounded-full border border-gold/30 text-sm">Cancel</button>
            </div>
          </form>
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
                  <p className="font-display text-lg gold-text font-semibold">Rs. {Number(o.amount).toLocaleString()}</p>
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