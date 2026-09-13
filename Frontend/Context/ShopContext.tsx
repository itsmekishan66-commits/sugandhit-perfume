import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ShopContext,
  type AppNotification,
  type Coupon,
  type Palette,
  type Product,
  type UserProfile,
} from "./ShopContextObject";
import { useShopStore } from "./shopStore";

const ShopContextProvider = ({ children }: { children: React.ReactNode }) => {
  const currency = "Rs.";
  const delivery_fee = 100;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [palette, setPalette] = useState<Palette>({ top: [], heart: [], base: [], bases: [] });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  const fetchApi = useCallback(async (url: string, options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) => {
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
  }, []);

  const getUserProfile = useCallback(async (token: string) => {
    try {
      const { data, success } = await fetchApi(backendUrl + '/api/user/profile', {
        method: 'POST',
        body: {},
        headers: { token }
      })
      if (success && data.success) {
        setUserProfile(data.user)
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message)
    }
  }, [backendUrl, fetchApi]);

  const updateUserProfile = async (profileData: { name: string; phone: string; address: Record<string, string> }): Promise<boolean> => {
    try {
      const { data, success } = await fetchApi(backendUrl + '/api/user/update-profile', {
        method: 'POST',
        body: profileData,
        headers: { token }
      })
      if (success && data.success) {
        setUserProfile(data.user)
        return true
      } else {
        toast.error(data.message)
        return false
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message)
      return false
    }
  };

  const uploadProfileImage = async (image: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('image', image);
      const response = await fetch(backendUrl + '/api/user/upload-image', {
        method: 'POST',
        headers: { token },
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUserProfile((prev) => (prev ? { ...prev, image: data.user.image } : prev));
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
      return false;
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, success } = await fetchApi(backendUrl + '/api/product/list');
        if (success && data.success) {
          setProducts(data.products);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.log(error);
        toast.error((error as Error).message);
      }
    };
    const loadPalette = async () => {
      try {
        const { data, success } = await fetchApi(backendUrl + '/api/note/palette');
        if (success && data.success) {
          setPalette(data.palette);
        }
      } catch (error) {
        console.log(error);
      }
    };
    loadProducts();
    loadPalette();
  }, [backendUrl, fetchApi]);

  useEffect(() => {
    if (!token) return;
    useShopStore.getState().hydrateFromServer(token);
    fetchApi(backendUrl + '/api/user/profile', {
      method: 'POST',
      body: {},
      headers: { token }
    }).then(({ data, success }) => {
      if (success && data.success) {
        setUserProfile(data.user);
      }
    }).catch((error) => {
      console.log(error);
      toast.error((error as Error).message);
    });
  }, [token, backendUrl, fetchApi]);

  const loadCoupons = useCallback(async () => {
    try {
      const { data, success } = await fetchApi(backendUrl + '/api/coupon/list');
      if (success && data.success) {
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.log(error);
    }
  }, [backendUrl, fetchApi]);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const { data, success } = await fetchApi(backendUrl + '/api/notification/list', {
        method: 'POST',
        body: {},
        headers: { token }
      });
      if (success && data.success) {
        setNotifications(data.notifications || []);
        setUnreadNotifications(data.unread || 0);
      }
    } catch (error) {
      console.log(error);
    }
  }, [token, backendUrl, fetchApi]);

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      await loadNotifications();
    };
    run();
  }, [token, loadNotifications]);

  useEffect(() => {
    const run = async () => {
      await loadCoupons();
    };
    run();
  }, [loadCoupons]);

  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const markNotificationsRead = useCallback(async (id?: string) => {
    if (!token) return;
    try {
      const { data, success } = await fetchApi(backendUrl + '/api/notification/mark-read', {
        method: 'POST',
        body: id ? { notificationId: Number(id) } : {},
        headers: { token }
      });
      if (success && data.success) {
        setUnreadNotifications(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.log(error);
    }
  }, [token, backendUrl, fetchApi]);

  const logout = () => {
    localStorage.removeItem('token');
    useShopStore.getState().clearAll();
    setToken('');
    setUserProfile(null);
    setNotifications([]);
    setUnreadNotifications(0);
    navigate('/');
  };

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    navigate,
    backendUrl,
    token,
    setToken,
    palette,
    userProfile,
    getUserProfile,
    updateUserProfile,
    uploadProfileImage,
    logout,
    coupons,
    notifications,
    unreadNotifications,
    refreshNotifications,
    markNotificationsRead,
  };

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;