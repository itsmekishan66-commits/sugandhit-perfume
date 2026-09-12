import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types'
import { ShopContext } from "./ShopContextObject";

const ShopContextProvider = ({ children }) => {
  const currency = "Rs.";
  const delivery_fee = 100;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cartItems');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [palette, setPalette] = useState({ top: [], heart: [], base: [], bases: [] });
  const [userProfile, setUserProfile] = useState(null);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem('wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();

  const fetchApi = useCallback(async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json' };
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

  const addToCart = async (itemId, colors, qty = 1) => {
    if (!colors) {
      toast.error("Select Product Details.");
      return;
    }
    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId][colors] = (cartData[itemId][colors] || 0) + qty;
    } else {
      cartData[itemId] = {};
      cartData[itemId][colors] = qty;
    }
    setCartItems(cartData);
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
        console.log(error)
        toast.error(error.message)
      }
    } else {
      toast.success("Added to cart");
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          totalCount += cartItems[items][item];
        }
      }
    }
    return totalCount;
  };

  const updateQuantity = async (itemId, colors, quantity) => {
    let cartData = structuredClone(cartItems);
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
    setCartItems(cartData);
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
        console.log(error)
        toast.error(error.message)
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0 && itemInfo) {
          totalAmount += Number(itemInfo.price) * cartItems[items][item];
        }
      }
    }
    return totalAmount;
  };

  const isInWishlist = (itemId) => wishlist.includes(itemId);

  const toggleWishlist = async (itemId) => {
    const adding = !wishlist.includes(itemId);
    setWishlist((prev) => (adding ? [...prev, itemId] : prev.filter((id) => id !== itemId)));
    if (adding) {
      toast.success("Added to wishlist");
    } else {
      toast.info("Removed from wishlist");
    }
    if (token) {
      try {
        const { success } = await fetchApi(backendUrl + `/api/wishlist/${adding ? 'add' : 'remove'}`, {
          method: 'POST',
          body: { productId: itemId },
          headers: { token }
        });
        if (!success) {
          setWishlist((prev) => (adding ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
          toast.error("Failed to update wishlist");
        }
      } catch (error) {
        setWishlist((prev) => (adding ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const removeFromWishlist = async (itemId) => {
    setWishlist((prev) => prev.filter((id) => id !== itemId));
    toast.info("Removed from wishlist");
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
        toast.error(error.message);
      }
    }
  };

  const getUserProfile = useCallback(async (token) => {
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
      toast.error(error.message)
    }
  }, [backendUrl, fetchApi]);

  const updateUserProfile = async (profileData) => {
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
      toast.error(error.message)
      return false
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
        toast.error(error.message);
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
    const loadCart = async () => {
      try {
        const { data, success } = await fetchApi(backendUrl + '/api/cart/get', {
          method: 'POST',
          body: {},
          headers: { token }
        });
        if (success && data.success) {
          setCartItems(data.cartData);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    };
    const loadWishlist = async () => {
      try {
        const { data, success } = await fetchApi(backendUrl + '/api/wishlist/get', {
          method: 'POST',
          body: {},
          headers: { token }
        });
        if (success && data.success) {
          setWishlist(data.wishlist || []);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    };
    const loadProfile = async () => {
      try {
        const { data, success } = await fetchApi(backendUrl + '/api/user/profile', {
          method: 'POST',
          body: {},
          headers: { token }
        });
        if (success && data.success) {
          setUserProfile(data.user);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    };
    loadCart();
    loadWishlist();
    loadProfile();
  }, [token, backendUrl, fetchApi]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, token]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, token]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('wishlist');
    setToken('');
    setCartItems({});
    setWishlist([]);
    setUserProfile(null);
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
    cartItems,
    addToCart,
    setCartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
    palette,
    userProfile,
    getUserProfile,
    updateUserProfile,
    logout,
    wishlist,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
  };

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
};

ShopContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ShopContextProvider;