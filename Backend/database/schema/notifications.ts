import { pgTable, serial, integer, text, boolean, bigint, unique } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link').notNull().default(''),
  read: boolean('read').notNull().default(false),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

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