import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { currency } from '../../../config';

interface ChartOrder {
  items?: { name?: string; price?: string | number; quantity?: string | number }[];
  amount?: string | number;
  status?: string;
  date?: string | number;
}
interface ChartProduct {
  name?: string;
  category?: string;
  subCategory?: string;
  price?: string | number;
}
interface ChartCoupon {
  code?: string;
  discountType?: string;
  discountValue?: string | number;
  active?: boolean;
}
interface ChartNotification {
  type?: string;
}

interface DashboardChartsProps {
  products: ChartProduct[];
  orders: ChartOrder[];
  customs: ChartOrder[];
  coupons: ChartCoupon[];
  notifications: ChartNotification[];
  revenue: number;
}

const PALETTE = {
  gold: '#c9a227',
  goldSoft: '#e6c96b',
  ink: '#2b1d16',
  espresso: '#6f3b2b',
  sand: '#f1e8dc',
  blush: '#e8efe9',
  olive: '#94a27a',
  rose: '#c98272',
};

const STATUS_COLORS: Record<string, string> = {
  'Order Placed': PALETTE.goldSoft,
  Packing: PALETTE.gold,
  Shipped: PALETTE.espresso,
  'Out For Delivery': PALETTE.sand,
  Delivered: PALETTE.olive,
  Cancelled: PALETTE.rose,
};

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="rounded-2xl border border-gold/15 bg-white/70 p-6 shadow-sm">
    <p className="font-display text-xl font-semibold text-ink mb-1">{title}</p>
    {subtitle && <p className="text-xs text-ink-soft mb-4">{subtitle}</p>}
    <div className="h-60">{children}</div>
  </div>
);

const EmptyChart = ({ message }: { message: string }) => (
  <div className="flex h-full items-center justify-center">
    <p className="text-sm text-ink-soft/60">{message}</p>
  </div>
);

const AxisStyle = {
  fontSize: 11,
  fill: '#5c4a3f',
};

const TooltipStyle = {
  borderRadius: 12,
  border: '1px solid rgba(201,162,39,0.25)',
  boxShadow: '0 10px 30px -12px rgba(43,29,22,0.35)',
  fontSize: 12,
  background: 'rgba(255,255,255,0.96)',
};

const TooltipLabelStyle = { color: '#2b1d16', fontWeight: 600, marginBottom: 4 };

const TooltipItemStyle = { color: '#5c4a3f' };

const revenueTrend = (orders: ChartOrder[], customs: ChartOrder[]) => {
  const byMonth = new Map<number, { month: string; revenue: number }>();
  [...orders, ...customs]
    .filter((o) => o.status !== 'Cancelled')
    .forEach((o) => {
      const d = new Date(Number(o.date) || Date.now());
      const idx = d.getFullYear() * 12 + d.getMonth();
      const current = byMonth.get(idx) || { month: d.toLocaleString('en', { month: 'short' }), revenue: 0 };
      current.revenue += Number(o.amount || 0);
      byMonth.set(idx, current);
    });
  return Array.from(byMonth.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({ ...v, revenue: Math.round(v.revenue) }));
};

const statusDistribution = (orders: ChartOrder[], customs: ChartOrder[]) => {
  const counts = new Map<string, number>();
  [...orders, ...customs].forEach((o) => {
    const key = o.status || 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
};

const categoryBreakdown = (products: ChartProduct[]) => {
  const counts = new Map<string, number>();
  products.forEach((p) => {
    const key = p.category || 'Other';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, perfumes]) => ({ name, perfumes }));
};

const topSelling = (orders: ChartOrder[], products: ChartProduct[]) => {
  const byProduct = new Map<string, number>();
  orders.forEach((o) =>
    (o.items || []).forEach((it) => {
      const key = it.name || 'Item';
      byProduct.set(key, (byProduct.get(key) || 0) + Number(it.price || 0) * Number(it.quantity || 1));
    })
  );
  if (byProduct.size > 0) {
    return Array.from(byProduct.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }
  return [...products]
    .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name || 'Product', value: Math.round(Number(p.price || 0)) }));
};

const couponBreakdown = (coupons: ChartCoupon[]) =>
  coupons.map((c) => ({
    name: c.code || 'Coupon',
    value: Number(c.discountValue || 0),
    active: c.active !== false,
  }));

