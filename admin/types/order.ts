import type { CustomerRef } from './common';

export interface OrderItem {
  productId?: number;
  name?: string;
  price?: string | number;
  quantity?: string | number;
  image?: string;
  notes?: string;
}

export interface Order {
  _id: string;
  id: number;
  items: OrderItem[];
  customer?: CustomerRef | null;
  status: string;
  payment?: string;
  amounts?: Record<string, number>;
  amount?: number;
  address?: Record<string, unknown>;
  date: number;
  createdAt: number;
}
