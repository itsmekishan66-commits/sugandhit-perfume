import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

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

export { CartProvider };
export default CartProvider;