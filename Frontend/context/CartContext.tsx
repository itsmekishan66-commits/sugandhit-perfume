import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useRef, type ReactNode } from 'react';
import { getToken } from '@/utils/storage';
import { apiCartAdd, apiCartGet, apiCartUpdate } from '@/features/cart/cart.service';
import { apiWishlistAdd, apiWishlistGet, apiWishlistRemove } from '@/features/wishlist/wishlist.service';
import { useAuth } from './AuthContext';
import type { CartItems } from '@/types/common';
import type { Product } from '@/types/product';

const getWishlistCount = (wishlist: string[], products: Product[]) =>
  wishlist.filter((id) => products.some((product) => product._id === id)).length;

const getCartCount = (cartItems: CartItems, products: Product[]) => {
  let totalCount = 0;
  for (const items in cartItems) {
    if (!products.some((product) => product._id === items)) continue;
    for (const item in cartItems[items]) {
      if (cartItems[items][item] > 0) {
        totalCount += cartItems[items][item];
      }
    }
  }
  return totalCount;
};

const getCartAmount = (cartItems: CartItems, products: Product[]) => {
  let totalAmount = 0;
  for (const items in cartItems) {
    const itemInfo = products.find((product) => product._id === items);
    if (!itemInfo) continue;
    const variants = itemInfo.variants || [];
    for (const item in cartItems[items]) {
      if (cartItems[items][item] > 0) {
        const variant = variants.find((v) => v.name === item);
        const unitPrice = variant ? Number(variant.price) || Number(itemInfo.price) : Number(itemInfo.price);
        totalAmount += unitPrice * cartItems[items][item];
      }
    }
  }
  return totalAmount;
};

interface CartState {
  cartItems: CartItems;
  wishlist: string[];
  cartToast: string | null;
  setCartItems: (cartItems: CartItems) => void;
  setWishlist: (wishlist: string[]) => void;
  setCartToast: (message: string | null) => void;
  addToCart: (itemId: string, colors: string, qty?: number) => Promise<void>;
  updateQuantity: (itemId: string, colors: string, quantity: number) => Promise<void>;
  toggleWishlist: (itemId: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  hydrateFromServer: (token: string) => Promise<void>;
  clearAll: () => void;
}

const mergeLegacyState = (persistedState: unknown, currentState: CartState) => {
  const persisted = persistedState as Partial<CartState> | undefined;
  if (persisted && typeof persisted.cartItems === 'object' && Array.isArray(persisted.wishlist)) {
    return { ...currentState, ...persisted };
  }
  try {
    const legacyCart = localStorage.getItem('cartItems');
    const legacyWishlist = localStorage.getItem('wishlist');
    if (legacyCart) currentState.cartItems = JSON.parse(legacyCart);
    if (legacyWishlist) currentState.wishlist = JSON.parse(legacyWishlist);
  } catch {
    // ignore malformed legacy data
  }
  return currentState;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: {},
      wishlist: [],
      cartToast: null,

      setCartItems: (cartItems) => set({ cartItems }),
      setWishlist: (wishlist) => set({ wishlist }),
      setCartToast: (cartToast) => set({ cartToast }),

      addToCart: async (itemId, colors, qty = 1) => {
        if (!colors) {
          set({ cartToast: 'Select Product Details.' });
          return;
        }
        const cartData = structuredClone(get().cartItems);
        if (cartData[itemId]) {
          cartData[itemId][colors] = (cartData[itemId][colors] || 0) + qty;
        } else {
          cartData[itemId] = {};
          cartData[itemId][colors] = qty;
        }
        set({ cartItems: cartData });
        const token = getToken();
        if (token) {
          try {
            const ok = await apiCartAdd(token, itemId, colors, qty);
            set({ cartToast: ok ? 'Added to cart' : 'Failed to add to cart' });
          } catch (error) {
            console.log(error);
            set({ cartToast: (error as Error).message });
          }
        } else {
          set({ cartToast: 'Added to cart' });
        }
      },

      updateQuantity: async (itemId, colors, quantity) => {
        const cartData = structuredClone(get().cartItems);
        if (cartData[itemId]) {
          if (quantity <= 0) {
            set({ cartToast: 'Item has been removed from cart' });
            delete cartData[itemId][colors];
            if (Object.keys(cartData[itemId]).length === 0) {
              delete cartData[itemId];
            }
          } else {
            cartData[itemId][colors] = quantity;
          }
        }
        set({ cartItems: cartData });
        const token = getToken();
        if (token) {
          try {
            const ok = await apiCartUpdate(token, itemId, colors, quantity);
            if (!ok) {
              set({ cartToast: 'Failed to update cart' });
            }
          } catch (error) {
            console.log(error);
            set({ cartToast: (error as Error).message });
          }
        }
      },

      toggleWishlist: async (itemId) => {
        const adding = !get().wishlist.includes(itemId);
        set((state) => ({
          wishlist: adding ? [...state.wishlist, itemId] : state.wishlist.filter((id) => id !== itemId),
        }));
        set({ cartToast: adding ? 'Added to wishlist' : 'Removed from wishlist' });
        const token = getToken();
        if (token) {
          try {
            const ok = adding ? await apiWishlistAdd(token, itemId) : await apiWishlistRemove(token, itemId);
            if (!ok) {
              set((state) => ({
                wishlist: adding ? state.wishlist.filter((id) => id !== itemId) : [...state.wishlist, itemId],
              }));
              set({ cartToast: 'Failed to update wishlist' });
            }
          } catch (error) {
            set((state) => ({
              wishlist: adding ? state.wishlist.filter((id) => id !== itemId) : [...state.wishlist, itemId],
            }));
            console.log(error);
            set({ cartToast: (error as Error).message });
          }
        }
      },

      removeFromWishlist: async (itemId) => {
        set((state) => ({ wishlist: state.wishlist.filter((id) => id !== itemId) }));
        set({ cartToast: 'Removed from wishlist' });
        const token = getToken();
        if (token) {
          try {
            const ok = await apiWishlistRemove(token, itemId);
            if (!ok) {
              set({ cartToast: 'Failed to update wishlist' });
            }
          } catch (error) {
            console.log(error);
            set({ cartToast: (error as Error).message });
          }
        }
      },

      hydrateFromServer: async (token) => {
        try {
          const cartData = await apiCartGet(token);
          set({ cartItems: cartData });
        } catch (error) {
          console.log(error);
        }
        try {
          const wishlist = await apiWishlistGet(token);
          set({ wishlist });
        } catch (error) {
          console.log(error);
        }
      },

      clearAll: () => {
        set({ cartItems: {}, wishlist: [], cartToast: null });
        localStorage.removeItem('cartItems');
        localStorage.removeItem('wishlist');
      },
    }),
    {
      name: 'sugandhit-shop-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cartItems: state.cartItems, wishlist: state.wishlist }),
      merge: mergeLegacyState,
      version: 1,
    }
  )
);

const CartProvider = ({ children }: { children: ReactNode }) => {
  const token = useAuth().token;
  const prevToken = useRef('');

  useEffect(() => {
    if (token === prevToken.current) return;
    const prev = prevToken.current;
    prevToken.current = token;
    if (token) {
      useCart.getState().hydrateFromServer(token).catch(() => undefined);
    } else if (prev !== '') {
      useCart.getState().clearAll();
    }
  }, [token]);

  return children;
};

export { CartProvider, getCartAmount, getCartCount, getWishlistCount };
export default CartProvider;