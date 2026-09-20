import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { backendUrl, currency } from "../../config";
import { toast } from "react-toastify";
import { orderStatusSchema } from "../../validate/schemas";
import { PageHeader } from "../../components";

interface NotePillsProps {
  title: string;
  notes?: string[];
}

const NotePills = ({ title, notes }: NotePillsProps) => (
  <div className="mb-2">
    <p className="text-[11px] uppercase tracking-wide text-ink-soft/60 mb-1">{title}</p>
    <div className="flex flex-wrap gap-1">
      {notes?.map((n, i) => (
        <span key={i} className="text-[11px] bg-gradient-to-r from-cream to-sand/50 border border-gold/20 rounded-full px-2.5 py-1 text-espresso">
          {n}
        </span>
      ))}
    </div>
  </div>
);

interface Address {
  firstName: string;
  lastName: string;
  location: string;
  city: string;
  district: string;
  phone: string;
}

interface CustomOrder {
  _id: string;
  name?: string;
  bottleSize?: string;
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  perfumeBase?: string;
  strengthName?: string;
  strength?: string;
  customLabel?: string;
  address: Address;
  date: string | number;
  paymentMethod: string;
  amount: number | string;
  status: string;
}

interface CustomOrdersProps {
  token: string;
}

const CustomOrders = ({ token }: CustomOrdersProps) => {
  const [orders, setOrders] = useState<CustomOrder[]>([]);

  const fetchAllOrders = async () => {
    if (!token) return;

    try {
      const response = await fetch(backendUrl + "/api/custom-order/list", {
        method: 'POST',
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const statusHandler = async (event: ChangeEvent<HTMLSelectElement>, orderId: string | number) => {
    try {
      const parsed = orderStatusSchema.safeParse({ orderId, status: event.target.value });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const response = await fetch(backendUrl + '/api/custom-order/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        await fetchAllOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      console.error(error);
      toast.error(err.message || err.response?.data?.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    fetch(backendUrl + "/api/custom-order/list", {
      method: 'POST',
      headers: { token }
    })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setOrders(data.orders);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => toast.error((error as Error).message));
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <>
      <PageHeader
        title="Custom Orders"
        subtitle="Customized signature scents ordered by customers"
        trailing={
          <span className="rounded-full border border-gold/20 bg-white/80 px-3 py-1 text-sm text-ink-soft">
            {orders.length} {orders.length === 1 ? 'custom order' : 'custom orders'}
          </span>
        }
      />
      <div className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
      <div>
        {orders.length === 0 && <p className="text-center text-ink-soft/60 py-8">No custom orders yet.</p>}
        {orders.map((order) => (
          <div key={order._id} className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start border border-gold/15 p-6 my-3 text-sm text-ink-soft rounded-2xl shadow-sm bg-gradient-to-br from-white via-sand/40 to-blush/60">
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-lg font-semibold text-espresso">✨ {order.name || 'Custom Perfume'}</p>
                <span className="text-[11px] bg-ink text-cream rounded-full px-2.5 py-1">{order.bottleSize}</span>
              </div>
              <NotePills title="Top Notes" notes={order.topNotes} />
              <NotePills title="Heart Notes" notes={order.heartNotes} />
              <NotePills title="Base Notes" notes={order.baseNotes} />
              <p className="text-xs mt-2">🫧 Base: <span className="text-ink font-medium">{order.perfumeBase}</span> · {order.strengthName || order.strength}</p>
              {order.customLabel && <p className="text-xs mt-1">🏷️ Label: <span className="text-ink font-medium">{order.customLabel}</span></p>}
              <p className="font-semibold mt-3 text-ink">
                {order.address.firstName} {order.address.lastName}
              </p>
              <p className="text-ink-soft/70 text-xs">{order.address.location}, {order.address.city}, {order.address.district} · {order.address.phone}</p>
              <p className="text-ink-soft/60 text-xs mt-1">📅 {new Date(order.date).toLocaleDateString()} · {order.paymentMethod}</p>
            </div>

            <div className="flex flex-col gap-3 items-start lg:items-end">
              <p className="font-display text-2xl font-semibold gold-text">{currency} {order.amount}</p>
              <select onChange={(event) => statusHandler(event, order._id)} className="select-soft border border-gold/25 bg-white/70 text-espresso rounded-xl p-2 pr-8 focus:border-gold cursor-pointer text-xs" value={order.status}>
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default CustomOrders;