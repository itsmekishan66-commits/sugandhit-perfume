import { sql } from 'drizzle-orm';
import db from '../client.js';
import { notes, perfumebases, bottlesizes, bottletypes, customizationSettings } from '../schema/index.js';
import { defaultNotes, defaultBases, defaultSizes, defaultBottleTypes, defaultCustomizationSettings } from './customization.js';

/**
 * Seeds everything shown on the frontend /customize page. The default rows live in
 * `customization.ts`; this file holds the DDL and the inserts, one block per table:
 *   - notes                -> defaultNotes
 *   - perfumebases         -> defaultBases
 *   - bottlesizes          -> defaultSizes
 *   - bottletypes          -> defaultBottleTypes
 *   - customization_settings -> defaultCustomizationSettings
 */

/**
 * Creates the /customize tables so `npm run db:seed` works without a prior push/migrate.
 * Every statement is `if not exists`, so this is safe to run against a seeded database.
 */
export const ensureCustomizationTables = async () => {
  await db.execute(sql`
    create table if not exists notes (
      id serial primary key,
      name text not null,
      layer text not null,
      icon text not null default '🌿',
      color text not null default '#C586A5',
      description text not null default '',
      price numeric(12,2) not null default '0',
      active boolean not null default true
    )
  `);
  await db.execute(sql`alter table notes add column if not exists price numeric(12,2) not null default '0'`);
  await db.execute(sql`
    create table if not exists perfumebases (
      id serial primary key,
      name text not null,
      code text not null,
      description text not null default '',
      extra_price numeric(12,2) not null default '0',
      active boolean not null default true
    )
  `);
  await db.execute(sql`
    create table if not exists bottlesizes (
      id serial primary key,
      label text not null,
      ml text not null,
      price numeric(12,2) not null default '0',
      description text not null default '',
      active boolean not null default true
    )
  `);
  await db.execute(sql`
    create table if not exists bottletypes (
      id serial primary key,
      name text not null,
      code text not null,
      description text not null default '',
      image text not null default '',
      extra_price numeric(12,2) not null default '0',
      active boolean not null default true
    )
  `);
  await db.execute(sql`alter table bottletypes add column if not exists image text not null default ''`);
  await db.execute(sql`
    create table if not exists customization_settings (
      id serial primary key,
      max_notes_per_layer integer not null default 3,
      delivery_fee numeric(12,2) not null default '100',
      updated_at bigint not null
    )
  `);
};

/** Writes the default rows, skipping any table that already has rows. */
export const seedCustomization = async () => {
  await ensureCustomizationTables();

  // Notes (top / heart / base)
  const { rows: noteRows } = await db.execute(sql`select count(*) as total from notes`);
  if (Number(noteRows[0].total) === 0 && defaultNotes.length) {
    await db.insert(notes).values(defaultNotes);
    console.log(`Notes seeded (${defaultNotes.length})`);
  } else {
    console.log('Notes already seeded.');
  }

  // Bases
  const { rows: baseRows } = await db.execute(sql`select count(*) as total from perfumebases`);
  if (Number(baseRows[0].total) === 0 && defaultBases.length) {
    await db.insert(perfumebases).values(defaultBases);
    console.log(`Perfume bases seeded (${defaultBases.length})`);
  } else {
    console.log('Perfume bases already seeded.');
  }

  // Sizes
  const { rows: sizeRows } = await db.execute(sql`select count(*) as total from bottlesizes`);
  if (Number(sizeRows[0].total) === 0 && defaultSizes.length) {
    await db.insert(bottlesizes).values(defaultSizes);
    console.log(`Bottle sizes seeded (${defaultSizes.length})`);
  } else {
    console.log('Bottle sizes already seeded.');
  }

  // Bottle types
  const { rows: typeRows } = await db.execute(sql`select count(*) as total from bottletypes`);
  if (Number(typeRows[0].total) === 0 && defaultBottleTypes.length) {
    await db.insert(bottletypes).values(defaultBottleTypes);
    console.log(`Bottle types seeded (${defaultBottleTypes.length})`);
  } else {
    console.log('Bottle types already seeded.');
  }

  // The customorders table is owned by the orders schema — add the column only if it exists.
  const { rows: customOrdersTable } = await db.execute(sql`select to_regclass('public.customorders') as table`);
  if (customOrdersTable[0].table) {
    await db.execute(sql`alter table customorders add column if not exists bottle_type text not null default ''`);
  }

  // Settings (single row — upsert)
  await db.execute(sql`delete from customization_settings`);
  await db.insert(customizationSettings).values({
    maxNotesPerLayer: defaultCustomizationSettings.maxNotesPerLayer,
    deliveryFee: defaultCustomizationSettings.deliveryFee,
    updatedAt: Date.now(),
  });
  console.log(
    `Customization settings seeded (max notes ${defaultCustomizationSettings.maxNotesPerLayer}, delivery fee Rs. ${defaultCustomizationSettings.deliveryFee})`
  );

  console.log('Customization seed complete ✓');
};
