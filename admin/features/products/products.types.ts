// Types local to the products feature.
// Props interfaces stay inline in their component files.

export interface VariantLike {
  name?: string;
  price?: string | number;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  id: number;
  name: string;
  category: string;
  subCategory?: string;
  price: string | number;
  image: string[];
  description?: string;
  variants?: VariantLike[];
  sku?: string | null;
  cost?: number;
  stock?: number;
  reorderLevel?: number;
  bestseller?: boolean;
  rating?: number;
  reviews?: number;
  badge?: string | null;
  date?: number;
}
