import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Title from '@/components/ui/Title'
import Reveal from '@/components/ui/Reveal'
import Loading from '@/components/ui/Loading'
import Pagination from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { fetchUserOrders } from '../orders.service'
import type { ApiCustomOrder, ApiOrder } from '@/types/common'
import { CURRENCY } from '@/config/constants'

type OrderTab = 'all' | 'perfumes' | 'blends';

const NoteLayer = ({ title, notes }: { title: string; notes?: { name: string; icon: string; color: string }[] }) => (
  notes && notes.length > 0 ? (
    <div className="mt-2">
      <p className="text-[10px] tracking-luxe uppercase text-gold">{title}</p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {notes.map((note, i) => (
          <span
            key={`${note.name}-${i}`}
            className="text-xs bg-sand/50 border border-gold/20 rounded-full px-2.5 py-1"
          >
            {note.icon} {note.name}
          </span>
        ))}
      </div>
    </div>
  ) : null
);

const statusStyle = (s: string) => {
  const map: Record<string, string> = {
    'Order Placed': 'bg-gold/15 text-espresso',
    'Packing': 'bg-sand text-espresso',
    'Shipped': 'bg-blush text-espresso',
    'Out For Delivery': 'bg-gold/25 text-espresso',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-700',
  };
  return map[s] || 'bg-sand text-ink-soft';
};

