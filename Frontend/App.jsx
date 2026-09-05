import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Collection from "./Pages/Collection";
import Contact from "./Pages/Contact";
import Login from "./Pages/Login";
import Orders from "./Pages/Orders";
import PlaceOrder from "./Pages/PlaceOrder";
import Product from "./Pages/Product";
import Navbar from "./Components/Navbar";
import Cart from "./Pages/Cart";
import Footer from "./Components/Footer";
import SearchBar from "./Components/SearchBar";
import CustomPerfume from "./Pages/CustomPerfume";
import Dashboard from "./Pages/Dashboard";
import Marquee from "./Components/Marquee";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const location = useLocation();
  const isCheckout = location.pathname === '/Place-Order' || location.pathname === '/Login';

  return (
    <>
      <ToastContainer />
      {!isCheckout && <Marquee />}
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] max-w-[1600px] mx-auto">
        <Navbar />
        <SearchBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/Cart" element={<Cart />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Orders" element={<Orders />} />
          <Route path="/Place-Order" element={<PlaceOrder />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/customize" element={<CustomPerfume />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
};

export default App;