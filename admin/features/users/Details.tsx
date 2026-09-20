import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Wallet } from 'lucide-react';
import { backendUrl, currency } from '../../config';
import { toast } from 'react-toastify';
import { userIdSchema, addCreditSchema } from '../../validate/schemas';
import { PageHeader, Loading } from '../../components';

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

interface DetailsProps {
  token: string;
}

const parseAddress = (address: Record<string, string> | string): string => {
  if (!address) return '—';
  if (typeof address === 'string') return address;
  const values = Object.values(address).filter((v) => v && v.trim());
  return values.length ? values.join(', ') : '—';
};

const formatDate = (date: string | number | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const creditValue = (value: number | string) => {
  const n = Number(value || 0);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-IN');
};

const Details = ({ token }: DetailsProps) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [addingCredit, setAddingCredit] = useState(false);

  const fetchDetail = async (userId: number) => {
    const parsed = userIdSchema.safeParse({ userId });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setDetail(null);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    fetchDetail(Number(id));
  }, [token, id]);

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

  const history = detail
    ? [
        ...detail.orders.map((o) => ({ ...o, type: 'Order' })),
        ...detail.customOrders.map((o) => ({ ...o, type: 'Custom Blend' })),
      ].sort((a, b) => Number(b.date) - Number(a.date))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="User Details" subtitle={detail ? detail.user.name : 'Loading…'} />
        <button
          onClick={() => navigate('/users')}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Users
        </button>
      </div>

      {loading && !detail ? (
        <div className="flex items-center justify-center py-16"><Loading /></div>
      ) : detail ? (
        <div className="rounded-2xl bg-cream border border-gold/20 shadow-sm">
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
                <p className="text-ink font-medium">{detail.user.phone || '—'}</p>
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
                      <Plus size={16} /> {addingCredit ? 'Adding…' : 'Add Credit'}
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
                          {order.paymentMethod || 'COD'} · {order.payment ? 'Paid' : 'Unpaid'}
                        </span>
                        <span className="font-display text-lg font-semibold gold-text">
                          {currency} {Number(order.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-ink-soft mb-2">
                      {order.type === 'Custom Blend' ? (
                        <p>
                          {order.name || 'Custom Perfume'} · {order.bottleSize || ''} ·{' '}
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
                                .map((i) => `${i.name}${i.quantity ? ` × ${i.quantity}` : ''}`)
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
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-ink-soft/60">User not found.</p>
          <button onClick={() => navigate('/users')} className="btn-primary px-4 py-2.5 text-sm cursor-pointer">
            Back to Users
          </button>
        </div>
      )}
    </div>
  );
};

export default Details;