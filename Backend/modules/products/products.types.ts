export interface SerializedProduct {
  id: number;
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string[];
  category: string;
  subCategory: string;
  colors: ProductVariant[];
  variants: ProductVariant[];
  sku: string | null;
  cost: number;
  stock: number;
  reorderLevel: number;
  bestseller: boolean;
  rating: number;
  reviews: number;
  badge: string | null;
  date: number;
}

export interface ProductVariant {
  name: string;
  price: string;
  description: string;
  image: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: string;
  category: string;
  subCategory: string;
  variants?: { name: string; price: string; description: string; image: string }[];
  bestseller?: string;
  image: string[];
  date: number;
}