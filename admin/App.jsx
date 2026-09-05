import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import CustomOrders from "./pages/CustomOrders";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
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
        <Login setToken={setToken}/>
       : 
        <>
          <Navbar setToken={setToken}/>
          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/add" element={<Add token= {token } />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/orders" element={<Orders token= {token } />} />
                <Route path="/custom-orders" element={<CustomOrders token= {token } />} />
              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  );
};

export default App;
