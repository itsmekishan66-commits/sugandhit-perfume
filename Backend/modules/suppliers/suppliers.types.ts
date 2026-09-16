export interface SupplierInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  notes?: string;
  createdBy?: number;
}

export interface SerializedSupplier {
  id: number;
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  notes: string;
  active: boolean;
  createdBy: number | null;
  createdAt: number;
}
