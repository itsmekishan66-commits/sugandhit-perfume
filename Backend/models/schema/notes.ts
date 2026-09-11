import { pgTable, serial, text, boolean } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  layer: text('layer').notNull(),
  icon: text('icon').notNull().default('🌿'),
  color: text('color').notNull().default('#C586A5'),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
});