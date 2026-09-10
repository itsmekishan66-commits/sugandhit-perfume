import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Search, User, ShoppingCart, Home, LayoutGrid, Sparkles } from "lucide-react";
import { ShopContext } from "../Context/ShopContextObject";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const { setShowSearch, getCartCount, token, logout, navigate } = useContext(ShopContext);

  const location = useLocation();

  const desktopLinks = [
    { label: "Home", to: "/" },
    { label: "Collection", to: "/collection" },
    { label: "Customize", to: "/customize" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ];

  /* =========================
     MOBILE NAVIGATION
  ========================== */
  const mobileLinks = [
    {
      label: "Home",
      to: "/",
      icon: Home,
    },
    {
      label: "Collection",
      to: "/collection",
      icon: LayoutGrid,
    },
    {
      label: "Customize",
      to: "/customize",
      icon: Sparkles,
    },
    {
      label: "Profile",
      to: token ? "/dashboard" : "/login",
      icon: User,
    },
  ];

  /* =========================
     FIND ACTIVE MOBILE ITEM
  ========================== */
  const getActiveIndex = () => {
    const path = location.pathname;

    if (path === "/") {
      return 0;
    }

    if (path.startsWith("/collection")) {
      return 1;
    }

    if (path.startsWith("/customize")) {
      return 2;
    }

    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/login")
    ) {
      return 3;
    }

    return -1;
  };

  const activeIndex = getActiveIndex();

  return (
    <>

      <header className="sticky top-0 z-50 w-full glass-nav rounded-b-2xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-18 items-center justify-between gap-4 py-3 sm:min-h-20 sm:py-5">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2"
            >
              <span className="h-8 w-8 shrink-0 rounded-full bg-linear-to-br from-gold to-espresso shadow-lg shadow-gold/30 sm:h-9 sm:w-9" />

              <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Sugandhit<span className="gold-text">.</span>
              </span>

              <span className="hidden xl:block mt-1 text-[10px] uppercase tracking-luxe text-ink-soft">
                Perfume Studio
              </span>
            </Link>

            {/* =========================
                DESKTOP NAVIGATION
            ========================== */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm text-ink-soft">
              {desktopLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `relative group tracking-wide transition-colors duration-300 ${isActive
                      ? "text-gold"
                      : "text-ink-soft hover:text-ink"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{link.label}</span>
                      <span
                        className={`absolute -bottom-1.5 left-0 h-0.5 bg-gold transition-all duration-300 ${isActive
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                          }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-1 sm:gap-3">

              {/* SEARCH */}
              <button
                onClick={() => setShowSearch(true)}
                aria-label="Search"
                className="rounded-full p-2.5 transition-colors duration-200 hover:bg-sand"
              >
                <Search
                  className="h-5 w-5"
                  strokeWidth={2}
                />
              </button>

              {/* ACCOUNT */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() =>
                    token
                      ? setOpen((prev) => !prev)
                      : navigate("/login")
                  }
                  aria-label="Account"
                  className="rounded-full p-2.5 transition-colors duration-200 hover:bg-sand"
                >
                  <User
                    className="h-5 w-5"
                    strokeWidth={2}
                  />
                </button>

                {token && open && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpen(false)}
                    />

                    <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-gold/20 bg-white py-2 shadow-2xl">
                      <button
                        onClick={() => {
                          setOpen(false);
                          navigate("/dashboard");
                        }}
                        className="block w-full px-5 py-3 text-left text-sm text-ink transition-colors hover:bg-sand"
                      >
                        My Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setOpen(false);
                          navigate("/customize");
                        }}
                        className="block w-full px-5 py-3 text-left text-sm text-ink transition-colors hover:bg-sand"
                      >
                        Build My Perfume
                      </button>

                      <button
                        onClick={() => {
                          setOpen(false);
                          navigate("/orders");
                        }}
                        className="block w-full px-5 py-3 text-left text-sm text-ink transition-colors hover:bg-sand"
                      >
                        My Orders
                      </button>

                      <div className="my-1 border-t border-gold/15" />

                      <button
                        onClick={() => {
                          setOpen(false);
                          logout();
                        }}
                        className="block w-full px-5 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* CART */}
              <Link
                to="/Cart"
                aria-label="Shopping Cart"
                className="relative rounded-full p-2.5 transition-colors duration-200 hover:bg-sand"
              >
                <ShoppingCart
                  className="h-5 w-5"
                  strokeWidth={2}
                />

                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-white">
                  {getCartCount()}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          Rendered into document.body so no ancestor
          (transform / filter / overflow) can break `fixed`.
      ====================================================== */}
      {createPortal(
        <div
          className="fixed inset-x-0 bottom-0 z-100 px-3 lg:hidden transform-[translateZ(0)] will-change-transform backface-hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <nav className="relative mx-auto w-full max-w-md rounded-[1.75rem] shadow-[0_14px_44px_-14px_rgba(43,29,22,0.45)]">

            <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] border border-gold/20 bg-white/90 backdrop-blur-2xl" />
            <div className="relative h-17 rounded-[1.75rem]">

              {/* TOP GLOW LINE */}
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-gold/50 to-transparent" />

              {/* =================================================
                  MOVING ACTIVE INDICATOR
                  A single bubble glides between the 4 columns.
              ================================================== */}
              {activeIndex >= 0 && (
                <div className=" pointer-events-none absolute left-0 top-0 z-0 h-full w-1/4 transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform transform-[translate3d(0,0,0)] backface-hidden"
                  style={{
                    transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
                  }}
                >
                  <div className="relative flex h-full flex-col items-center justify-center gap-0.5 transform-3d">
                    <span className="pointer-events-none absolute bottom-2.5 h-2.5 w-11 rounded-[999px] bg-[radial-gradient(closest-side,rgba(26,17,12,0.45),transparent)]" />
                    <div className="relative -translate-y-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(circle_at_32%_24%,#b06a4c,#8a4a35_30%,#6f3b2b_55%,#1a110c_100%)] ring-1 ring-gold/50 shadow-[0_24px_30px_-12px_rgba(26,17,12,0.75),0_10px_18px_-6px_rgba(0,0,0,0.5),inset_0_3px_3px_rgba(255,255,255,0.4),inset_0_-7px_12px_rgba(0,0,0,0.6)] transition-transform duration-650 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      <span className="pointer-events-none absolute inset-x-2.5 top-1.5 h-2.5 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.5),transparent)]" />
                      <span className="pointer-events-none absolute -bottom-1.5 h-1/2 w-full rounded-full bg-[radial-gradient(closest-side,rgba(26,17,12,0.55),transparent)]" />
                    </div>
                    <span aria-hidden className="h-2.5 w-px shrink-0 opacity-0" />
                  </div>
                </div>
              )}

              {/* =================================================
                  NAVIGATION ITEMS
              ================================================== */}
              <div className="relative z-10 grid h-full w-full grid-cols-4">

                {mobileLinks.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeIndex === index;

                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end={item.to === "/"}
                      className="group flex h-full w-full flex-col items-center justify-center gap-0.5"
                    >
                      {/* ICON */}
                      <span className={`flex h-12 w-12 items-center justify-center transition-transform duration-650 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${isActive ? "scale-110 -translate-y-3.5" : "scale-90 group-active:scale-75"}`}>

                        <Icon className={`h-5 w-5 transition-colors duration-300
                           ${isActive
                            ? "text-white"
                            : "text-ink-soft group-hover:text-espresso"}`}
                          strokeWidth={isActive ? 2.4 : 2} />
                      </span>

                      {/* LABEL */}
                      <span className={`text-[10px] leading-none transition-colors duration-300
                           ${isActive
                            ? "font-semibold text-espresso"
                            : "font-medium text-ink-soft"
                          }`}>
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}

              </div>
            </div>
          </nav>
        </div>,
        document.body
      )}
    </>
  );
};

export default Navbar;