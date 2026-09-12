import { createContext } from 'react';

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

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: Record<string, string>;
  createdAt?: string;
}

export type CartItems = Record<string, Record<string, number>>;

export interface ShopContextType {
  products: Product[];
  currency: string;
  delivery_fee: number;
  search: string;
  setSearch: (s: string) => void;
  showSearch: boolean;
  setShowSearch: (b: boolean) => void;
  cartItems: CartItems;
  setCartItems: React.Dispatch<React.SetStateAction<CartItems>>;
  addToCart: (itemId: string, colors: string, qty?: number) => void;
  getCartCount: () => number;
  updateQuantity: (itemId: string, colors: string, quantity: number) => void;
  getCartAmount: () => number;
  navigate: (to: string) => void;
  backendUrl: string;
  token: string;
  setToken: (t: string) => void;
  palette: Palette;
  userProfile: UserProfile | null;
  getUserProfile: (token: string) => void;
  updateUserProfile: (data: { name: string; phone: string; address: Record<string, string> }) => Promise<boolean>;
  logout: () => void;
  wishlist: string[];
  toggleWishlist: (itemId: string) => void;
  removeFromWishlist: (itemId: string) => void;
  isInWishlist: (itemId: string) => boolean;
}

export const ShopContext = createContext<ShopContextType>(null as unknown as ShopContextType);