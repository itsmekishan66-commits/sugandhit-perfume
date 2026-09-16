export interface ProductVariant {
  name: string;
  price: string;
  description: string;
  image: string;
}

export interface Product {
  _id: string;
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: string;
  subCategory: string;
  bestseller: boolean;
  colors: string[];
  variants?: ProductVariant[];
  image: string[];
  date: number;
  reviews: number;
  badge?: string;
  popular?: boolean;
}

export interface Note {
  id: string;
  name: string;
  layer: string;
  icon: string;
  color: string;
  description: string;
}

export interface PaletteBase {
  id: string;
  name: string;
  code: string;
  description: string;
  extraPrice: number;
  active: boolean;
}

export interface Palette {
  top: Note[];
  heart: Note[];
  base: Note[];
  bases: PaletteBase[];
}