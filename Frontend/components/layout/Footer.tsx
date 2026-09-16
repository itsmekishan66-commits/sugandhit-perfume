import { Link } from 'react-router-dom'
import { FaFacebookF, FaXTwitter, FaInstagram, FaTiktok } from 'react-icons/fa6'
import { FOOTER_SHOP_LINKS, FOOTER_COMPANY_LINKS, CONTACT_DETAILS, SOCIAL_LINKS } from '@/config/navigation'

const ICON_MAP: Record<string, typeof FaFacebookF> = {
  Facebook: FaFacebookF,
  Twitter: FaXTwitter,
  Instagram: FaInstagram,
  TikTok: FaTiktok,
}

const Footer = () => {
  return (
    <footer className="mt-24 pt-16 border-t border-gold/15">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pb-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-full bg-linear-to-br from-gold to-espresso" />
            <span className="font-display text-3xl font-semibold">Sugandhit<span className="gold-text">.</span></span>
          </div>
          <p className="text-ink-soft leading-relaxed max-w-sm">
            A boutique perfume studio crafting hand-blended fragrances and bespoke
            signature scents. Choose your notes, choose your base — wear your story.
          </p>
        </div>

        <div>
          <p className="font-display text-xl font-semibold mb-4">Shop</p>
          <ul className="flex flex-col gap-2 text-ink-soft">
            {FOOTER_SHOP_LINKS.map(({ label, to }) => (
              <li key={label}><Link to={to} className="hover:text-espresso transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-xl font-semibold mb-4">Company</p>
          <ul className="flex flex-col gap-2 text-ink-soft">
            {FOOTER_COMPANY_LINKS.map(({ label, to }) => (
              <li key={label}><Link to={to} className="hover:text-espresso transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display text-xl font-semibold mb-4">Get in Touch</p>
          <ul className="flex flex-col gap-2 text-ink-soft">
            <li>{CONTACT_DETAILS.phone}</li>
            <li>{CONTACT_DETAILS.email}</li>
            <li className="pt-2 flex gap-3">
              {SOCIAL_LINKS.map(({ name, href }) => {
                const Icon = ICON_MAP[name];
                if (!Icon) return null;
                return (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center hover:bg-gold hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gold/15 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-soft">
        <p>Copyright {new Date().getFullYear()} © Sugandhit Perfume Studio — All Rights Reserved.</p>
        <p className="tracking-luxe uppercase">Crafted with patience &amp; oud</p>
      </div>
    </footer>
  );
}

export default Footer