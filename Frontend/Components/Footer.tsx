import { Link } from 'react-router-dom'
import { FaFacebookF, FaXTwitter, FaInstagram, FaTiktok } from 'react-icons/fa6'

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
            <li><Link to="/collection" className="hover:text-espresso transition-colors">Collection</Link></li>
            <li><Link to="/customize" className="hover:text-espresso transition-colors">Custom Perfume</Link></li>
            <li><Link to="/collection" className="hover:text-espresso transition-colors">Bestsellers</Link></li>
            <li><Link to="/collection" className="hover:text-espresso transition-colors">Gift Packs</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-display text-xl font-semibold mb-4">Company</p>
          <ul className="flex flex-col gap-2 text-ink-soft">
            <li><Link to="/about" className="hover:text-espresso transition-colors">About us</Link></li>
            <li><Link to="/contact" className="hover:text-espresso transition-colors">Contact</Link></li>
            <li><Link to="/about" className="hover:text-espresso transition-colors">Delivery</Link></li>
            <li><Link to="/about" className="hover:text-espresso transition-colors">Privacy</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-display text-xl font-semibold mb-4">Get in Touch</p>
          <ul className="flex flex-col gap-2 text-ink-soft">
            <li>+977 9804068834</li>
            <li>hello@sugandhit.com</li>
            <li className="pt-2 flex gap-3">
              {[
                { name: 'Facebook', href: 'https://facebook.com', Icon: FaFacebookF },
                { name: 'Twitter', href: 'https://twitter.com', Icon: FaXTwitter },
                { name: 'Instagram', href: 'https://instagram.com', Icon: FaInstagram },
                { name: 'TikTok', href: 'https://tiktok.com', Icon: FaTiktok },
              ].map(({ name, href, Icon }) => (
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
              ))}
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
};

export default Footer