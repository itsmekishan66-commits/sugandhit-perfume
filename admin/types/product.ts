export interface ProductVariant {
  _id?: string;
  name?: string;
  price?: string | number;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  id: number;
  name: string;
  description?: string;
  price: string | number;
  image?: string;
  category?: string;
  subCategory?: string;
  bestseller?: boolean;
  color?: string;
  size?: string;
  stock: number;
  reorderLevel?: number | null;
  variants?: ProductVariant[];
  createdAt: number;
}

export interface ProductOption {
  id: number;
  name: string;
  sku?: string | null;
  price?: number | string;
}
