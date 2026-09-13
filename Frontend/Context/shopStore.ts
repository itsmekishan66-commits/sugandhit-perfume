import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toast } from 'react-toastify';
import type { CartItems, Product } from './ShopContextObject';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const fetchApi = async (url: string, options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  if (options.body && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  return { response, data, success: response.ok };
};

const tokenFromStorage = () => localStorage.getItem('token') || '';

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
    for (const item in cartItems[items]) {
      if (cartItems[items][item] > 0 && itemInfo) {
        totalAmount += Number(itemInfo.price) * cartItems[items][item];
      }
    }
  }
  return totalAmount;
};

interface ShopState {
  cartItems: CartItems;
  wishlist: string[];
  setCartItems: (cartItems: CartItems) => void;
  setWishlist: (wishlist: string[]) => void;
  addToCart: (itemId: string, colors: string, qty?: number) => Promise<void>;
  updateQuantity: (itemId: string, colors: string, quantity: number) => Promise<void>;
  toggleWishlist: (itemId: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  hydrateFromServer: (token: string) => Promise<void>;
  clearAll: () => void;
}

const mergeLegacyState = (persistedState: unknown, currentState: ShopState) => {
  const persisted = persistedState as Partial<ShopState> | undefined;
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

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      cartItems: {},
      wishlist: [],

      setCartItems: (cartItems) => set({ cartItems }),

      setWishlist: (wishlist) => set({ wishlist }),

      addToCart: async (itemId, colors, qty = 1) => {
        if (!colors) {
          toast.error("Select Product Details.");
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
        const token = tokenFromStorage();
        if (token) {
          try {
            const { success } = await fetchApi(backendUrl + '/api/cart/add', {
              method: 'POST',
              body: { itemId, colors, quantity: qty },
              headers: { token }
            });
            if (!success) {
              toast.error("Failed to add to cart");
            } else {
              toast.success("Added to cart");
            }
          } catch (error) {
            console.log(error);
            toast.error((error as Error).message);
          }
        } else {
          toast.success("Added to cart");
        }
      },

      updateQuantity: async (itemId, colors, quantity) => {
        const cartData = structuredClone(get().cartItems);
        if (cartData[itemId]) {
          if (quantity <= 0) {
            toast.info("Item has been removed from cart");
            delete cartData[itemId][colors];
            if (Object.keys(cartData[itemId]).length === 0) {
              delete cartData[itemId];
            }
          } else {
            cartData[itemId][colors] = quantity;
          }
        }
        set({ cartItems: cartData });
        const token = tokenFromStorage();
        if (token) {
          try {
            const { success } = await fetchApi(backendUrl + '/api/cart/update', {
              method: 'POST',
              body: { itemId, colors, quantity },
              headers: { token }
            });
            if (!success) {
              toast.error("Failed to update cart");
            }
          } catch (error) {
            console.log(error);
            toast.error((error as Error).message);
          }
        }
      },

      toggleWishlist: async (itemId) => {
        const adding = !get().wishlist.includes(itemId);
        set((state) => ({ wishlist: adding ? [...state.wishlist, itemId] : state.wishlist.filter((id) => id !== itemId) }));
        if (adding) {
          toast.success("Added to wishlist");
        } else {
          toast.info("Removed from wishlist");
        }
        const token = tokenFromStorage();
        if (token) {
          try {
            const { success } = await fetchApi(backendUrl + `/api/wishlist/${adding ? 'add' : 'remove'}`, {
              method: 'POST',
              body: { productId: itemId },
              headers: { token }
            });
            if (!success) {
              set((state) => ({ wishlist: adding ? state.wishlist.filter((id) => id !== itemId) : [...state.wishlist, itemId] }));
              toast.error("Failed to update wishlist");
            }
          } catch (error) {
            set((state) => ({ wishlist: adding ? state.wishlist.filter((id) => id !== itemId) : [...state.wishlist, itemId] }));
            console.log(error);
            toast.error((error as Error).message);
          }
        }
      },

      removeFromWishlist: async (itemId) => {
        set((state) => ({ wishlist: state.wishlist.filter((id) => id !== itemId) }));
        toast.info("Removed from wishlist");
        const token = tokenFromStorage();
        if (token) {
          try {
            const { success } = await fetchApi(backendUrl + '/api/wishlist/remove', {
              method: 'POST',
              body: { productId: itemId },
              headers: { token }
            });
            if (!success) {
              toast.error("Failed to update wishlist");
            }
          } catch (error) {
            console.log(error);
            toast.error((error as Error).message);
          }
        }
      },

      hydrateFromServer: async (token) => {
        try {
          const cart = await fetchApi(backendUrl + '/api/cart/get', {
            method: 'POST',
            body: {},
            headers: { token }
          });
          if (cart.success && cart.data.success) {
            set({ cartItems: cart.data.cartData || {} });
          }
        } catch (error) {
          console.log(error);
          toast.error((error as Error).message);
        }
        try {
          const wishlist = await fetchApi(backendUrl + '/api/wishlist/get', {
            method: 'POST',
            body: {},
            headers: { token }
          });
          if (wishlist.success && wishlist.data.success) {
            set({ wishlist: wishlist.data.wishlist || [] });
          }
        } catch (error) {
          console.log(error);
          toast.error((error as Error).message);
        }
      },

      clearAll: () => {
        set({ cartItems: {}, wishlist: [] });
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

export { getCartAmount, getCartCount, getWishlistCount };