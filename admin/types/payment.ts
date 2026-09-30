import type { CustomerRef } from './common';

export interface PaymentAccount {
  _id: string;
  id: number;
  name: string;
  type: string;
  balance: number;
}

export interface PaymentTransaction {
  _id: string;
  id: number;
  type: string;
  status: string;
  channel?: string;
  amount: number;
  reference?: string;
  account?: { id: number; name: string } | null;
  order?: { id: number } | null;
  customer?: CustomerRef | null;
  note?: string;
  createdAt: number;
}

export interface DebtEntry {
  _id: string;
  id: number;
  type: string;
  status: string;
  amount: number;
  paid?: number;
  customer?: CustomerRef | null;
  account?: { id: number; name: string } | null;
  dueDate?: number;
  note?: string;
  createdAt: number;
}

export interface Refund {
  _id: string;
  id: number;
  status: string;
  type: string;
  amount: number;
  account?: { id: number; name: string } | null;
  order?: { id: number } | null;
  customer?: CustomerRef | null;
  note?: string;
  createdAt: number;
}

export interface ReconItem {
  _id: string;
  id: number;
  status: string;
  amount: number;
  reference?: string;
  internal?: { id: number; name?: string } | null;
  external?: { id: number; name?: string } | null;
  createdAt: number;
}
