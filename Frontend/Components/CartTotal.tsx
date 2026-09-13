import { useContext } from 'react'
import { ShopContext } from "../Context/ShopContextObject";
import { useShopStore, getCartAmount } from '../Context/shopStore';

const CartTotal = () => {
  const { currency, delivery_fee, products } = useContext(ShopContext);
  const cartItems = useShopStore((s) => s.cartItems);
  const subtotal = getCartAmount(cartItems, products);
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee;

  return (
    <div className="w-full">
      <h3 className="font-display text-2xl font-medium mb-4">Cart Totals</h3>
      <div className="flex flex-col gap-2 text-sm rounded-2xl border border-gold/20 bg-white/70 p-6">
        <div className="flex justify-between text-ink-soft">
          <p>Subtotal</p>
          <p>{currency} {subtotal}</p>
        </div>
        <hr className="border-gold/15" />
        <div className="flex justify-between text-ink-soft">
          <p>Shipping Fee</p>
          <p>{currency} {subtotal === 0 ? 0 : delivery_fee}</p>
        </div>
        <hr className="border-gold/15" />
        <div className="flex justify-between text-lg">
          <b>Total</b>
          <b className="font-display gold-text">{currency} {total}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;