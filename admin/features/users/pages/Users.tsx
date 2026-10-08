import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendUrl, currency } from '@/config/constants';
import { toast } from 'react-toastify';
import PageHeader from '@/components/data-display/PageHeader';
import RowActions from '@/components/data-display/RowActions';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import Loading from '@/components/feedback/Loading';
import SearchInput from '@/components/ui/SearchInput';
import FilterSelect from '@/components/ui/FilterSelect';
import Pagination from '@/components/ui/Pagination';
import { useChunkedPaging } from '@/hooks/useChunkedPaging';
import { useTabParam } from '@/hooks/useTabParam';
import { apiDeleteUser } from '../users.service';

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

const TAB_KEYS: Tab[] = ['customers', 'admins'];

const PAGE_SIZE = 20;

const formatDate = (date: string | number | undefined) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Users = ({ token }: UsersProps) => {
  const navigate = useNavigate();
  const [tab, setTab] = useTabParam('tab', TAB_KEYS, 'customers');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const customersFetcher = useCallback(
    async (page: number, limit: number) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(backendUrl + '/api/accounts/users?' + params.toString(), { headers: { token } });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to load customers');
      return { items: data.users || [], total: data.totalCustomers || 0 };
    },
    [token, search]
  );

  const adminsFetcher = useCallback(
    async (page: number, limit: number) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (adminStatusFilter) params.set('status', adminStatusFilter);
      const response = await fetch(backendUrl + '/api/accounts/admins?' + params.toString(), { headers: { token } });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to load admins');
      setRoles((prev) => {
        const next = (data.roles as string[] | undefined) ?? prev;
        const same = next.length === prev.length && next.every((r, i) => r === prev[i]);
        return same ? prev : next;
      });
      return { items: data.admins || [], total: data.total || 0 };
    },
    [token, search, roleFilter, adminStatusFilter]
  );

  const customers = useChunkedPaging<Customer>({
    fetcher: customersFetcher,
    query: [search.trim()],
    enabled: !!token,
    onError: (error) => toast.error((error as Error).message),
  });
  const admins = useChunkedPaging<Admin>({
    fetcher: adminsFetcher,
    query: [search.trim(), roleFilter, adminStatusFilter],
    enabled: !!token,
    onError: (error) => toast.error((error as Error).message),
  });

  const switchTab = (next: Tab) => {
    setTab(next);
    customers.setPage(1);
    admins.setPage(1);
  };

  const creditValue = (value: number | string) => {
    const n = Number(value || 0);
    if (isNaN(n)) return '0';
    return n.toLocaleString('en-IN');
  };

  const deleteCustomer = async (customer: Customer) => {
    setDeleting(true);
    try {
      const data = await apiDeleteUser(token, customer.id);
      if (!data.success) throw new Error(data.message || 'Failed to delete customer');
      toast.success('Customer deleted');
      await customers.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const statCards = [
    { label: 'Total Customers', value: customers.total, tint: 'from-gold-soft to-gold' },
    { label: 'Total Admins', value: admins.total, tint: 'from-blush to-espresso' },
  ];

  if (customers.loading || admins.loading) return <Loading />;

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
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gold/15">
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchTab('customers')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === 'customers' ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft hover:bg-cream'
              }`}
            >
              Customers ({customers.total})
            </button>
            <button
              onClick={() => switchTab('admins')}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === 'admins' ? 'bg-sand text-espresso border border-gold/30' : 'text-ink-soft hover:bg-cream'
              }`}
            >
              Admins ({admins.total})
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, phone…"
              className="w-full sm:w-64"
            />
            {tab === 'admins' && (
              <>
                <FilterSelect
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roles.map((r) => ({ value: r, label: r }))}
                  allLabel="All roles"
                  ariaLabel="Filter by role"
                />
                <FilterSelect
                  value={adminStatusFilter}
                  onChange={setAdminStatusFilter}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'disabled', label: 'Disabled' },
                  ]}
                  allLabel="All statuses"
                  ariaLabel="Filter by status"
                />
              </>
            )}
          </div>
        </div>

        {tab === 'customers' ? (
          <>
            {customers.pageItems.length === 0 ? (
              <p className="text-center text-ink-soft/60 py-12">
                {search.trim() ? 'No customers match your search.' : 'No customers yet.'}
              </p>
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
                    {customers.pageItems.map((customer) => (
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
                          <div className="flex justify-end">
                            <RowActions
                              onView={() => navigate(`/users/${customer.id}`)}
                              onDelete={() => setDeleteTarget(customer)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 border-t border-gold/15">
              <Pagination total={customers.total} perPage={PAGE_SIZE} page={customers.page} onPage={customers.setPage} label="Customers" />
            </div>
          </>
        ) : (
          <>
            {admins.pageItems.length === 0 ? (
              <p className="text-center text-ink-soft/60 py-12">
                {search.trim() || roleFilter || adminStatusFilter ? 'No admins match your search.' : 'No admin accounts yet.'}
              </p>
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
                    {admins.pageItems.map((admin) => (
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
            <div className="p-4 border-t border-gold/15">
              <Pagination total={admins.total} perPage={PAGE_SIZE} page={admins.page} onPage={admins.setPage} label="Admins" />
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Customer"
        message={
          <>
            Are you sure you want to delete <span className="font-medium text-ink">“{deleteTarget?.name}”</span>? This
            permanently removes the customer account and cannot be undone.
          </>
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={() => { if (deleteTarget) void deleteCustomer(deleteTarget); }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Users;