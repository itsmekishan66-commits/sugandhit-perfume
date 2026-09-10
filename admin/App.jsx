import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import CustomOrders from "./pages/CustomOrders";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import SidebarLayout from "./layouts/SidebarLayout";
import AuthLayout from "./layouts/AuthLayout";
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer} from 'react-toastify';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token')? localStorage.getItem('token'):"");
useEffect(()=>{
  localStorage.setItem('token', token)
},[token])
  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <ToastContainer />
      {token === "" ? 
        <AuthLayout>
          <Login setToken={setToken}/>
        </AuthLayout>
       : 
        <SidebarLayout setToken={setToken}>
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/add" element={<Add token={token} />} />
            <Route path="/list" element={<List token={token} />} />
            <Route path="/orders" element={<Orders token={token} />} />
            <Route path="/custom-orders" element={<CustomOrders token={token} />} />
          </Routes>
        </SidebarLayout>
      }
    </div>
  );
};

export default App;