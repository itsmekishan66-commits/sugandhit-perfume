import { useEffect, useState } from "react";
import { backendUrl, currency } from "../config";
import { Link } from "react-router-dom";

interface DashboardProps {
  token: string;
}

interface ApiOrder {
  _id?: string;
  name?: string;
  items?: { name?: string }[];
  status?: string;
  amount?: string | number;
  date?: string | number;
}

interface Stats {
  products: number;
  orders: number;
  custom: number;
  revenue: number;
  pending: number;
}

interface RecentItem {
  type: string;
  _id?: string;
  name?: string;
  items?: { name?: string }[];
  amount?: string | number;
  date?: string | number;
}

const Dashboard = ({ token }: DashboardProps) => {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, custom: 0, revenue: 0, pending: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, oRes, cRes] = await Promise.all([
          fetch(backendUrl + '/api/product/list'),
          fetch(backendUrl + '/api/order/list', { headers: { token } }),
          fetch(backendUrl + '/api/custom-order/list', { headers: { token } }),
        ]);

        const pData = await pRes.json();
        const oData = await oRes.json();
        const cData = await cRes.json();

        const products = pData.products || [];
        const orders: ApiOrder[] = oData.orders || [];
        const customs: ApiOrder[] = cData.orders || [];

        const revenue = [...orders, ...customs]
          .filter((o) => o.status !== 'Cancelled')
          .reduce((s, o) => s + Number(o.amount || 0), 0);

        const pending = [...orders, ...customs].filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

        setStats({
          products: products.length,
          orders: orders.length,
          custom: customs.length,
          revenue,
          pending,
        });

        setRecent(
          [...customs.map((c) => ({ ...c, type: 'custom' })), ...orders.map((o) => ({ ...o, type: 'order' }))]
            .sort((a, b) => Number(b.date) - Number(a.date))
            .slice(0, 5)
        );
      } catch (error) {
        console.log(error);
      }
    };
    fetchAll();
  }, [token]);

  const cards = [
    { label: 'Products Live', value: stats.products, tint: 'from-gold-soft to-gold', to: '/list' },
    { label: 'Total Orders', value: stats.orders, tint: 'from-blush to-sand', to: '/orders' },
    { label: 'Custom Blends', value: stats.custom, tint: 'from-sand to-blush', to: '/custom-orders' },
    { label: 'In Progress', value: stats.pending, tint: 'from-espresso to-ink', to: '/orders' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-4xl font-semibold text-ink">Sugandhit Studio</h1>
        <p className="text-ink-soft mt-1">Overview of your perfume boutique</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className={`rounded-2xl bg-gradient-to-br ${c.tint} p-5 text-[#2b1d16] shadow-sm transition-transform hover:-translate-y-1`}>
            <p className="font-display text-4xl font-bold">{c.value}</p>
            <p className="text-sm font-medium opacity-80 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 shadow-sm">
          <p className="font-display text-2xl font-semibold text-ink mb-4">Revenue</p>
          <p className="font-display text-5xl font-bold gold-text">{currency}{stats.revenue.toLocaleString()}</p>
          <p className="text-xs text-ink-soft mt-2">Sum of non-cancelled orders & custom blends</p>
        </div>

        <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 shadow-sm">
          <p className="font-display text-2xl font-semibold text-ink mb-4">Recent Orders</p>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-soft">No activity yet. Add products to start selling.</p>
          ) : (
            <ul className="divide-y divide-gold/10 text-sm">
              {recent.map((o) => (
                <li key={o.type + (o._id || '')} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{o.type === 'custom' ? (o.name || '') + ' ✦' : o.items?.[0]?.name || 'Order'}</p>
                    <p className="text-xs text-ink-soft">{new Date(o.date as string | number).toLocaleDateString()}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-ink">{currency}{Number(o.amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;