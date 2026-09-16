import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import db from '../../database/client.js';
import { notifications, notificationreads } from '../../database/schema/index.js';
import type { NotificationInput } from './notifications.types.js';

export const insertNotification = async (data: NotificationInput) => {
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

export const findAllNotifications = async () =>
  db.select().from(notifications).orderBy(desc(notifications.createdAt));

export const findNotificationsForUser = async (userId: number) =>
  db
    .select()
    .from(notifications)
    .where(or(isNull(notifications.userId), eq(notifications.userId, Number(userId))))
    .orderBy(desc(notifications.createdAt));

export const findReadsForUser = async (notificationIds: number[], userId: number) => {
  if (notificationIds.length === 0) return [];
  return db
    .select()
    .from(notificationreads)
    .where(
      and(inArray(notificationreads.notificationId, notificationIds), eq(notificationreads.userId, Number(userId)))
    );
};

export const findTargetNotifications = async (userId: number, notificationId?: number) => {
  if (notificationId) {
    return db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          or(isNull(notifications.userId), eq(notifications.userId, Number(userId)))
        )
      )
      .limit(1);
  }
  return db
    .select()
    .from(notifications)
    .where(or(isNull(notifications.userId), eq(notifications.userId, Number(userId))));
};

export const upsertRead = async (notificationId: number, userId: number) => {
  await db
    .insert(notificationreads)
    .values({ notificationId, userId, read: true })
    .onConflictDoUpdate({
      target: [notificationreads.notificationId, notificationreads.userId],
      set: { read: true },
    });
};

export const markAsRead = async (notificationId: number) => {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
};

export const deleteNotificationById = async (id: number) => {
  await db.delete(notifications).where(eq(notifications.id, id));
};