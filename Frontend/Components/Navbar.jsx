import { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Search, User, ShoppingCart } from "lucide-react";
import BottomNav from "./BottomNav";
import { ShopContext } from "../Context/ShopContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { setShowSearch, getCartCount, token, logout, navigate } = useContext(ShopContext);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Collection', to: '/collection' },
    { label: 'Customize', to: '/customize' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <div className="flex items-center justify-between py-5 font-medium sticky top-0 z-50 glass-nav rounded-b-2xl">
      <Link to='/' className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-espresso shadow-lg shadow-gold/30"></span>
        <span className="font-display text-2xl font-semibold tracking-tight">
          Sugandhit<span className="gold-text">.</span>
        </span>
        <span className="hidden md:block text-[10px] tracking-luxe uppercase text-ink-soft mt-1.5">Perfume Studio</span>
      </Link>

      <ul className="hidden lg:flex items-center gap-8 text-sm text-ink-soft">
        {navLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `relative group tracking-wide transition-colors ${isActive ? "text-gold" : "hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span>{l.label}</span>

                <span
                  className={`-bottom-1.5 left-0 h-[2px] bg-gold transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </ul>

      <div className="flex items-center gap-4 sm:gap-5">
        <button
          onClick={() => setShowSearch(true)}
          aria-label="Search"
          className="p-2 hover:bg-sand rounded-full transition-colors"
        >
          <Search className="w-5 cursor-pointer" alt="Search" />
        </button>

        <div className="relative">
          <button
            onClick={() => token ? setOpen(!open) : navigate('/login')}
            className="p-2 hover:bg-sand rounded-full transition-colors"
            aria-label="Account"
          >
            <User className="w-5 cursor-pointer" alt="Account" />
          </button>
          {token && open && (
            <div className="absolute right-0 top-12 z-50 w-48 py-3 rounded-2xl border border-gold/20 bg-white shadow-2xl">
              <p onClick={() => { setOpen(false); navigate('/dashboard') }} className="cursor-pointer px-5 py-2 text-sm text-ink hover:text-espresso">My Dashboard</p>
              <p onClick={() => { setOpen(false); navigate('/customize') }} className="cursor-pointer px-5 py-2 text-sm text-ink hover:text-espresso">Build My Perfume</p>
              <p onClick={() => { setOpen(false); navigate('/orders') }} className="cursor-pointer px-5 py-2 text-sm text-ink hover:text-espresso">My Orders</p>
              <hr className="my-2 border-gold/15" />
              <p onClick={() => { setOpen(false); logout() }} className="cursor-pointer px-5 py-2 text-sm text-red-600">Log Out</p>
            </div>
          )}
        </div>

        <Link to="/Cart" className="relative p-2 hover:bg-sand rounded-full transition-colors">
          <ShoppingCart className="w-5 min-w-5" alt="Cart" />
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-center leading-5 bg-gold text-white aspect-square rounded-full text-[10px] font-semibold">
            {getCartCount()}
          </span>
        </Link>

        <BottomNav />
      </div>
    </div>
  );
};

export default Navbar;