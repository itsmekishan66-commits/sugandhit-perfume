import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Collection from "./Pages/Collection";
import Contact from "./Pages/Contact";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Orders from "./Pages/Orders";
import PlaceOrder from "./Pages/PlaceOrder";
import Product from "./Pages/Product";
import Cart from "./Pages/Cart";
import Wishlist from "./Pages/Wishlist";
import CustomPerfume from "./Pages/CustomPerfume";
import Dashboard from "./Pages/Dashboard";
import SidebarLayout from "./layouts/SidebarLayout";
import AuthLayout from "./layouts/AuthLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/Login" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/Place-Order" element={<PlaceOrder />} />
        </Route>
        <Route element={<SidebarLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/Orders" element={<Orders />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/customize" element={<CustomPerfume />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;