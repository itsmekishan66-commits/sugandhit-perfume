import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import CustomOrders from "./pages/CustomOrders";
import Coupons from "./pages/Coupons";
import Notifications from "./pages/Notifications";
import PaymentsPage from "./pages/PaymentsPage";
import AccountsPage from "./pages/AccountsPage";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import SidebarLayout from "./layouts/SidebarLayout";
import AuthLayout from "./layouts/AuthLayout";
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify';

const App = () => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('token') || '');

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  return (
    <div className="min-h-screen bg-cream text-ink">       <ToastContainer />
      {token === ""
        ?
        <AuthLayout>
          <Login setToken={setToken} />
        </AuthLayout>
        :
        <SidebarLayout setToken={setToken}>
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/add" element={<Add token={token} />} />
            <Route path="/list" element={<List token={token} />} />
            <Route path="/orders" element={<Orders token={token} />} />
            <Route path="/custom-orders" element={<CustomOrders token={token} />} />
            <Route path="/coupons" element={<Coupons token={token} />} />
            <Route path="/notifications" element={<Notifications token={token} />} />
            <Route path="/payment" element={<PaymentsPage token={token} />} />
            <Route path="/users" element={<Users token={token} />} />
            <Route path="/accounts" element={<AccountsPage token={token} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </SidebarLayout>
      }
    </div>
  );
};

export default App;