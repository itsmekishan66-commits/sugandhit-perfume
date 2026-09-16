export interface NavLinkItem {
  label: string;
  to: string;
  icon: string;
  end?: boolean;
}

export interface NavGroup {
  section?: string;
  links: NavLinkItem[];
}

export const navGroups: NavGroup[] = [
  {
    links: [
      { label: 'Dashboard', to: '/', icon: '📊', end: true },
      { label: 'Add Products', to: '/add', icon: '➕' },
      { label: 'Product List', to: '/list', icon: '📦' },
      { label: 'Orders', to: '/orders', icon: '🛍️' },
      { label: 'Custom Orders', to: '/custom-orders', icon: '✨' },
      { label: 'Coupons', to: '/coupons', icon: '🎟️' },
      { label: 'Notifications', to: '/notifications', icon: '🔔' },
      { label: 'Users', to: '/users', icon: '👥' },
      { label: 'Settings', to: '/settings', icon: '⚙️' },
    ],
  },
  {
    section: 'Payments',
    links: [
      { label: 'Payments', to: '/payment', icon: '💳', end: true },
    ],
  },
  {
    section: 'Accounts',
    links: [
      { label: 'Accounts', to: '/accounts', icon: '🧾', end: true },
    ],
  },
  {
    section: 'Inventory',
    links: [
      { label: 'Inventory', to: '/inventory', icon: '📦', end: true },
    ],
  },
];

export const navItems: NavLinkItem[] = [
  { label: 'Dashboard', to: '/', icon: '📊', end: true },
  { label: 'Add', to: '/add', icon: '➕' },
  { label: 'Products', to: '/list', icon: '📦' },
  { label: 'Orders', to: '/orders', icon: '🛍️' },
  { label: 'Custom', to: '/custom-orders', icon: '✨' },
  { label: 'Coupons', to: '/coupons', icon: '🎟️' },
  { label: 'Notify', to: '/notifications', icon: '🔔' },
  { label: 'Payments', to: '/payment', icon: '💳', end: true },
  { label: 'Accounts', to: '/accounts', icon: '🧾' },
  { label: 'Stock', to: '/inventory', icon: '🗃️' },
  { label: 'Users', to: '/users', icon: '👥' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
];