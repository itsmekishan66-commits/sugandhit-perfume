import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Title from '@/components/ui/Title'
import Reveal from '@/components/ui/Reveal'
import { Bell, BellRing, Gift, Star, Tag } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { formatDateTime } from '@/utils/dates'
import type { ReactNode } from 'react'

const notificationMeta: Record<string, { icon: ReactNode; tint: string }> = {
  order: { icon: <Bell />, tint: 'bg-espresso/10 text-espresso' },
  promo: { icon: <Gift />, tint: 'bg-gold/20 text-espresso' },
  sale: { icon: <Tag />, tint: 'bg-blush text-espresso' },
  system: { icon: <Star />, tint: 'bg-sand text-espresso' },
};

const NotificationFilterTypes = ['All', 'order', 'promo', 'sale', 'system'] as const;

const NotificationsPage = () => {
  const { notifications, unreadNotifications, markNotificationsRead } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('All');

  const visible = filter === 'All' ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <div className="pt-2 min-h-[70vh] flex flex-col">
      <Title text1={'Your'} text2={'Notifications'} />

      <div className="w-full max-w-2xl mx-auto">
        <Reveal className="rounded-3xl border border-gold/15 bg-white/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-gold" />
              <h3 className="font-display text-2xl font-semibold">All notifications</h3>
              {unreadNotifications > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-espresso text-cream text-xs px-2">
                  {unreadNotifications} new
                </span>
              )}
            </div>
            {unreadNotifications > 0 && (
              <button onClick={() => markNotificationsRead()} className="text-sm text-gold font-medium hover:text-espresso transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {NotificationFilterTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`rounded-full border px-4 py-1.5 text-xs capitalize transition-colors ${filter === t ? 'border-gold bg-gold/20 text-espresso font-medium' : 'border-gold/20 text-ink-soft hover:border-gold/50'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-14">
              <Bell className="w-9 h-9 mx-auto text-ink-soft opacity-30 mb-3" />
              <p className="font-display text-2xl italic text-ink-soft">No notifications yet…</p>
              <button onClick={() => navigate('/collection')} className="btn-gold text-xs px-6 py-2.5 mt-6">Explore Collection</button>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((n) => {
                const meta = notificationMeta[n.type] || notificationMeta.system;
                return (
                  <div key={n._id} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors ${n.read ? 'border-gold/10 bg-white/50 opacity-70' : 'border-gold/30 bg-gold/10'}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-ink">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                      </div>
                      <p className="text-ink-soft text-sm mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-ink-soft/60 mt-1.5">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 text-sm text-ink-soft hover:text-espresso transition-colors">
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage