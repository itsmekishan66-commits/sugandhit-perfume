import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { backendUrl, currency } from '../../config';
import { toast } from 'react-toastify';
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

interface UsersProps {
  token: string;
}

type Tab = 'customers' | 'admins';

const formatDate = (date: string | number | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Users = ({ token }: UsersProps) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!token) return;
    fetchUsers();
  }, [token]);

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
                        <td className="p-3 text-ink-soft">{customer.phone || '—'}</td>
                        <td className="p-3 text-ink-soft">{formatDate(customer.createdAt)}</td>
                        <td className={`p-3 text-right font-semibold ${Number(customer.credit || 0) > 0 ? 'text-espresso' : 'text-ink-soft'}`}>
                          {currency} {creditValue(customer.credit)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => navigate(`/users/${customer.id}`)}
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
    </div>
  );
};

export default Users;