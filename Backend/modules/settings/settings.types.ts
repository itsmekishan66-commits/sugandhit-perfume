export interface ShopSettings {
  id: number;
  shopName: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  footerText: string;
  currencyFormat: string;
  updatedAt: number;
}

/** Body accepted by `PUT /api/settings`. Every field is optional so a partial save is valid. */
export interface ShopSettingsInput {
  shopName?: string;
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  footerText?: string;
  currencyFormat?: string;
}