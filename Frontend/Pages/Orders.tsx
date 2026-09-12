import { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../Context/ShopContextObject'
import Title from '../Components/Title'
import Reveal from '../Components/Reveal'

interface ApiOrder {
  _id: string;
  date: number;
  status: string;
  amount: number;
  name?: string;
  items?: { name: string }[];
}

interface OrderDisplay {
  type: 'custom' | 'order';
  _id: string;
  date: number;
  status: string;
  name: string;
  amount: number;
}

const Orders = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [customOrders, setCustomOrders] = useState<ApiOrder[]>([]);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!token) return;
    const fetchOrders = async () => {
      try {
        const [oRes, cRes] = await Promise.all([
          fetch(backendUrl + '/api/order/userorders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', token }
          }),
          fetch(backendUrl + '/api/custom-order/userorders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', token }
          }),
        ]);
        const oData = await oRes.json();
        const cData = await cRes.json();
        if (oData.success) setOrders(oData.orders);
        if (cData.success) setCustomOrders(cData.orders);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOrders();
  }, [token, backendUrl]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p className="font-display text-3xl italic text-ink-soft">Sign in to see your orders.</p>
        <button onClick={() => navigate('/login')} className="btn-gold mt-6">Sign in</button>
      </div>
    );
  }

  const allOrders: OrderDisplay[] = [
    ...customOrders.map(o => ({ type: 'custom' as const, _id: o._id, date: o.date, status: o.status, name: `${o.name} ✦ Custom`, amount: o.amount })),
    ...orders.map(o => ({ type: 'order' as const, _id: o._id, date: o.date, status: o.status, name: (o.items || [])[0]?.name || 'Order', amount: o.amount })),
  ].sort((a, b) => b.date - a.date);

  const shown = tab === 'all' ? allOrders : tab === 'custom' ? allOrders.filter(o => o.type === 'custom') : allOrders.filter(o => o.type === 'order');

  const statusStyle = (s: string) => {
    const map: Record<string, string> = {
      'Order placed': 'bg-gold/15 text-espresso',
      'Packing': 'bg-sand text-espresso',
      'Shipped': 'bg-blush text-espresso',
      'Out for delivery': 'bg-gold/25 text-espresso',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-sand text-ink-soft';
  };

  return (
    <div className="pt-2 min-h-[60vh]">
      <Title text1={'My'} text2={'Orders'} />
      <div className="flex gap-3 mb-6 justify-center">
        {[['all', 'All'], ['order', 'Perfumes'], ['custom', 'Custom Blends']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-5 py-2 rounded-full text-sm uppercase tracking-wide transition-colors ${tab === v ? 'bg-ink text-cream' : 'bg-white/70 border border-gold/20 text-ink-soft hover:border-ink'}`}>
            {l}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-ink-soft py-24">No orders yet. {tab !== 'custom' ? 'Browse the collection' : 'Compose your signature scent'} ✨</p>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {shown.map((order, i) => (
            <Reveal key={order._id} delay={i * 40}>
              <div className="rounded-2xl border border-gold/15 bg-white/70 p-5 card-lux">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-display text-xl font-medium">{order.name}</p>
                    <p className="text-xs text-ink-soft mt-1">{new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${statusStyle(order.status)}`}>{order.status}</span>
                    <p className="font-display text-xl gold-text font-semibold">Rs. {Number(order.amount).toLocaleString()}</p>
                  </div>
                </div>
                {order.type === 'custom' && (
                  <p className="text-xs tracking-luxe uppercase text-gold mt-3">Signature Studio · hand-blended for you</p>
                )}
                <div className="flex gap-2 mt-4">
                  {order.type === 'custom' ? (
                    <button onClick={() => navigate('/customize')} className="btn-gold text-xs px-5 py-2 rounded-full">Design another</button>
                  ) : (
                    <button onClick={() => navigate('/collection')} className="btn-primary text-xs px-5 py-2 rounded-full">Shop more</button>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders