import { pgTable, serial, integer, text, boolean, bigint } from 'drizzle-orm/pg-core';

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