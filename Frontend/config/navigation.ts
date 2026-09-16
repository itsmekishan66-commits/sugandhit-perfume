export interface NavLinkDef {
  label: string;
  to: string;
}

export const DESKTOP_NAV_LINKS: NavLinkDef[] = [
  { label: 'Home', to: '/' },
  { label: 'Collection', to: '/collection' },
  { label: 'Customize', to: '/customize' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export const FOOTER_SHOP_LINKS: NavLinkDef[] = [
  { label: 'Collection', to: '/collection' },
  { label: 'Custom Perfume', to: '/customize' },
  { label: 'Bestsellers', to: '/collection' },
  { label: 'Gift Packs', to: '/collection' },
];

export const FOOTER_COMPANY_LINKS: NavLinkDef[] = [
  { label: 'About us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Delivery', to: '/about' },
  { label: 'Privacy', to: '/about' },
];

export const CONTACT_DETAILS = {
  phone: '+977 9804068834',
  email: 'hello@sugandhit.com',
};

export interface SocialLink {
  name: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'Facebook', href: 'https://facebook.com' },
  { name: 'Twitter', href: 'https://twitter.com' },
  { name: 'Instagram', href: 'https://instagram.com' },
  { name: 'TikTok', href: 'https://tiktok.com' },
];