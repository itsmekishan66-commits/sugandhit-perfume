import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

const Providers = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <AppProvider>{children}</AppProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default Providers;