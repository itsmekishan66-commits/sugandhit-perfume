import { lazy, Suspense, useEffect, useState } from "react";
import { backendUrl, currency } from "../../config";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components";
const DashboardCharts = lazy(() => import("./components/DashboardCharts"));

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
  userId?: number;
}

interface Stats {
  products: number;
  orders: number;
  custom: number;
  revenue: number;
  pending: number;
  totalCustomers: number;
  expense: number;
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
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, custom: 0, revenue: 0, pending: 0, totalCustomers: 0, expense: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [products, setProducts] = useState<{ name?: string; category?: string; subCategory?: string; price?: string | number }[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [customs, setCustoms] = useState<ApiOrder[]>([]);
  const [coupons, setCoupons] = useState<{ code?: string; discountType?: string; discountValue?: string | number; active?: boolean }[]>([]);
  const [notifications, setNotifications] = useState<{ type?: string }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, oRes, cRes, cuponRes, notifRes] = await Promise.all([
          fetch(backendUrl + '/api/product/list'),
          fetch(backendUrl + '/api/order/list', { method: 'POST', headers: { token } }),
          fetch(backendUrl + '/api/custom-order/list', { method: 'POST', headers: { token } }),
          fetch(backendUrl + '/api/coupon/admin/list', { method: 'POST', headers: { token } }),
          fetch(backendUrl + '/api/notification/admin/list', { method: 'POST', headers: { token } }),
        ]);

        const pData = await pRes.json();
        const oData = await oRes.json();
        const cData = await cRes.json();
        const couponData = await cuponRes.json();
        const notifData = await notifRes.json();

        const products = pData.products || [];
        const orders: ApiOrder[] = oData.orders || [];
        const customs: ApiOrder[] = cData.orders || [];

        setProducts(products);
        setOrders(orders);
        setCustoms(customs);
        setCoupons(couponData.coupons || []);
        setNotifications(notifData.notifications || []);

        let expenseTotal = 0;
        try {
          const expRes = await fetch(backendUrl + '/api/accounts/expenses/totals', { headers: { token } });
          const expData = await expRes.json();
          if (expData.success) expenseTotal = Number(expData.total || 0);
        } catch (error) {
          console.log(error);
        }

        const allOrders = [...orders, ...customs];

        const deliveredRevenue = allOrders
          .filter((o) => o.status === 'Delivered' || o.status === 'Completed')
          .reduce((s, o) => s + Number(o.amount || 0), 0);

        const pending = allOrders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

        const customerIds = new Set<number>();
        allOrders.forEach((o) => {
          if (o.userId) customerIds.add(o.userId);
        });
        const totalCustomers = customerIds.size;

        setStats({
          products: products.length,
          orders: orders.length,
          custom: customs.length,
          revenue: deliveredRevenue,
          pending,
          totalCustomers,
          expense: expenseTotal,
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

  const formatStat = (value: number, isCurrency?: boolean) => {
    const n = Number(value || 0);
    const prefix = isCurrency ? currency : '';
    if (n < 100000) return `${prefix}${n.toLocaleString()}`;
    return `${prefix}${new Intl.NumberFormat('ne-NP', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;
  };

  const cards = [
    { label: 'Products Live', value: stats.products, tint: 'from-gold-soft to-gold', to: '/list' },
    { label: 'Total Orders', value: stats.orders, tint: 'from-blush to-sand', to: '/orders' },
    { label: 'Custom Blends', value: stats.custom, tint: 'from-sand to-blush', to: '/custom-orders' },
    { label: 'In Progress', value: stats.pending, tint: 'from-espresso to-ink', to: '/orders' },
    { label: 'Total Sales', value: stats.revenue, tint: 'from-gold-soft to-blush', to: '/orders', isCurrency: true },
    { label: 'Total Expenses', value: stats.expense, tint: 'from-sand to-ink', to: '/accounts', isCurrency: true },
    { label: 'Total Customers', value: stats.totalCustomers, tint: 'from-blush to-espresso', to: '/accounts' },
  ];

return (
    <div>
      <PageHeader title="Sugandhit Studio" subtitle="Overview of your perfume boutique" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className={`flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${c.tint} p-4 text-[#2b1d16] shadow-sm transition-transform hover:-translate-y-1`}>
            <p className="font-display text-3xl font-bold leading-tight tabular-nums" title={c.isCurrency ? `${currency}${Number(c.value).toLocaleString()}` : String(c.value)}>
              {formatStat(c.value, c.isCurrency)}
            </p>
            <p className="mt-2 truncate text-sm font-medium opacity-80">{c.label}</p>
          </Link>
        ))}
      </div>

      <Suspense
        fallback={
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            {[0, 1].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-gold/15 bg-sand/40" />
            ))}
          </div>
        }
      >
        <DashboardCharts
          products={products}
          orders={orders}
          customs={customs}
          coupons={coupons}
          notifications={notifications}
          revenue={stats.revenue}
        />
      </Suspense>

      <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 shadow-sm">
        <p className="font-display text-2xl font-semibold text-ink mb-2">Recent Orders</p>
        <div className="flex-1">
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