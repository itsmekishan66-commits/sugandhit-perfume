import { pgTable, serial, text, bigint } from 'drizzle-orm/pg-core';

/**
 * Single-row table holding the shop-wide settings edited from the admin Settings page.
 * Read/written by `modules/settings/settings.service.ts`; the default row comes from
 * `database/seed/settings.ts`.
 */
export const shopSettings = pgTable('shop_settings', {
  id: serial('id').primaryKey(),
  shopName: text('shop_name').notNull().default('Sugandhit Studio'),
  currency: text('currency').notNull().default('NPR'),
  currencySymbol: text('currency_symbol').notNull().default('रू'),
  timezone: text('timezone').notNull().default('Asia/Kathmandu'),
  footerText: text('footer_text').notNull().default(''),
  currencyFormat: text('currency_format').notNull().default('ne-NP'),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});