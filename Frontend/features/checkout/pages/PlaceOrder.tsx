import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "@/components/ui/Title";
import { showToast } from "@/components/feedback/toast";
import CartTotal from "@/components/cart/CartTotal";
import { assets } from "@/assets/assets";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCart, getCartAmount } from "@/context/CartContext";
import { orderAddressSchema } from "@/validate/schemas";
import { DELIVERY_FEE } from "@/config/constants";
import { buildOrderItems, placeOrder } from "../checkout.service";
import type { AddressForm } from "../checkout.types";

const PlaceOrder = () => {
  const [method, setMethod] = useState('cod');
  const navigate = useNavigate();
  const { token } = useAuth();
  const { products } = useApp();
  const cartItems = useCart((s) => s.cartItems);
  const setCartItems = useCart((s) => s.setCartItems);
  const subtotal = getCartAmount(cartItems, products);
  const [formData, setFormData] = useState<AddressForm>({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    city: '',
    district: '',
    phone: ''
  });

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name
    const value = event.target.value
    setFormData(data => ({ ...data, [name]: value }))
  }

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <p className="font-display text-3xl italic text-ink-soft">You need to sign in first.</p>
        <button onClick={() => navigate('/login')} className="btn-gold mt-6">Sign in to Checkout</button>
      </div>
    );
  }

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (subtotal === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    const parsed = orderAddressSchema.safeParse(formData);
    if (!parsed.success) {
      showToast(parsed.error.issues[0].message, 'error');
      return;
    }
    try {
      const orderItems = buildOrderItems(cartItems, products);

      const orderData = {
        address: formData,
        items: orderItems,
        amount: subtotal + DELIVERY_FEE
      }

      switch (method) {
        case 'cod': {
          const res = await placeOrder(token, orderData);
          if (res.success) {
            setCartItems({});
            showToast("Order placed — we'll begin blending now!", 'success');
            navigate('/orders');
          } else {
            showToast(res.message || "Order failed", 'error');
          }
          break;
        }
        default:
          showToast('This payment method is coming soon — try Cash on Delivery.', 'info');
          break;
      }
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  }

  const inputClass = "border border-gold/20 bg-white/70 rounded-xl py-3 px-4 w-full text-sm focus:border-gold transition-colors outline-none";

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 pt-5 sm:pt-14 pb-10">
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-4 w-full max-w-130">
        <div className="text-left lg:text-3xl my-3">
          <Title text1={'Delivery'} text2={'Information'} />
        </div>
        <div className="flex gap-3">
          <input required onChange={onChangeHandler} name="firstName" value={formData.firstName} className={inputClass} type="text" placeholder="First name" />
          <input required onChange={onChangeHandler} name="lastName" value={formData.lastName} className={inputClass} type="text" placeholder="Last name" />
        </div>
        <input required onChange={onChangeHandler} name="email" value={formData.email} className={inputClass} type="email" placeholder="Email address" />
        <input required onChange={onChangeHandler} name="location" value={formData.location} className={inputClass} type="text" placeholder="Street / Location / Tole" />
        <div className="flex gap-3">
          <input required onChange={onChangeHandler} name="district" value={formData.district} className={inputClass} type="text" placeholder="District" />
          <input required onChange={onChangeHandler} name="city" value={formData.city} className={inputClass} type="text" placeholder="City" />
        </div>
        <input required onChange={onChangeHandler} name="phone" value={formData.phone} className={inputClass} type="number" placeholder="Phone" />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:max-w-md">
        <div className="mt-2">
          <CartTotal />
        </div>
        <div className="mt-8">
          <Title text1={'Payment'} text2={'Method'} />
          <div className="flex gap-3 flex-col sm:flex-row">
            <div onClick={() => setMethod('khalti')} className="flex flex-1 items-center justify-center gap-3 border border-gold/25 rounded-xl p-3 cursor-pointer hover:border-gold transition-colors">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'khalti' ? 'bg-gold border-gold' : 'border-ink-soft'}`}></p>
              <img className="h-5" src={assets.khalti_logo} alt="Khalti" />
            </div>
            <div onClick={() => setMethod('esewa')} className="flex flex-1 items-center justify-center gap-3 border border-gold/25 rounded-xl p-3 cursor-pointer hover:border-gold transition-colors">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'esewa' ? 'bg-gold border-gold' : 'border-ink-soft'}`}></p>
              <img className="h-5" src={assets.esewa_logo} alt="eSewa" />
            </div>
            <div onClick={() => setMethod('cod')} className="flex flex-1 items-center justify-center gap-3 border border-gold/25 rounded-xl p-3 cursor-pointer hover:border-gold transition-colors">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-gold border-gold' : 'border-ink-soft'}`}></p>
              <p className="text-sm font-medium tracking-wide">CASH ON DELIVERY</p>
            </div>
          </div>
          <div className="w-full text-center mt-8">
            <button type="submit" className="btn-primary w-full">Place Order — {new Intl.NumberFormat().format(subtotal + DELIVERY_FEE)}</button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;