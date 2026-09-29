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

/** A note layer entry carried inside a custom blend (cart item or order). */
export interface CustomBlendNote {
  name: string;
  icon: string;
  color: string;
}

/** A custom blend stored in the cart (local to the client, persisted via zustand). */
export interface CustomBlendCartItem {
  key: string;
  name: string;
  bottleSize: string;
  bottleType: string;
  bottleTypeName: string;
  topNotes: CustomBlendNote[];
  heartNotes: CustomBlendNote[];
  baseNotes: CustomBlendNote[];
  perfumeBase: string;
  strength: string;
  strengthName: string;
  customLabel: string;
  /** Blend value only (size + base extra). Delivery is charged once at checkout. */
  price: number;
  qty: number;
}

/** Custom order returned by the backend `/api/custom-order/*` endpoints. */
export interface ApiCustomOrder extends ApiOrder {
  name?: string;
  bottleSize?: string;
  bottleType?: string;
  topNotes?: CustomBlendNote[];
  heartNotes?: CustomBlendNote[];
  baseNotes?: CustomBlendNote[];
  perfumeBase?: string;
  strength?: string;
  strengthName?: string;
  customLabel?: string;
  address?: Record<string, string>;
  paymentMethod?: string;
}

export interface OrderDisplay {
  type: OrderType;
  _id: string;
  date: number;
  status: string;
  name: string;
  amount: number;
}