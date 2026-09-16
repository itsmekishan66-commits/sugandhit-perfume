export interface PlaceOrderInput {
  userId: number;
  items: Record<string, unknown>[];
  amount: string;
  address: Record<string, string>;
}

export interface PlaceCustomOrderInput {
  userId: number;
  name?: string;
  bottleSize?: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  perfumeBase: string;
  strength?: string;
  strengthName?: string;
  customLabel?: string;
  amount: string;
  address: Record<string, string>;
}

export interface SerializedOrder {
  id: number;
  _id: string;
  userId: number;
  items: Record<string, unknown>[];
  amount: number;
  address: Record<string, string>;
  status: string;
  paymentMethod: string;
  payment: boolean;
  date: number;
}

export interface SerializedCustomOrder {
  id: number;
  _id: string;
  userId: number;
  name: string;
  bottleSize: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  perfumeBase: string;
  strength: string;
  strengthName: string;
  customLabel: string;
  amount: number;
  status: string;
  paymentMethod: string;
  payment: boolean;
  address: Record<string, string>;
  date: number;
}

export interface OrderItem {
  id?: number | string;
  name?: string;
  quantity?: number | string;
}
