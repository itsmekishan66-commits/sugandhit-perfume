import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { CartProvider } from '@/context/CartProvider';

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