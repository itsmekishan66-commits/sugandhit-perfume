import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { backendUrl } from '../../config';
import { toast } from 'react-toastify';
import { notificationSchema, notificationIdSchema } from '../../validate/schemas';
import { PageHeader } from '../../components';

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
  const [list, setList] = useState<Notification[]>([]);
  const [type, setType] = useState<'order' | 'promo' | 'sale' | 'system'>('promo');
  const [audience, setAudience] = useState<'all' | 'user'>('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  const fetchList = async () => {
    try {
      const response = await fetch(backendUrl + '/api/notification/admin/list', {
        method: 'POST',
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setList(data.notifications);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

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
      toast.error(parsed.error.issues[0].message);
      return;
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
        await fetchList();
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
        await fetchList();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    fetch(backendUrl + '/api/notification/admin/list', {
      method: 'POST',
      headers: { token }
    })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setList(data.notifications);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error((error as Error).message);
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  const inputClass = 'w-full max-w-[500px] px-3 py-2';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" subtitle="Send and manage customer notifications" />
      {/* Send notification */}
      <form onSubmit={onSubmitHandler} className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
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
              <p className="mb-2 text-sm text-ink-soft">User ID</p>
              <input onChange={(e: ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)} value={userId} className={inputClass} type="number" placeholder="User id" required />
            </div>
          )}

          <div>
            <p className="mb-2 text-sm text-ink-soft">Title</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} value={title} className={inputClass} type="text" placeholder="Your order is confirmed" required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Message</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} value={message} className={inputClass} type="text" placeholder="We've received your order and started blending." required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Link (optional)</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setLink(e.target.value)} value={link} className={inputClass} type="text" placeholder="/orders or /collection" />
          </div>
        </div>
        <button type="submit" disabled={sending} className="btn-primary w-32 py-3 mt-6 disabled:opacity-50">
          {sending ? 'Sendingâ€¦' : 'SEND'}
        </button>
      </form>

      {/* Notifications list */}
      <div className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
        <p className="mb-4 font-display text-2xl font-semibold text-ink">Sent Notifications <span className="text-ink-soft text-base font-sans">({list.length})</span></p>
        <div className="flex flex-col gap-2">
          {list.length === 0 && <p className="text-center text-ink-soft/60 py-8">No notifications sent yet.</p>}
          {list.map((n) => (
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
              <p onClick={() => deleteNotification(n._id)} className="cursor-pointer text-lg text-red-500 hover:scale-110 transition-transform">âœ•</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;