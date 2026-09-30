// Types local to the dashboard feature.
// Props interfaces stay inline in their component files.

export interface ChartOrder {
  items?: { name?: string; price?: string | number; quantity?: string | number }[];
  amount?: string | number;
  status?: string;
  date?: string | number;
}

export interface ChartProduct {
  name?: string;
  category?: string;
  subCategory?: string;
  price?: string | number;
}

export interface ChartCoupon {
  code?: string;
  discountType?: string;
  discountValue?: string | number;
  active?: boolean;
}

export interface ChartNotification {
  type?: string;
}

export interface ApiOrder {
  _id?: string;
  name?: string;
  items?: { name?: string }[];
  status?: string;
  amount?: string | number;
  date?: string | number;
  userId?: number;
}

export interface Stats {
  products: number;
  orders: number;
  custom: number;
  revenue: number;
  pending: number;
  totalCustomers: number;
  expense: number;
}

export interface RecentItem {
  type: string;
  _id?: string;
  name?: string;
  items?: { name?: string }[];
  amount?: string | number;
  date?: string | number;
}
