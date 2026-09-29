import { createContext, useContext } from 'react';
import type { Palette, Product } from '@/types/product';
import type { AppNotification, Coupon } from '@/types/common';

export interface AppContextValue {
  search: string;
  setSearch: (value: string) => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  products: Product[];
  palette: Palette;
  paletteLoaded: boolean;
  coupons: Coupon[];
  notifications: AppNotification[];
  unreadNotifications: number;
  refreshNotifications: () => Promise<void>;
  markNotificationsRead: (id?: string) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}