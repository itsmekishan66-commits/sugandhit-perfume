import { pgTable, serial, integer, boolean, unique } from 'drizzle-orm/pg-core';

export const notificationreads = pgTable(
  'notificationreads',
  {
    id: serial('id').primaryKey(),
    notificationId: integer('notification_id').notNull(),
    userId: integer('user_id').notNull(),
    read: boolean('read').notNull().default(false),
  },
  (t) => [
    unique('notificationreads_notification_user_unique').on(t.notificationId, t.userId),
  ]
);