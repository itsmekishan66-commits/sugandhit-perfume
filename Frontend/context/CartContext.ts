import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getToken } from '@/utils/storage';
import { apiCartAdd, apiCartGet, apiCartUpdate } from '@/features/cart/cart.service';
import { apiWishlistAdd, apiWishlistGet, apiWishlistRemove } from '@/features/wishlist/wishlist.service';
import { showToast } from '@/components/feedback/toast';
import type { CartItems, CustomBlendCartItem } from '@/types/common';
import type { Product } from '@/types/product';

export const getWishlistCount = (wishlist: string[], products: Product[]) =>
  wishlist.filter((id) => products.some((product) => product._id === id)).length;

export const getCartCount = (
  cartItems: CartItems,
  products: Product[],
  customBlends: CustomBlendCartItem[] = []
) => {
  let totalCount = customBlends.reduce((sum, blend) => sum + (Number(blend.qty) || 0), 0);
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

export const getCartAmount = (
  cartItems: CartItems,
  products: Product[],
  customBlends: CustomBlendCartItem[] = []
) => {
  let totalAmount = customBlends.reduce(
    (sum, blend) => sum + (Number(blend.price) || 0) * (Number(blend.qty) || 0),
    0
  );
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
  customBlends: CustomBlendCartItem[];
  wishlist: string[];
  setCartItems: (cartItems: CartItems) => void;
  setCustomBlends: (customBlends: CustomBlendCartItem[]) => void;
  setWishlist: (wishlist: string[]) => void;
  addToCart: (itemId: string, colors: string, qty?: number) => Promise<void>;
  addCustomBlend: (blend: Omit<CustomBlendCartItem, 'key' | 'qty'>) => void;
  updateCustomBlendQty: (key: string, qty: number) => void;
  removeCustomBlend: (key: string) => void;
  updateQuantity: (itemId: string, colors: string, quantity: number) => Promise<void>;
  moveToWishlist: (itemId: string) => Promise<void>;
  toggleWishlist: (itemId: string) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  hydrateFromServer: (token: string) => Promise<void>;
  clearAll: () => void;
}

const mergeLegacyState = (persistedState: unknown, currentState: CartState) => {
  const persisted = persistedState as Partial<CartState> | undefined;
  if (persisted && typeof persisted.cartItems === 'object' && Array.isArray(persisted.wishlist)) {
    return {
      ...currentState,
      ...persisted,
      // Blends saved before quantities existed get a default of 1, and blends
      // saved before bottle types existed fall back to the classic bottle.
      customBlends: (persisted.customBlends || []).map((blend) => ({
        ...blend,
        qty: Number(blend.qty) > 0 ? Number(blend.qty) : 1,
        bottleType: blend.bottleType || 'classic',
        bottleTypeName: blend.bottleTypeName || 'Classic Clear Glass',
      })),
    };
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
      customBlends: [],
      wishlist: [],

      setCartItems: (cartItems) => set({ cartItems }),
      setCustomBlends: (customBlends) => set({ customBlends }),
      setWishlist: (wishlist) => set({ wishlist }),

      addToCart: async (itemId, colors, qty = 1) => {
        if (!colors) {
          showToast('Select Product Details.', 'error');
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
        showToast('Added to cart', 'success');
        const token = getToken();
        if (token) {
          try {
            const ok = await apiCartAdd(token, itemId, colors, qty);
            if (!ok) showToast('Failed to add to cart', 'error');
          } catch (error) {
            console.log(error);
            showToast((error as Error).message, 'error');
          }
        }
      },

      addCustomBlend: (blend) => {
        const key = `blend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set((state) => ({ customBlends: [...state.customBlends, { ...blend, key, qty: 1 }] }));
        showToast('Your blend has been added to the cart', 'success');
      },

      updateCustomBlendQty: (key, qty) => {
        set((state) => {
          const target = state.customBlends.find((blend) => blend.key === key);
          if (!target) return state;
          if (qty <= 0) {
            showToast('Blend removed from cart', 'info');
            return { customBlends: state.customBlends.filter((blend) => blend.key !== key) };
          }
          return {
            customBlends: state.customBlends.map((blend) =>
              blend.key === key ? { ...blend, qty } : blend
            ),
          };
        });
      },

      removeCustomBlend: (key) => {
        set((state) => ({ customBlends: state.customBlends.filter((blend) => blend.key !== key) }));
        showToast('Blend removed from cart', 'info');
      },

      updateQuantity: async (itemId, colors, quantity) => {
        const cartData = structuredClone(get().cartItems);
        if (cartData[itemId]) {
          if (quantity <= 0) {
            showToast('Removed from cart', 'info');
            delete cartData[itemId][colors];
            if (Object.keys(cartData[itemId]).length === 0) {
              delete cartData[itemId];
            }
          } else {
            cartData[itemId][colors] = quantity;
          }
        } else {
          showToast('Removed from cart', 'info');
        }
        set({ cartItems: cartData });
        const token = getToken();
        if (token) {
          try {
            const ok = await apiCartUpdate(token, itemId, colors, quantity);
            if (!ok) {
              showToast('Failed to update cart', 'error');
            }
          } catch (error) {
            console.log(error);
            showToast((error as Error).message, 'error');
          }
        }
      },

      // Moves a cart product to the wishlist: the product leaves every cart
      // line and is saved as a wishlist entry (product-level, not size-level).
      moveToWishlist: async (itemId) => {
        const cartData = structuredClone(get().cartItems);
        const sizes = Object.keys(cartData[itemId] || {});
        const alreadyWishlisted = get().wishlist.includes(itemId);
        delete cartData[itemId];
        set((state) => ({
          cartItems: cartData,
          wishlist: alreadyWishlisted ? state.wishlist : [...state.wishlist, itemId],
        }));
        showToast('Moved to wishlist', 'success');
        const token = getToken();
        if (token) {
          try {
            for (const size of sizes) {
              const ok = await apiCartUpdate(token, itemId, size, 0);
              if (!ok) {
                showToast('Failed to update cart', 'error');
                break;
              }
            }
            if (!alreadyWishlisted) {
              const ok = await apiWishlistAdd(token, itemId);
              if (!ok) showToast('Failed to update wishlist', 'error');
            }
          } catch (error) {
            console.log(error);
            showToast((error as Error).message, 'error');
          }
        }
      },

      toggleWishlist: async (itemId) => {
        const adding = !get().wishlist.includes(itemId);
        set((state) => ({
          wishlist: adding ? [...state.wishlist, itemId] : state.wishlist.filter((id) => id !== itemId),
        }));
        showToast(adding ? 'Added to wishlist' : 'Removed from wishlist', adding ? 'success' : 'info');
        const token = getToken();
        if (token) {
          try {
            const ok = adding ? await apiWishlistAdd(token, itemId) : await apiWishlistRemove(token, itemId);
            if (!ok) {
              set((state) => ({
                wishlist: adding ? state.wishlist.filter((id) => id !== itemId) : [...state.wishlist, itemId],
              }));
              showToast('Failed to update wishlist', 'error');
            }
          } catch (error) {
            set((state) => ({
              wishlist: adding ? state.wishlist.filter((id) => id !== itemId) : [...state.wishlist, itemId],
            }));
            console.log(error);
            showToast((error as Error).message, 'error');
          }
        }
      },

      removeFromWishlist: async (itemId) => {
        set((state) => ({ wishlist: state.wishlist.filter((id) => id !== itemId) }));
        showToast('Removed from wishlist', 'info');
        const token = getToken();
        if (token) {
          try {
            const ok = await apiWishlistRemove(token, itemId);
            if (!ok) {
              showToast('Failed to update wishlist', 'error');
            }
          } catch (error) {
            console.log(error);
            showToast((error as Error).message, 'error');
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
        set({ cartItems: {}, customBlends: [], wishlist: [] });
        localStorage.removeItem('cartItems');
        localStorage.removeItem('wishlist');
      },
    }),
    {
      name: 'sugandhit-shop-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cartItems: state.cartItems,
        customBlends: state.customBlends,
        wishlist: state.wishlist,
      }),
      merge: mergeLegacyState,
      version: 1,
    }
  )
);