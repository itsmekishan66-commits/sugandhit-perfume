import { api, apiFetch } from '@/services/api';
import type { AppNotification } from '@/types/common';

export async function fetchNotifications(
  token: string
): Promise<{ notifications: AppNotification[]; unread: number }> {
  const { data, success } = await apiFetch<{ success: boolean; notifications?: AppNotification[]; unread?: number }>(
    api('/api/notification/list'),
    { method: 'POST', body: {} },
    token
  );
  if (success && data.success) {
    return { notifications: data.notifications || [], unread: data.unread || 0 };
  }
  return { notifications: [], unread: 0 };
}

export async function markNotificationsRead(token: string, id?: string): Promise<boolean> {
  const { data, success } = await apiFetch<{ success: boolean }>(
    api('/api/notification/mark-read'),
    { method: 'POST', body: id ? { notificationId: Number(id) } : {} },
    token
  );
  return success && !!data.success;
}