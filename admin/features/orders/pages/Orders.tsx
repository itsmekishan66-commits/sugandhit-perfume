import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import { backendUrl, currency } from "@/config/constants";
import { toast } from "react-toastify";
import { orderStatusSchema } from "@/validate/schemas";
import PageHeader from "@/components/data-display/PageHeader";
import Loading from "@/components/feedback/Loading";
import SearchInput from "@/components/ui/SearchInput";
import FilterSelect from "@/components/ui/FilterSelect";
import Pagination from "@/components/ui/Pagination";
import { useChunkedPaging } from "@/hooks/useChunkedPaging";

interface OrderItem {
  name: string;
  quantity: number;
  subCategory?: string;
  price: string | number;
  image?: string[];
}

interface Address {
  firstName: string;
  lastName: string;
  location: string;
  city: string;
  district: string;
  phone: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  address: Address;
  date: string | number;
  paymentMethod: string;
  payment?: boolean;
  amount: string | number;
  status: string;
}

interface OrdersProps {
  token: string;
}

const PAGE_SIZE = 20;

const Orders = ({ token }: OrdersProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payMethodFilter, setPayMethodFilter] = useState('');
  const [filterOptions, setFilterOptions] = useState<{ statuses: string[]; paymentMethods: string[] }>({
    statuses: [],
    paymentMethods: [],
  });

  const fetcher = useCallback(
    async (page: number, limit: number) => {
      const response = await fetch(backendUrl + "/api/order/list", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ page, limit, search: search.trim(), status: statusFilter, paymentMethod: payMethodFilter })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to load orders');
      setFilterOptions((prev) => {
        const statuses = (data.statuses as string[] | undefined) ?? prev.statuses;
        const paymentMethods = (data.paymentMethods as string[] | undefined) ?? prev.paymentMethods;
        const same =
          statuses.length === prev.statuses.length &&
          paymentMethods.length === prev.paymentMethods.length &&
          statuses.every((s, i) => s === prev.statuses[i]) &&
          paymentMethods.every((p, i) => p === prev.paymentMethods[i]);
        return same ? prev : { statuses, paymentMethods };
      });
      return { items: data.orders || [], total: data.total || 0 };
    },
    [token, search, statusFilter, payMethodFilter]
  );

  const { pageItems, total, page, setPage, loading, refresh } = useChunkedPaging<Order>({
    fetcher,
    query: [search.trim(), statusFilter, payMethodFilter],
    enabled: !!token,
    onError: (error) => toast.error((error as Error).message),
  });

  const filtering = !!(search.trim() || statusFilter || payMethodFilter);

  const statusHandler = async (event: ChangeEvent<HTMLSelectElement>, orderId: string | number) => {
    const parsed = orderStatusSchema.safeParse({ orderId, status: event.target.value });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      const response = await fetch(backendUrl + '/api/order/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        await refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Track and update customer perfume orders"
        trailing={
          <span className="rounded-full border border-gold/20 bg-white/80 px-3 py-1 text-sm text-ink-soft">
            {total} {total === 1 ? 'order' : 'orders'}
          </span>
        }
      />
      <div className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
      <div>
        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by customer, phone, product, order id…"
            className="w-full sm:w-72"
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={filterOptions.statuses.map((s) => ({ value: s, label: s }))}
            allLabel="All statuses"
            ariaLabel="Filter by status"
          />
          <FilterSelect
            value={payMethodFilter}
            onChange={setPayMethodFilter}
            options={filterOptions.paymentMethods.map((m) => ({ value: m, label: m }))}
            allLabel="All payment methods"
            ariaLabel="Filter by payment method"
          />
        </div>
        {total === 0 && (
          <p className="text-center text-ink-soft/60 py-8">
            {filtering ? 'No orders match your search.' : 'No orders yet.'}
          </p>
        )}
        {pageItems.map((order) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 items-start border border-gold/15 p-6 my-3 text-sm text-ink-soft rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white/70"
            key={order._id}
          >
            <div>
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 mb-2">
                  {item.image && item.image[0] && (
                    <img src={item.image[0]} className="w-10 h-10 object-cover rounded-lg border border-gold/15" alt="" />
                  )}
                  <div>
                    <p className="flex items-center gap-2 text-ink">
                      {item.name} <span className="text-xs text-ink-soft/60">x {item.quantity}</span>
                    </p>
                    <p className="text-xs text-ink-soft/70">{item.subCategory} · {currency}{item.price}</p>
                  </div>
                </div>
              ))}
              <p className="font-semibold mt-3 text-ink">
                {order.address.firstName} {order.address.lastName}
              </p>
              <p className="text-ink-soft/70 text-xs">{order.address.location}, {order.address.city}, {order.address.district}</p>
              <p className="text-ink-soft/70 text-xs">{order.address.phone}</p>
            </div>

            <div className="text-xs text-ink-soft">
              <p className="mb-1">🛒 Items: {order.items.length}</p>
              <p className="mb-1">💳 {order.paymentMethod}</p>
              <p className="mb-1">💰 {order.payment ? "Paid" : "Cash on Delivery"}</p>
              <p>📅 {new Date(order.date).toLocaleDateString()}</p>
            </div>

            <p className="font-display text-lg font-semibold gold-text">
              {currency} {order.amount}
            </p>

            <select
              onChange={(event) => statusHandler(event, order._id)}
              className="select-soft border border-gold/25 bg-white/70 text-espresso rounded-xl p-2 pr-8 focus:border-gold cursor-pointer text-xs"
              value={order.status}
            >
              <option value="Order Placed">Order Placed</option>
              <option value="Packing">Packing</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        ))}
        <Pagination total={total} perPage={PAGE_SIZE} page={page} onPage={setPage} label="Orders" />
      </div>
    </div>
    </>
  );
};

export default Orders;