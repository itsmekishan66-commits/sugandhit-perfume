import { backendUrl } from '@/config/constants';
import type { Notification } from './notifications.types';

export interface NotificationListResult {
  success: boolean;
  notifications: Notification[];
  message?: string;
}

export interface NotificationResult {
  success: boolean;
  message?: string;
}

export interface NotificationPayload {
  type:'order' |'promo' |'sale' |'system';
  title: string;
  message: string;
  link?: string;
}

export async function fetchNotifications(token: string): Promise<NotificationListResult> {
  const response = await fetch(backendUrl +'/api/notification/admin/list', {
    method:'POST',
    headers: { token },
  });
  return response.json();
}

export async function apiCreateNotification(
  token: string,
  body: NotificationPayload
): Promise<NotificationResult> {
  const response = await fetch(backendUrl +'/api/notification/create', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function apiDeleteNotification(
  token: string,
  body: { id: string | number }
): Promise<NotificationResult> {
  const response = await fetch(backendUrl +'/api/notification/delete', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}
