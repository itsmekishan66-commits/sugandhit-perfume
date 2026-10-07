import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import { notifications, notificationreads } from '../../database/schema/index.js';
import type { NotificationInput } from './notifications.types.js';

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

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

export interface NotificationListFilters {
  search?: string;
  type?: string;
}

const buildAdminWhere = (filters: NotificationListFilters = {}) => {
  const conditions: (ReturnType<typeof sql> | undefined)[] = [];
  if (filters.search) {
    const q = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        sql`${notifications.id}::text ilike ${q}`,
        ilike(notifications.title, q),
        ilike(notifications.message, q),
        ilike(notifications.link, q),
        sql`${notifications.userId}::text ilike ${q}`
      )
    );
  }
  if (filters.type) conditions.push(eq(notifications.type, filters.type));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const findAllNotifications = async (opts?: { limit?: number; offset?: number } & NotificationListFilters) => {
  const where = buildAdminWhere(opts);
  const query = db.select().from(notifications).where(where ?? sql`1=1`).orderBy(desc(notifications.createdAt));
  return opts ? query.limit(opts.limit ?? 50).offset(opts.offset ?? 0) : query;
};

export const countNotifications = async (filters: NotificationListFilters = {}) => {
  const where = buildAdminWhere(filters);
  const rows = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(where ?? sql`1=1`);
  return Number(rows[0]?.count ?? 0);
};

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