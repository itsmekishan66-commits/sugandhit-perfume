import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import db from '../config/db.js';
import { notifications, notificationreads } from '../models/schema/index.js';
import { serializeNotification } from '../utils/helper.js';

interface NotificationInput {
  userId?: number | null;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export const createNotification = async (data: NotificationInput) => {
  await db.insert(notifications).values({
    userId: data.userId ?? null,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link || '',
    read: false,
    createdAt: Date.now(),
  });
};

export const listAllNotifications = async () => {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  return rows.map(serializeNotification);
};

export const listUserNotifications = async (userId: number) => {
  const userNotifications = await db
    .select()
    .from(notifications)
    .where(or(isNull(notifications.userId), eq(notifications.userId, Number(userId))))
    .orderBy(desc(notifications.createdAt));

  const ids = userNotifications.map((n) => n.id);
  const reads =
    ids.length === 0
      ? []
      : await db
          .select()
          .from(notificationreads)
          .where(and(inArray(notificationreads.notificationId, ids), eq(notificationreads.userId, Number(userId))));

  const readsMap = new Map(reads.map((r) => [r.notificationId, r.read]));

  return userNotifications.map((n) => {
    const isBroadcast = n.userId === null;
    const read = isBroadcast ? (readsMap.get(n.id) ?? false) : n.read;
    return serializeNotification({ ...n, read });
  });
};

export const unreadCount = async (userId: number) => {
  const notifications_ = await db
    .select()
    .from(notifications)
    .where(or(isNull(notifications.userId), eq(notifications.userId, Number(userId))));

  const ids = notifications_.map((n) => n.id);
  const reads =
    ids.length === 0
      ? []
      : await db
          .select()
          .from(notificationreads)
          .where(and(inArray(notificationreads.notificationId, ids), eq(notificationreads.userId, Number(userId))));

  const readsMap = new Map(reads.map((r) => [r.notificationId, r.read]));

  const unread = notifications_.filter((n) => {
    if (n.userId === null) {
      return !(readsMap.get(n.id) ?? false);
    }
    return !n.read;
  });

  return unread.length;
};

export const markNotificationRead = async (userId: number, notificationId?: number) => {
  const target = notificationId
    ? await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, notificationId), or(isNull(notifications.userId), eq(notifications.userId, Number(userId)))))
        .limit(1)
    : await db
        .select()
        .from(notifications)
        .where(or(isNull(notifications.userId), eq(notifications.userId, Number(userId))));

  for (const notification of target) {
    if (notification.userId === null) {
      await db
        .insert(notificationreads)
        .values({ notificationId: notification.id, userId: Number(userId), read: true })
        .onConflictDoUpdate({ target: [notificationreads.notificationId, notificationreads.userId], set: { read: true } });
    } else {
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, notification.id));
    }
  }
};

export const deleteNotification = async (id: number) => {
  await db.delete(notifications).where(eq(notifications.id, id));
};