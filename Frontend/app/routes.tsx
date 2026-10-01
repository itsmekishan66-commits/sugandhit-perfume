import { Route, Routes } from 'react-router-dom';
import Cart from '@/features/cart/pages/Cart';
import Coupons from '@/features/coupons/pages/Coupons';
import CustomPerfume from '@/features/customization/pages/CustomPerfume';
import PlaceOrder from '@/features/checkout/pages/PlaceOrder';
import Home from '@/features/home/pages/Home';
import About from '@/features/home/pages/About';
import Contact from '@/features/home/pages/Contact';
import Notifications from '@/features/notifications/pages/Notifications';
import Orders from '@/features/orders/pages/Orders';
import Login from '@/features/auth/pages/Login';
import Register from '@/features/auth/pages/Register';
import Dashboard from '@/features/profile/pages/Dashboard';
import Collection from '@/features/products/pages/Collection';
import Product from '@/features/products/pages/Product';
import Wishlist from '@/features/wishlist/pages/Wishlist';
import AuthLayout from '@/layouts/AuthLayout';
import CheckoutLayout from '@/layouts/CheckoutLayout';
import MainLayout from '@/layouts/MainLayout';
import PageGate from './PageGate';

const AppRoutes = () => (
  <Routes>
    <Route element={<CheckoutLayout />}>
      <Route path="/Place-Order" element={<PlaceOrder />} />
    </Route>
    <Route element={<AuthLayout />}>
      <Route path="/Login" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/Register" element={<Register />} />
    </Route>
    <Route element={<MainLayout />}>
      <Route
        path="/"
        element={
          <PageGate needs="products" label="Loading home">
            <Home />
          </PageGate>
        }
      />
      <Route
        path="/about"
        element={
          <PageGate needs="products" label="Loading about">
            <About />
          </PageGate>
        }
      />
      <Route
        path="/contact"
        element={
          <PageGate needs="products" label="Loading contact">
            <Contact />
          </PageGate>
        }
      />
      <Route path="/Cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route
        path="/collection"
        element={
          <PageGate needs="products" label="Loading collection">
            <Collection />
          </PageGate>
        }
      />
      <Route path="/Orders" element={<Orders />} />
      <Route path="/product/:productId" element={<Product />} />
      <Route
        path="/customize"
        element={
          <PageGate needs="palette" label="Loading the studio">
            <CustomPerfume />
          </PageGate>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PageGate needs="products" label="Loading dashboard">
            <Dashboard />
          </PageGate>
        }
      />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/coupons" element={<Coupons />} />
    </Route>
  </Routes>
);

export default AppRoutes;