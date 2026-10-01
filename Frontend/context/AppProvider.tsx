import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { fetchProducts } from '@/features/products/products.service';
import { fetchCoupons } from '@/features/coupons/coupons.service';
import {
  fetchNotifications,
  markNotificationsRead as markRead,
} from '@/features/notifications/notifications.service';
import { fetchPalette } from '@/features/customization/customization.service';
import { useAuth } from './AuthContext';
import { AppContext, type AppContextValue } from './AppContext';
import type { Palette, Product } from '@/types/product';
import type { AppNotification, Coupon } from '@/types/common';

const AppProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [palette, setPalette] = useState<Palette>({ top: [], heart: [], base: [], bases: [] });
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const result = await fetchProducts();
        if (active) {
          setProducts(result.products);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (active) {
          setProductsLoaded(true);
        }
      }
    };
    const loadPalette = async () => {
      try {
        const result = await fetchPalette();
        if (active) {
          setPalette(result);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (active) {
          setPaletteLoaded(true);
        }
      }
    };
    const loadCoupons = async () => {
      try {
        const result = await fetchCoupons();
        if (active) {
          setCoupons(result);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (active) {
          setCouponsLoaded(true);
        }
      }
    };
    loadProducts();
    loadPalette();
    loadCoupons();
    return () => {
      active = false;
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchNotifications(token);
      setNotifications(result.notifications);
      setUnreadNotifications(result.unread);
    } catch (error) {
      console.log(error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      const clear = setTimeout(() => {
        setNotifications([]);
        setUnreadNotifications(0);
        setNotificationsLoaded(true);
      }, 0);
      return () => clearTimeout(clear);
    }
    let active = true;
    fetchNotifications(token)
      .then((result) => {
        if (!active) return;
        setNotifications(result.notifications);
        setUnreadNotifications(result.unread);
        setNotificationsLoaded(true);
      })
      .catch((error) => console.log(error));
    return () => {
      active = false;
    };
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const markNotificationsRead = useCallback(
    async (id?: string) => {
      if (!token) return;
      try {
        const ok = await markRead(token, id);
        if (ok) {
          setUnreadNotifications(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      } catch (error) {
        console.log(error);
      }
    },
    [token]
  );

  const value: AppContextValue = {
    search,
    setSearch,
    showSearch,
    setShowSearch,
    products,
    productsLoaded,
    palette,
    paletteLoaded,
    coupons,
    couponsLoaded,
    notificationsLoaded,
    notifications,
    unreadNotifications,
    refreshNotifications,
    markNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export { AppProvider };
export default AppProvider;