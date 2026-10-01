import { sql } from 'drizzle-orm';
import db from '../client.js';
import { shopSettings } from '../schema/index.js';
import { defaultShopSettings } from './settings.js';

/**
 * Seeds the single-row `shop_settings` table behind the admin Settings page.
 * The default values live in `settings.ts`; this file holds the DDL and the insert.
 */

/**
 * Creates the table so `npm run db:seed` works without a prior push/migrate.
 * Every statement is `if not exists`, so this is safe to run against a live database.
 */
export const ensureShopSettingsTable = async () => {
  await db.execute(sql`
    create table if not exists shop_settings (
      id serial primary key,
      shop_name text not null default 'Sugandhit Studio',
      currency text not null default 'NPR',
      currency_symbol text not null default 'रू',
      timezone text not null default 'Asia/Kathmandu',
      footer_text text not null default '',
      currency_format text not null default 'ne-NP',
      updated_at bigint not null
    )
  `);
};

/** Writes the default row, replacing any existing one (single-row table, like customization_settings). */
export const seedShopSettings = async () => {
  await ensureShopSettingsTable();
  await db.execute(sql`delete from shop_settings`);
  await db.insert(shopSettings).values({ ...defaultShopSettings, updatedAt: Date.now() });
  console.log(`Shop settings seeded (${defaultShopSettings.shopName}, ${defaultShopSettings.currency})`);
};