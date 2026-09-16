import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/features/search/components/SearchBar";
import Footer from "@/components/layout/Footer";

const CheckoutLayout = () => {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] max-w-[1600px] mx-auto">
      <Navbar />
      <SearchBar />
      <Outlet />
      <Footer />
    </div>
  );
};

export default CheckoutLayout;