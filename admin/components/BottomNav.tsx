import { NavLink } from 'react-router-dom'

interface NavItem {
  label: string;
  to: string;
  icon: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: '📊', end: true },
  { label: 'Add', to: '/add', icon: '➕' },
  { label: 'Products', to: '/list', icon: '📦' },
  { label: 'Orders', to: '/orders', icon: '🛍️' },
  { label: 'Custom', to: '/custom-orders', icon: '✨' },
  { label: 'Coupons', to: '/coupons', icon: '🎟️' },
  { label: 'Notify', to: '/notifications', icon: '🔔' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
]

const BottomNav = () => {
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 sm:px-3"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-full overflow-x-auto no-scrollbar">
        <div className="flex min-w-max items-center gap-1 rounded-[1.5rem] border border-gold/20 bg-white/90 p-1.5 shadow-[0_14px_44px_-14px_rgba(43,29,22,0.45)] backdrop-blur-2xl">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-[4.5rem] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-ink-soft transition-colors ${isActive
                  ? 'bg-sand font-semibold text-espresso'
                  : 'hover:bg-cream'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] leading-none whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default BottomNav