import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const Toaster = () => {
  const cartToast = useCart((s) => s.cartToast);
  const setCartToast = useCart((s) => s.setCartToast);

  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => setCartToast(null), 2600);
    return () => clearTimeout(timer);
  }, [cartToast, setCartToast]);

  if (!cartToast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 sm:bottom-8">
      <div className="flex items-center gap-2 rounded-full border border-gold/20 bg-ink px-5 py-3 text-sm text-cream shadow-2xl">
        <CheckCircle2 className="h-4 w-4 text-gold" />
        {cartToast}
      </div>
    </div>
  );
};

export default Toaster;