const notificationBreakdown = (notifications: ChartNotification[]) => {
  const labels: Record<string, string> = { order: 'Order', promo: 'Promotion', sale: 'Sale', system: 'System' };
  const counts = new Map<string, number>();
  notifications.forEach((n) => {
    const key = labels[n.type || 'system'] || n.type || 'Other';
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
};

const money = (value: number) => `${currency}${value.toLocaleString()}`;

const DashboardCharts = ({ products, orders, customs, coupons, notifications, revenue }: DashboardChartsProps) => {
  const revenueData = revenueTrend(orders, customs);
  const statusData = statusDistribution(orders, customs);
  const categoryData = categoryBreakdown(products);
  const topData = topSelling(orders, products);
  const couponData = couponBreakdown(coupons);
  const notifData = notificationBreakdown(notifications);

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Revenue Trend" subtitle="Monthly revenue from orders & custom blends">
          {revenueData.length === 0 ? (
            <EmptyChart message="No sales data yet." />
          ) : (
            <>
              <p className="font-display text-4xl font-bold gold-text mb-2">{money(revenue)}</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PALETTE.gold} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={PALETTE.gold} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.sand} vertical={false} />
                  <XAxis dataKey="month" tick={AxisStyle} tickLine={false} axisLine={{ stroke: PALETTE.sand }} />
                  <YAxis tick={AxisStyle} tickLine={false} axisLine={false} width={48} />
                  <Tooltip cursor={{ stroke: PALETTE.gold, strokeDasharray: '4 4' }} contentStyle={TooltipStyle} labelStyle={TooltipLabelStyle} itemStyle={TooltipItemStyle} formatter={(value) => money(Number(value))} />
                  <Area type="monotone" dataKey="revenue" stroke={PALETTE.gold} strokeWidth={2.5} fill="url(#revenueGrad)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </ChartCard>

        <ChartCard title="Order Status" subtitle="Orders & custom blends by current stage">
          {statusData.length === 0 ? (
            <EmptyChart message="No orders yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="78%" paddingAngle={3} stroke="none">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PALETTE.goldSoft} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TooltipStyle} labelStyle={TooltipLabelStyle} itemStyle={TooltipItemStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#5c4a3f' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Perfume Catalog" subtitle="Products grouped by audience">
          {categoryData.length === 0 ? (
            <EmptyChart message="Add perfumes to see catalog breakdown." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.sand} vertical={false} />
                <XAxis dataKey="name" tick={AxisStyle} tickLine={false} axisLine={{ stroke: PALETTE.sand }} />
                <YAxis tick={AxisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(241,232,220,0.4)' }} contentStyle={TooltipStyle} labelStyle={TooltipLabelStyle} itemStyle={TooltipItemStyle} />
                <Bar dataKey="perfumes" fill={PALETTE.gold} radius={[6, 6, 0, 0]} name="Perfumes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top Selling Products" subtitle="Highest revenue products (falls back to price)">
          {topData.length === 0 ? (
            <EmptyChart message="No product activity yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topData} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.sand} horizontal={false} />
                <XAxis type="number" tick={AxisStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...AxisStyle, fill: PALETTE.ink }} tickLine={false} axisLine={{ stroke: PALETTE.sand }} width={96} />
                <Tooltip cursor={{ fill: 'rgba(241,232,220,0.4)' }} contentStyle={TooltipStyle} labelStyle={TooltipLabelStyle} itemStyle={TooltipItemStyle} formatter={(value) => money(Number(value))} />
                <Bar dataKey="value" fill={PALETTE.espresso} radius={[4, 8, 8, 4]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Coupons" subtitle={`Discount value per coupon — ${couponData.filter((c) => c.active).length} of ${couponData.length} active`}>
          {couponData.length === 0 ? (
            <EmptyChart message="No coupons created yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={couponData} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.sand} horizontal={false} />
                <XAxis type="number" tick={AxisStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...AxisStyle, fill: PALETTE.ink }} tickLine={false} axisLine={{ stroke: PALETTE.sand }} width={110} />
                <Tooltip cursor={{ fill: 'rgba(241,232,220,0.4)' }} contentStyle={TooltipStyle} labelStyle={TooltipLabelStyle} itemStyle={TooltipItemStyle} formatter={(value) => String(value)} />
                <Bar dataKey="value" name="Discount" radius={[4, 8, 8, 4]}>
                  {couponData.map((c) => (
                    <Cell key={c.name} fill={c.active ? PALETTE.gold : PALETTE.sand} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Notifications" subtitle="Customer notifications by type">
          {notifData.length === 0 ? (
            <EmptyChart message="No notifications sent yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={notifData} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.sand} horizontal={false} />
                <XAxis type="number" tick={AxisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ ...AxisStyle, fill: PALETTE.ink }} tickLine={false} axisLine={{ stroke: PALETTE.sand }} width={96} />
                <Tooltip cursor={{ fill: 'rgba(241,232,220,0.4)' }} contentStyle={TooltipStyle} labelStyle={TooltipLabelStyle} itemStyle={TooltipItemStyle} />
                <Bar dataKey="count" fill={PALETTE.goldSoft} radius={[4, 8, 8, 4]} name="Sent" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </>
  );
};

export default DashboardCharts;