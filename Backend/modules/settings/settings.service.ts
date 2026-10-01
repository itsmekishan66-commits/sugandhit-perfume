import { eq } from 'drizzle-orm';
import db from '../../database/client.js';
import { shopSettings } from '../../database/schema/index.js';
import { defaultShopSettings } from '../../database/seed/settings.js';
import { ensureShopSettingsTable } from '../../database/seed/settings.seed.js';
import type { ShopSettings, ShopSettingsInput } from './settings.types.js';

/**
 * Reads the single settings row. `ensureShopSettingsTable` is `create table if not exists`,
 * so this also works on a database that has never been seeded. Falls back to the seeded
 * defaults when the table is empty, so the form still renders usable values.
 */
export const getShopSettings = async (): Promise<ShopSettings> => {
  await ensureShopSettingsTable();
  const row = await db.query.shopSettings.findFirst();
  if (!row) {
    return { id: 0, ...defaultShopSettings, updatedAt: Date.now() };
  }
  return row;
};

/** Upserts the single settings row, merging the incoming fields over the stored ones. */
export const saveShopSettings = async (input: ShopSettingsInput): Promise<ShopSettings> => {
  const existing = await getShopSettings();
  const values = {
    shopName: input.shopName?.trim() || existing.shopName,
    currency: input.currency?.trim() || existing.currency,
    currencySymbol: input.currencySymbol?.trim() || existing.currencySymbol,
    timezone: input.timezone?.trim() || existing.timezone,
    footerText: input.footerText?.trim() ?? existing.footerText,
    currencyFormat: input.currencyFormat?.trim() || existing.currencyFormat,
    updatedAt: Date.now(),
  };

  if (existing.id) {
    await db.update(shopSettings).set(values).where(eq(shopSettings.id, existing.id));
  } else {
    await db.insert(shopSettings).values(values);
  }
  const row = await db.query.shopSettings.findFirst();
  return row ?? ({ id: 0, ...values } as ShopSettings);
};