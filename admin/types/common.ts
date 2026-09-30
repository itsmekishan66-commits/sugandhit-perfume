export interface CustomerRef {
  id: number;
  name?: string;
  phone?: string;
}

export interface Coupon {
  _id: string;
  id?: number;
  code: string;
  description?: string;
  discountType?: string;
  discountValue?: string | number;
  minOrder?: string | number;
  maxDiscount?: string | number;
  active?: boolean;
  expiresAt?: number;
}

export interface AppNotification {
  _id: string;
  id?: number;
  title?: string;
  body?: string;
  type?: string;
  active?: boolean;
  segment?: string;
  createdAt: number;
}
