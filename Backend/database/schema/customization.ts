import { pgTable, serial, text, numeric, boolean, integer, bigint } from 'drizzle-orm/pg-core';

/**
 * Tables backing the frontend /customize page. Each one is seeded from the matching
 * export in `database/seed/customization.ts` and read back per-table by
 * `modules/notes/notes.repository.ts`.
 */

export const notes = pgTable('notes_custom', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  layer: text('layer').notNull(),
  icon: text('icon').notNull().default('🌿'),
  color: text('color').notNull().default('#C586A5'),
  description: text('description').notNull().default(''),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
});

export const perfumebases = pgTable('perfumebases_custom', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull().default(''),
  extraPrice: numeric('extra_price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
});

export const bottlesizes = pgTable('bottlesizes_custom', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  ml: text('ml').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
  description: text('description').notNull().default(''),
  active: boolean('active').notNull().default(true),
});

export const bottletypes = pgTable('bottletypes_custom', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull().default(''),
  image: text('image').notNull().default(''),
  extraPrice: numeric('extra_price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
});

export const customizationSettings = pgTable('customization_settings', {
  id: serial('id').primaryKey(),
  maxNotesPerLayer: integer('max_notes_per_layer').notNull().default(3),
  deliveryFee: numeric('delivery_fee', { precision: 12, scale: 2 }).notNull().default('100'),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});