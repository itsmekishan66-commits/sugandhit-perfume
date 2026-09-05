import { Link } from "react-router-dom";
import { Menu, Cart, User } from "lucide-react";

const BottomNav = () => {
  const navItems = [
    { label: "Home", icon: <Menu className="w-6 h-6 mb-1" />, path: "/" },
    { label: "Collection", icon: <Menu className="w-6 h-6 mb-1" />, path: "/collection" },
    { label: "About", icon: <Menu className="w-6 h-6 mb-1" />, path: "/about" },
    { label: "Contact", icon: <Menu className="w-6 h-6 mb-1" />, path: "/contact" },
    { label: "Cart", icon: <Cart className="w-6 h-6 mb-1" />, path: "/Cart" },
    { label: "Account", icon: <User className="w-6 h-6 mb-1" />, path: "/login" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-cream border-t border-gold/20 px-4 py-3 flex justify-around"
    >
      {navItems.map((it) => (
        <Link
          key={it.label}
          to={it.path}
          className="flex flex-col items-center text-sm text-ink-soft hover:text-gold transition-colors"
        >
          {it.icon}
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;