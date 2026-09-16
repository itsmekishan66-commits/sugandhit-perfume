export type CartItems = Record<string, Record<string, number>>;

export interface Coupon {
  _id: string;
  code: string;
  title: string;
  description: string;
  image: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  validTill: number;
  validFrom: number;
  active: boolean;
}

export type AppNotificationType = 'order' | 'promo' | 'sale' | 'system';

export interface AppNotification {
  _id: string;
  userId?: number | null;
  type: AppNotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: number;
}

export type OrderType = 'custom' | 'order';

export interface ApiOrder {
  _id: string;
  date: number;
  status: string;
  amount: number;
  name?: string;
  items?: { name: string }[];
}

export interface OrderDisplay {
  type: OrderType;
  _id: string;
  date: number;
  status: string;
  name: string;
  amount: number;
}