import { Outlet } from "react-router-dom";
import Marquee from "../Components/Marquee";
import Navbar from "../Components/Navbar";
import SearchBar from "../Components/SearchBar";
import Footer from "../Components/Footer";

const SidebarLayout = () => {
  return (
    <>
      <Marquee />
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] max-w-[1600px] mx-auto">
        <Navbar />
        <SearchBar />
        <Outlet />
        <Footer />
      </div>
    </>
  );
};

export default SidebarLayout;