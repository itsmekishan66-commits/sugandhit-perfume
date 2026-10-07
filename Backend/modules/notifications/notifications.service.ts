import type { NotificationInput, SerializedNotification } from './notifications.types.js';
import * as repo from './notifications.repository.js';
import type { NotificationListFilters } from './notifications.repository.js';
import { notifications } from '../../database/schema/index.js';
import { buildPaginated, computePagination } from '../../shared/utils/pagination.js';
import type { Paginated } from '../../shared/types/common.types.js';

const serializeNotification = (n: typeof notifications.$inferSelect) => ({
  ...n,
  _id: String(n.id),
});

export const list = async (userId: number): Promise<SerializedNotification[]> => {
  const rows = await repo.findNotificationsForUser(userId);
  const reads = await repo.findReadsForUser(rows.map((n) => n.id), userId);
  const readsMap = new Map(reads.map((r) => [r.notificationId, r.read]));
  return rows.map((n) => {
    const isBroadcast = n.userId === null;
    const read = isBroadcast ? (readsMap.get(n.id) ?? false) : n.read;
    return serializeNotification({ ...n, read });
  });
};

export const unreadCount = async (userId: number): Promise<number> => {
  const rows = await repo.findNotificationsForUser(userId);
  const reads = await repo.findReadsForUser(rows.map((n) => n.id), userId);
  const readsMap = new Map(reads.map((r) => [r.notificationId, r.read]));
  return rows.filter((n) => {
    if (n.userId === null) return !(readsMap.get(n.id) ?? false);
    return !n.read;
  }).length;
};

export async function adminList(): Promise<SerializedNotification[]>;
export async function adminList(
  opts: { page?: number; limit?: number } & NotificationListFilters
): Promise<Paginated<SerializedNotification>>;
export async function adminList(
  opts?: { page?: number; limit?: number } & NotificationListFilters
): Promise<SerializedNotification[] | Paginated<SerializedNotification>> {
  if (!opts) {
    const rows = await repo.findAllNotifications();
    return rows.map(serializeNotification);
  }
  const { page, limit, offset } = computePagination(opts);
  const rows = await repo.findAllNotifications({ limit, offset, ...opts });
  return buildPaginated(rows.map(serializeNotification), await repo.countNotifications(opts), page, limit);
}

export const create = async (data: NotificationInput) => {
  await repo.insertNotification(data);
};

export const markRead = async (userId: number, notificationId?: number) => {
  const target = await repo.findTargetNotifications(userId, notificationId);
  for (const notification of target) {
    if (notification.userId === null) {
      await repo.upsertRead(notification.id, userId);
    } else {
      await repo.markAsRead(notification.id);
    }
  }
};

export const remove = async (id: number) => {
  await repo.deleteNotificationById(id);
};