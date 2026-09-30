// Types local to the users feature.
// Props interfaces stay inline in their component files.

export interface HistoryOrder {
  _id: string;
  id: number;
  items?: { name?: string; quantity?: number; price?: string | number; subCategory?: string; image?: string[] }[];
  name?: string;
  bottleSize?: string;
  bottleType?: string;
  status: string;
  paymentMethod?: string;
  payment?: boolean;
  amount: string | number;
  date: string | number;
  address?: Record<string, string>;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: Record<string, string> | string;
  image?: string;
  credit: number | string;
  createdAt: string;
}

export interface UserDetail {
  user: Customer;
  orders: HistoryOrder[];
  customOrders: HistoryOrder[];
}

export type Tab ='customers' |'admins';
