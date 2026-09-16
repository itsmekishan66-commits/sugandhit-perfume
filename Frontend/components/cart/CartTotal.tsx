import { useApp } from '@/context/AppContext'
import { useCart, getCartAmount } from '@/context/CartContext'
import { CURRENCY, DELIVERY_FEE } from '@/config/constants'

const CartTotal = () => {
  const { products } = useApp();
  const cartItems = useCart((s) => s.cartItems);
  const subtotal = getCartAmount(cartItems, products);
  const total = subtotal === 0 ? 0 : subtotal + DELIVERY_FEE;

  return (
    <div className="w-full">
      <h3 className="font-display text-2xl font-medium mb-4">Cart Totals</h3>
      <div className="flex flex-col gap-2 text-sm rounded-2xl border border-gold/20 bg-white/70 p-6">
        <div className="flex justify-between text-ink-soft">
          <p>Subtotal</p>
          <p>{CURRENCY} {subtotal}</p>
        </div>
        <hr className="border-gold/15" />
        <div className="flex justify-between text-ink-soft">
          <p>Shipping Fee</p>
          <p>{CURRENCY} {subtotal === 0 ? 0 : DELIVERY_FEE}</p>
        </div>
        <hr className="border-gold/15" />
        <div className="flex justify-between text-lg">
          <b>Total</b>
          <b className="font-display gold-text">{CURRENCY} {total}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;