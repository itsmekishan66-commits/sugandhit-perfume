import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loading } from '../components';

const Dashboard = lazy(() => import('../features/dashboard'));
const ProductAdd = lazy(() => import('../features/products/Add'));
const ProductList = lazy(() => import('../features/products/List'));
const Orders = lazy(() => import('../features/orders'));
const CustomOrders = lazy(() => import('../features/custom-orders'));
const Coupons = lazy(() => import('../features/coupons'));
const Notifications = lazy(() => import('../features/notifications'));
const PaymentsFeature = lazy(() => import('../features/payments'));
const AccountsFeature = lazy(() => import('../features/accounting'));
const InventoryFeature = lazy(() => import('../features/inventory'));
const Users = lazy(() => import('../features/users'));
const Settings = lazy(() => import('../features/settings'));

const Fallback = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div className="flex items-center justify-center py-24"><Loading /></div>}>
    {children}
  </Suspense>
);

const AppRoutes = ({ token }: { token: string }) => (
  <Routes>
    <Route path="/" element={<Fallback><Dashboard token={token} /></Fallback>} />
    <Route path="/add" element={<Fallback><ProductAdd token={token} /></Fallback>} />
    <Route path="/list" element={<Fallback><ProductList token={token} /></Fallback>} />
    <Route path="/orders" element={<Fallback><Orders token={token} /></Fallback>} />
    <Route path="/custom-orders" element={<Fallback><CustomOrders token={token} /></Fallback>} />
    <Route path="/coupons" element={<Fallback><Coupons token={token} /></Fallback>} />
    <Route path="/notifications" element={<Fallback><Notifications token={token} /></Fallback>} />
    <Route path="/payment" element={<Fallback><PaymentsFeature token={token} /></Fallback>} />
    <Route path="/users" element={<Fallback><Users token={token} /></Fallback>} />
    <Route path="/accounts" element={<Fallback><AccountsFeature token={token} /></Fallback>} />
    <Route path="/inventory" element={<Fallback><InventoryFeature token={token} /></Fallback>} />
    <Route path="/settings" element={<Fallback><Settings /></Fallback>} />
  </Routes>
);

export default AppRoutes;