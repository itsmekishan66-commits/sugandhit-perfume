import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loading from '@/components/feedback/Loading';

const Dashboard = lazy(() => import('@/features/dashboard/pages/Dashboard'));
const ProductAdd = lazy(() => import('@/features/products/pages/ProductAdd'));
const ProductList = lazy(() => import('@/features/products/pages/ProductList'));
const ProductEdit = lazy(() => import('@/features/products/pages/ProductEdit'));
const Orders = lazy(() => import('@/features/orders/pages/Orders'));
const CustomOrders = lazy(() => import('@/features/custom-orders/pages/CustomOrders'));
const Coupons = lazy(() => import('@/features/coupons/pages/Coupons'));
const Notifications = lazy(() => import('@/features/notifications/pages/Notifications'));
const PaymentsFeature = lazy(() => import('@/features/payments/pages/PaymentsPage'));
const AccountsFeature = lazy(() => import('@/features/accounting/pages/AccountingPage'));
const InventoryFeature = lazy(() => import('@/features/inventory/pages/InventoryPage'));
const Users = lazy(() => import('@/features/users/pages/Users'));
const UserDetails = lazy(() => import('@/features/users/pages/UserDetails'));
const Settings = lazy(() => import('@/features/settings/pages/Settings'));
const Customization = lazy(() => import('@/features/customization/pages/Customization'));

const Fallback = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

const AppRoutes = ({ token }: { token: string }) => (
  <Routes>
    <Route path="/" element={<Fallback><Dashboard token={token} /></Fallback>} />
    <Route path="/add" element={<Fallback><ProductAdd token={token} /></Fallback>} />
    <Route path="/edit/:id" element={<Fallback><ProductEdit token={token} /></Fallback>} />
    <Route path="/list" element={<Fallback><ProductList token={token} /></Fallback>} />
    <Route path="/orders" element={<Fallback><Orders token={token} /></Fallback>} />
    <Route path="/custom-orders" element={<Fallback><CustomOrders token={token} /></Fallback>} />
    <Route path="/coupons" element={<Fallback><Coupons token={token} /></Fallback>} />
    <Route path="/notifications" element={<Fallback><Notifications token={token} /></Fallback>} />
    <Route path="/payment" element={<Fallback><PaymentsFeature token={token} /></Fallback>} />
    <Route path="/users" element={<Fallback><Users token={token} /></Fallback>} />
    <Route path="/users/:id" element={<Fallback><UserDetails token={token} /></Fallback>} />
    <Route path="/accounts" element={<Fallback><AccountsFeature token={token} /></Fallback>} />
    <Route path="/inventory" element={<Fallback><InventoryFeature token={token} /></Fallback>} />
    <Route path="/settings" element={<Fallback><Settings token={token} /></Fallback>} />
    <Route path="/customization" element={<Fallback><Customization token={token} /></Fallback>} />
  </Routes>
);

export default AppRoutes;