const CustomOrderCard = ({ order }: { order: ApiCustomOrder }) => {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/70 p-5 card-lux">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-display text-xl font-medium">{order.name || 'Custom Perfume'} <span className="gold-text">✦</span></p>
          <p className="text-xs text-ink-soft mt-1">{new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${statusStyle(order.status)}`}>{order.status}</span>
          <p className="font-display text-xl gold-text font-semibold">{CURRENCY} {Number(order.amount).toLocaleString()}</p>
        </div>
      </div>

      <p className="text-xs tracking-luxe uppercase text-gold mt-3">Signature Studio · hand-blended for you</p>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs text-ink-soft">
        <p><span className="tracking-luxe uppercase text-[10px] text-gold">Bottle</span> {order.bottleSize || '—'}</p>
        {order.bottleType && (
          <p><span className="tracking-luxe uppercase text-[10px] text-gold">Type</span> {order.bottleType}</p>
        )}
        <p><span className="tracking-luxe uppercase text-[10px] text-gold">Base</span> {order.strengthName || order.strength || order.perfumeBase || '—'}</p>
        {order.customLabel && (
          <p className="sm:col-span-2"><span className="tracking-luxe uppercase text-[10px] text-gold">Label</span> <span className="italic">&quot;{order.customLabel}&quot;</span></p>
        )}
      </div>

      <NoteLayer title="Top Notes" notes={order.topNotes} />
      <NoteLayer title="Heart Notes" notes={order.heartNotes} />
      <NoteLayer title="Base Notes" notes={order.baseNotes} />

      <div className="flex gap-2 mt-4">
        <button onClick={() => navigate('/customize')} className="btn-gold text-xs px-5 py-2 rounded-full">Design another</button>
      </div>
    </div>
  );
};

const Orders = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [customOrders, setCustomOrders] = useState<ApiCustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderTab>('all');
  const [blendPage, setBlendPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchUserOrders(token)
      .then(({ orders: o, customOrders: c }) => {
        if (!active) return;
        setOrders(o);
        setCustomOrders(c);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p className="font-display text-3xl italic text-ink-soft">Sign in to see your orders.</p>
        <button onClick={() => navigate('/login')} className="btn-gold mt-6">Sign in</button>
      </div>
    );
  }

  const sortedOrders = [...orders].sort((a, b) => b.date - a.date);
  const sortedCustom = [...customOrders].sort((a, b) => b.date - a.date);

  const PAGE_SIZE = 20;
  const orderTotalPages = Math.max(1, Math.ceil(sortedOrders.length / PAGE_SIZE));
  const blendTotalPages = Math.max(1, Math.ceil(sortedCustom.length / PAGE_SIZE));
  const orderSafePage = Math.min(orderPage, orderTotalPages);
  const blendSafePage = Math.min(blendPage, blendTotalPages);
  const orderRows = sortedOrders.slice((orderSafePage - 1) * PAGE_SIZE, orderSafePage * PAGE_SIZE);
  const blendRows = sortedCustom.slice((blendSafePage - 1) * PAGE_SIZE, blendSafePage * PAGE_SIZE);

  const tabs: [OrderTab, string, number][] = [
    ['all', 'All', sortedOrders.length + sortedCustom.length],
    ['perfumes', 'Perfumes', sortedOrders.length],
    ['blends', 'Custom Blends', sortedCustom.length],
  ];
  const showOrders = tab === 'all' || tab === 'perfumes';
  const showBlends = tab === 'all' || tab === 'blends';
  const isEmpty = sortedOrders.length === 0 && sortedCustom.length === 0;

  const emptyCopy: Record<OrderTab, { title: string; sub: string }> = {
    all: {
      title: 'No orders yet…',
      sub: 'Orders you place will appear here with live status updates.',
    },
    perfumes: {
      title: 'No perfume orders yet…',
      sub: 'Add something from the collection and it will show up here.',
    },
    blends: {
      title: 'No custom blends yet…',
      sub: 'Compose your signature scent and order it to see it here.',
    },
  };
  const empty = emptyCopy[tab];

  // Message shows when the whole list is empty, or when the active tab has nothing.
  const activeTabEmpty = tab === 'all'
    ? isEmpty
    : tab === 'perfumes'
      ? sortedOrders.length === 0
      : sortedCustom.length === 0;

  return (
    <div className="pt-2 min-h-[60vh]">
      <Title text1={'My'} text2={'Orders'} />
      <div className="flex gap-3 mb-6 justify-center flex-wrap">
        {tabs.map(([v, l, count]) => (
          <button key={v} onClick={() => { setTab(v); setBlendPage(1); setOrderPage(1); }}
            className={`px-5 py-2 rounded-full text-sm uppercase tracking-wide transition-colors ${tab === v ? 'bg-ink text-cream' : 'bg-white/70 border border-gold/20 text-ink-soft hover:border-ink'}`}>
            {l} <span className="opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loading variant="inline" className="w-55 md:w-100" label="Loading orders" />
        </div>
      ) : activeTabEmpty ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl italic text-ink-soft">{empty.title}</p>
          <p className="text-ink-soft mt-3">{empty.sub}</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button onClick={() => navigate('/collection')} className="btn-primary">Explore Collection</button>
            <button onClick={() => navigate('/customize')} className="btn-gold">Build a Custom Perfume</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          {showBlends && blendRows.map((order, i) => (
            <Reveal key={`c-${order._id}`} delay={i * 40}>
              <CustomOrderCard order={order} />
            </Reveal>
          ))}
          {showBlends && (
            <Pagination total={sortedCustom.length} perPage={PAGE_SIZE} page={blendSafePage} onPage={setBlendPage} label="Custom blends" />
          )}
          {showOrders && orderRows.map((order, i) => (
            <Reveal key={`o-${order._id}`} delay={(showBlends ? sortedCustom.length : 0) * 40 + i * 40}>
              <div className="rounded-2xl border border-gold/15 bg-white/70 p-5 card-lux">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-display text-xl font-medium">{(order.items || [])[0]?.name || 'Perfume Order'}</p>
                    <p className="text-xs text-ink-soft mt-1">{new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${statusStyle(order.status)}`}>{order.status}</span>
                    <p className="font-display text-xl gold-text font-semibold">{CURRENCY} {Number(order.amount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate('/collection')} className="btn-primary text-xs px-5 py-2 rounded-full">Shop more</button>
                </div>
              </div>
            </Reveal>
          ))}
          {showOrders && (
            <Pagination total={sortedOrders.length} perPage={PAGE_SIZE} page={orderSafePage} onPage={setOrderPage} label="Orders" />
          )}
        </div>
      )}
    </div>
  );
};

export default Orders
