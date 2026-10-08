import { useCallback, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { backendUrl } from '@/config/constants';
import { toast } from 'react-toastify';
import { notificationSchema, notificationIdSchema } from '@/validate/schemas';
import PageHeader from '@/components/data-display/PageHeader';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import FormErrors from '@/components/feedback/FormErrors';
import Loading from '@/components/feedback/Loading';
import SearchInput from '@/components/ui/SearchInput';
import FilterSelect from '@/components/ui/FilterSelect';
import Pagination from '@/components/ui/Pagination';
import RequiredMark from '@/components/ui/RequiredMark';
import { useChunkedPaging } from '@/hooks/useChunkedPaging';
import { useFormErrors } from '@/hooks/useFormErrors';

interface Notification {
  _id: string;
  userId?: number | null;
  type: 'order' | 'promo' | 'sale' | 'system';
  title: string;
  message: string;
  link?: string;
  createdAt: number;
}

interface NotificationsProps {
  token: string;
}

const PAGE_SIZE = 20;

const typeLabels: Record<string, string> = {
  order: 'Order',
  promo: 'Promo',
  sale: 'Sale',
  system: 'System',
};

const typeColors: Record<string, string> = {
  order: 'bg-sky-100 text-sky-700',
  promo: 'bg-amber-100 text-amber-700',
  sale: 'bg-rose-100 text-rose-700',
  system: 'bg-slate-100 text-slate-700',
};

const NotificationsPage = ({ token }: NotificationsProps) => {
  const [type, setType] = useState<'order' | 'promo' | 'sale' | 'system'>('promo');
  const [audience, setAudience] = useState<'all' | 'user'>('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { errors, validate, clearErrors } = useFormErrors();

  const fetcher = useCallback(
    async (page: number, limit: number) => {
      const response = await fetch(backendUrl + '/api/notification/admin/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ page, limit, search: search.trim(), type: typeFilter })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to load notifications');
      return { items: data.notifications || [], total: data.total || 0 };
    },
    [token, search, typeFilter]
  );

  const { pageItems, total, page, setPage, loading, refresh } = useChunkedPaging<Notification>({
    fetcher,
    query: [search.trim(), typeFilter],
    enabled: !!token,
    onError: (error) => toast.error((error as Error).message),
  });

  const filtering = !!(search.trim() || typeFilter);

  const resetForm = () => {
    setType('promo');
    setAudience('all');
    setUserId('');
    setTitle('');
    setMessage('');
    setLink('');
  };

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = notificationSchema.safeParse({
      type,
      title,
      message,
      link,
      userId: audience === 'user' ? userId : undefined,
    });
    if (!parsed.success) {
      return validate(parsed.error.issues.map((issue) => issue.message));
    }
    setSending(true);
    try {
      const response = await fetch(backendUrl + '/api/notification/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        resetForm();
        await refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    const parsed = notificationIdSchema.safeParse({ id });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      const response = await fetch(backendUrl + '/api/notification/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  const inputClass = 'w-full max-w-[500px] px-3 py-2';

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" subtitle="Send and manage customer notifications" />
      {/* Send notification */}
      <form onSubmit={onSubmitHandler} onChangeCapture={clearErrors} noValidate className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">Send Notification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-sm text-ink-soft">Type</p>
            <select onChange={(e) => setType(e.target.value as typeof type)} value={type} className={inputClass}>
              <option value="order">Order</option>
              <option value="promo">Promotion</option>
              <option value="sale">Sale Ending Soon</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Audience</p>
            <select onChange={(e) => setAudience(e.target.value as 'all' | 'user')} value={audience} className={inputClass}>
              <option value="all">All customers</option>
              <option value="user">Specific user</option>
            </select>
          </div>

          {audience === 'user' && (
            <div>
              <p className="mb-2 text-sm text-ink-soft">User ID<RequiredMark /></p>
              <input onChange={(e: ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)} value={userId} className={inputClass} type="number" placeholder="User id" required />
            </div>
          )}

          <div>
            <p className="mb-2 text-sm text-ink-soft">Title<RequiredMark /></p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} value={title} className={inputClass} type="text" placeholder="Your order is confirmed" required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Message<RequiredMark /></p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} value={message} className={inputClass} type="text" placeholder="We've received your order and started blending." required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Link (optional)</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setLink(e.target.value)} value={link} className={inputClass} type="text" placeholder="/orders or /collection" />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start gap-3">
          <FormErrors errors={errors} />
          <button type="submit" disabled={sending} className="btn-primary w-32 py-3 disabled:opacity-50">
            {sending ? 'Sending…' : 'SEND'}
          </button>
        </div>
      </form>

      {/* Notifications list */}
      <div className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="font-display text-2xl font-semibold text-ink">
            Sent Notifications <span className="text-ink-soft text-base font-sans">({total})</span>
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search notifications…"
              className="w-full sm:w-64"
            />
            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
              allLabel="All types"
              ariaLabel="Filter by type"
            />
          </div>
        </div>
        {total === 0 && (
          <p className="text-center text-ink-soft/60 py-8">
            {filtering ? 'No notifications match your search.' : 'No notifications sent yet.'}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {pageItems.map((n) => (
            <div key={n._id} className="flex items-start gap-3 py-2.5 px-3 border text-sm hover:bg-sand/40 hover:border-gold/30 transition-colors rounded-lg">
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${typeColors[n.type] || typeColors.system}`}>
                {typeLabels[n.type] || n.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink font-medium">{n.title}</p>
                <p className="text-xs text-ink-soft truncate">{n.message}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-ink-soft/60">{n.userId ? `User #${n.userId}` : 'All customers'}</p>
                <p className="text-xs text-ink-soft/60">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
              <p onClick={() => setDeleteTarget(n)} className="cursor-pointer text-lg text-red-500 hover:scale-110 transition-transform">✕</p>
            </div>
          ))}
        </div>
        <Pagination total={total} perPage={PAGE_SIZE} page={page} onPage={setPage} label="Notifications" />
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Notification"
        message={
          <>
            Are you sure you want to delete notification <span className="font-medium text-ink">“{deleteTarget?.title}”</span>? It will be removed from all customers' inboxes.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) void deleteNotification(deleteTarget._id); setDeleteTarget(null); }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default NotificationsPage;