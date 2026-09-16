import { useEffect, useState } from 'react';
import { Eye, X, Plus, Wallet } from 'lucide-react';
import { backendUrl, currency } from '../../config';
import { toast } from 'react-toastify';
import { userIdSchema, addCreditSchema } from '../../validate/schemas';
import { PageHeader } from '../../components';
import { Loading } from '../../components';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: Record<string, string> | string;
  image?: string;
  credit: number | string;
  createdAt: string;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface HistoryOrder {
  _id: string;
  id: number;
  items?: { name?: string; quantity?: number; price?: string | number; subCategory?: string; image?: string[] }[];
  name?: string;
  bottleSize?: string;
  status: string;
  paymentMethod?: string;
  payment?: boolean;
  amount: string | number;
  date: string | number;
  address?: Record<string, string>;
}

interface UserDetail {
  user: Customer;
  orders: HistoryOrder[];
  customOrders: HistoryOrder[];
}

interface UsersProps {
  token: string;
}

type Tab = 'customers' | 'admins';

const parseAddress = (address: Record<string, string> | string): string => {
  if (!address) return 'â€”';
  if (typeof address === 'string') return address;
  const values = Object.values(address).filter((v) => v && v.trim());
  return values.length ? values.join(', ') : 'â€”';
};

const formatDate = (date: string | number | undefined) => {
  if (!date) return 'â€”';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Users = ({ token }: UsersProps) => {
  const [tab, setTab] = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [addingCredit, setAddingCredit] = useState(false);

  const fetchUsers = async () => {
    try {
      const [usersRes, adminsRes] = await Promise.all([
        fetch(backendUrl + '/api/accounts/users', { headers: { token } }),
        fetch(backendUrl + '/api/accounts/admins', { headers: { token } }),
      ]);
      const usersData = await usersRes.json();
      const adminsData = await adminsRes.json();
      if (usersData.success) {
        setCustomers(usersData.users || []);
        setTotalCustomers(usersData.totalCustomers || 0);
        setTotalAdmins(usersData.totalAdmins || 0);
      } else {
        toast.error(usersData.message);
      }
      if (adminsData.success) {
        setAdmins(adminsData.admins || []);
      } else {
        toast.error(adminsData.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (userId: number) => {
    const parsed = userIdSchema.safeParse({ userId });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setDetailLoading(true);
    setDetail(null);
    setShowCreditForm(false);
    setCreditAmount('');
    try {
      const response = await fetch(backendUrl + '/api/accounts/user/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (data.success) {
        setDetail({ user: data.user, orders: data.orders || [], customOrders: data.customOrders || [] });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitCredit = async () => {
    if (!detail) return;
    const parsed = addCreditSchema.safeParse({ userId: detail.user.id, amount: creditAmount });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setAddingCredit(true);
    try {
      const response = await fetch(backendUrl + '/api/accounts/user/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setCreditAmount('');
        setShowCreditForm(false);
        setDetail((prev) => (prev ? { ...prev, user: data.user } : prev));
        setCustomers((prev) =>
          prev.map((c) => (c.id === data.user.id ? { ...c, credit: data.user.credit } : c))
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    } finally {
      setAddingCredit(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsers();
  }, [token]);

  const history = detail
    ? [
        ...detail.orders.map((o) => ({ ...o, type: 'Order' })),
        ...detail.customOrders.map((o) => ({ ...o, type: 'Custom Blend' })),
      ].sort((a, b) => Number(b.date) - Number(a.date))
    : [];

  const creditValue = (value: number | string) => {
    const n = Number(value || 0);
    if (isNaN(n)) return '0';
    return n.toLocaleString('en-IN');
  };

  const statCards = [
    { label: 'Total Customers', value: totalCustomers, tint: 'from-gold-soft to-gold' },
    { label: 'Total Admins', value: totalAdmins, tint: 'from-blush to-espresso' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" subtitle="Manage customers and admin accounts" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`flex flex-col justify-between overflow-hidden rounded-2xl bg-linear-to-br ${card.tint} p-5 text-[#2b1d16] shadow-sm`}
          >
            <p className="font-display text-4xl font-bold leading-tight tabular-nums">{card.value}</p>
            <p className="mt-2 truncate text-sm font-medium opacity-80">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/70 rounded-2xl border border-gold/15 shadow-sm backdrop-blur">
        <div className="flex items-center gap-1 p-4 border-b border-gold/15">
          <button
            onClick={() => setTab('customers')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'customers' ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft hover:bg-cream'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setTab('admins')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'admins' ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft hover:bg-cream'
            }`}
          >
            Admins ({admins.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loading /></div>
        ) : tab === 'customers' ? (
          <>
            {customers.length === 0 ? (
              <p className="text-center text-ink-soft/60 py-12">No customers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-gold/15 text-left">
                      <th className="p-3 font-medium text-ink">Customer</th>
                      <th className="p-3 font-medium text-ink">Email</th>
                      <th className="p-3 font-medium text-ink">Phone</th>
                      <th className="p-3 font-medium text-ink">Joined</th>
                      <th className="p-3 font-medium text-ink text-right">Credit</th>
                      <th className="p-3 font-medium text-ink text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gold/10 hover:bg-sand/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {customer.image ? (
                              <img src={customer.image} alt="" className="w-10 h-10 rounded-full object-cover border border-gold/20" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-gold to-espresso text-white text-sm font-semibold">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="font-medium text-ink">{customer.name}</p>
                          </div>
                        </td>
                        <td className="p-3 text-ink-soft">{customer.email}</td>
                        <td className="p-3 text-ink-soft">{customer.phone || 'â€”'}</td>
                        <td className="p-3 text-ink-soft">{formatDate(customer.createdAt)}</td>
                        <td className={`p-3 text-right font-semibold ${Number(customer.credit || 0) > 0 ? 'text-espresso' : 'text-ink-soft'}`}>
                          {currency} {creditValue(customer.credit)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openDetail(customer.id)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gold/25 bg-white/70 text-ink-soft hover:text-espresso hover:border-gold transition-colors cursor-pointer"
                            title="View customer details"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {admins.length === 0 ? (
              <p className="text-center text-ink-soft/60 py-12">No admin accounts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-gold/15 text-left">
                      <th className="p-3 font-medium text-ink">Name</th>
                      <th className="p-3 font-medium text-ink">Email</th>
                      <th className="p-3 font-medium text-ink">Role</th>
                      <th className="p-3 font-medium text-ink">Status</th>
                      <th className="p-3 font-medium text-ink">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gold/10 hover:bg-sand/30 transition-colors">
                        <td className="p-3 font-medium text-ink">{admin.name}</td>
                        <td className="p-3 text-ink-soft">{admin.email}</td>
                        <td className="p-3">
                          <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs capitalize text-espresso">
                            {admin.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                              admin.active ? 'text-espresso' : 'text-ink-soft'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${admin.active ? 'bg-gold' : 'bg-ink-soft/40'}`} />
                            {admin.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="p-3 text-ink-soft">{formatDate(admin.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-60 flex items-start justify-center bg-deep/60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-cream border border-gold/20 shadow-xl">
            <button
              onClick={() => setDetail(null)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-white/80 text-ink-soft hover:text-espresso cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16"><Loading /></div>
            ) : (
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="p-6 border-b border-gold/15">
                  <div className="flex items-center gap-4">
                    {detail.user.image ? (
                      <img src={detail.user.image} alt="" className="w-16 h-16 rounded-full object-cover border border-gold/20" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-gold to-espresso text-white text-2xl font-semibold">
                        {detail.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl font-semibold text-ink truncate">{detail.user.name}</h2>
                      <p className="text-sm text-ink-soft break-all">{detail.user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5 text-sm">
                    <div className="rounded-xl border border-gold/15 bg-white/70 p-3">
                      <p className="text-xs text-ink-soft mb-1">Phone</p>
                      <p className="text-ink font-medium">{detail.user.phone || 'â€”'}</p>
                    </div>
                    <div className="rounded-xl border border-gold/15 bg-white/70 p-3">
                      <p className="text-xs text-ink-soft mb-1">Joined</p>
                      <p className="text-ink font-medium">{formatDate(detail.user.createdAt)}</p>
                    </div>
                    <div className="rounded-xl border border-gold/15 bg-white/70 p-3">
                      <p className="text-xs text-ink-soft mb-1">Credit Balance</p>
                      <p className="text-ink font-semibold text-espresso">
                        {currency} {creditValue(detail.user.credit)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gold/15 bg-white/70 p-3 col-span-1 sm:col-span-2 lg:col-span-3">
                      <p className="text-xs text-ink-soft mb-1">Address</p>
                      <p className="text-ink font-medium">{parseAddress(detail.user.address)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-5">
                    {!showCreditForm ? (
                      <button onClick={() => setShowCreditForm(true)} className="btn-gold px-5 py-2.5 text-sm cursor-pointer">
                        <Wallet size={16} /> Add Credit Balance
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="mb-1 text-xs text-ink-soft">Credit amount ({currency})</p>
                          <input
                            type="number"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            className="w-full px-3 py-2"
                            placeholder="e.g. 500"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={submitCredit} disabled={addingCredit} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50 cursor-pointer">
                            <Plus size={16} /> {addingCredit ? 'Addingâ€¦' : 'Add Credit'}
                          </button>
                          <button onClick={() => setShowCreditForm(false)} className="px-4 py-2.5 text-sm text-ink-soft hover:text-espresso cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold text-ink mb-4">
                    Order History ({detail.orders.length + detail.customOrders.length})
                  </h3>
                  {history.length === 0 ? (
                    <p className="text-sm text-ink-soft/60 py-6 text-center">No orders yet for this customer.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {history.map((order) => (
                        <li key={order.type + order._id} className="rounded-xl border border-gold/15 bg-white/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                                  order.type === 'Custom Blend' ? 'bg-blush text-espresso' : 'bg-gold/10 text-espresso'
                                }`}
                              >
                                {order.type}
                              </span>
                              <span className="text-xs text-ink-soft">{formatDate(order.date)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-ink-soft">
                                {order.paymentMethod || 'COD'} Â· {order.payment ? 'Paid' : 'Unpaid'}
                              </span>
                              <span className="font-display text-lg font-semibold gold-text">
                                {currency} {Number(order.amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-ink-soft mb-2">
                            {order.type === 'Custom Blend' ? (
                              <p>
                                {order.name || 'Custom Perfume'} Â· {order.bottleSize || ''} Â·{' '}
                                <span
                                  className={`font-medium ${order.status === 'Delivered' || order.status === 'Completed' ? 'text-espresso' : 'text-ink'}`}
                                >
                                  {order.status}
                                </span>
                              </p>
                            ) : (
                              <p className="text-ink font-medium">
                                {order.items?.length
                                  ? order.items
                                      .map((i) => `${i.name}${i.quantity ? ` Ã— ${i.quantity}` : ''}`)
                                      .join(', ')
                                  : 'Order'}
                              </p>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              order.status === 'Delivered' || order.status === 'Completed' ? 'text-espresso' : 'text-ink'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                order.status === 'Delivered' || order.status === 'Completed' ? 'bg-gold' : 'bg-espresso/40'
                              }`}
                            />
                            {order.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;