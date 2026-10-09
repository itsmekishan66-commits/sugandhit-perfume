import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "@/components/ui/Title";
import RequiredMark from "@/components/ui/RequiredMark";
import FormErrors from "@/components/feedback/FormErrors";
import { showToast } from "@/components/feedback/toast";
import CartTotal from "@/components/cart/CartTotal";
import { assets } from "@/assets/assets";
import Loading from "@/components/ui/Loading";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCart, getCartAmount } from "@/context/CartContext";
import { orderAddressSchema } from "@/validate/schemas";
import { useFormErrors } from "@/hooks/useFormErrors";
import { DELIVERY_FEE } from "@/config/constants";
import { placeCustomOrder } from "@/features/customization/customization.service";
import { buildOrderItems, placeOrder } from "../checkout.service";
import type { AddressForm } from "../checkout.types";

const PlaceOrder = () => {
  const [method, setMethod] = useState('cod');
  const navigate = useNavigate();
  const { token } = useAuth();
  const { products, productsLoaded } = useApp();
  const cartItems = useCart((s) => s.cartItems);
  const customBlends = useCart((s) => s.customBlends);
  const setCartItems = useCart((s) => s.setCartItems);
  const setCustomBlends = useCart((s) => s.setCustomBlends);
  const perfumeSubtotal = getCartAmount(cartItems, products);
  const subtotal = getCartAmount(cartItems, products, customBlends);
  const blendUnits = customBlends.reduce((sum, blend) => sum + blend.qty, 0);
  const [formData, setFormData] = useState<AddressForm>({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    city: '',
    district: '',
    phone: ''
  });
  const { errors, validate, clearErrors } = useFormErrors();

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

  // Totals are derived from `products`, so a real cart would otherwise render as
  // "Rs. 0" and submit as "Your cart is empty" while the catalogue is still loading.
  if (!productsLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-14">
        <Loading variant="inline" className="w-55 md:w-100" label="Loading checkout" />
      </div>
    );
  }

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = orderAddressSchema.safeParse(formData);
    if (
      !validate([
        subtotal === 0 && 'Your cart is empty',
        ...(parsed.success ? [] : parsed.error.issues.map((issue) => issue.message)),
      ])
    ) {
      return;
    }
    try {
      const orderItems = buildOrderItems(cartItems, products);
      const hasPerfumes = orderItems.length > 0;

      // The perfume order carries the delivery fee; each custom blend is placed as its
      // own order, and the first blend picks up delivery when no perfumes are in the cart.
      if (method !== 'cod') {
        showToast('This payment method is coming soon — try Cash on Delivery.', 'info');
        return;
      }

      if (hasPerfumes) {
        const res = await placeOrder(token, {
          address: formData,
          items: orderItems,
          amount: perfumeSubtotal + DELIVERY_FEE
        });
        if (!res.success) {
          showToast(res.message || "Order failed", 'error');
          return;
        }
      }

      for (const [index, blend] of customBlends.entries()) {
        const delivery = !hasPerfumes && index === 0 ? DELIVERY_FEE : 0;
        const res = await placeCustomOrder(token, {
          name: blend.name,
          bottleSize: blend.bottleSize,
          bottleType: blend.bottleTypeName || blend.bottleType,
          topNotes: blend.topNotes,
          heartNotes: blend.heartNotes,
          baseNotes: blend.baseNotes,
          perfumeBase: blend.perfumeBase,
          strength: blend.strength,
          strengthName: blend.strengthName,
          customLabel: blend.customLabel,
          amount: Number(blend.price) * blend.qty + delivery
        });
        if (!res.success) {
          showToast(res.message || 'Custom blend order failed', 'error');
          return;
        }
      }

      setCartItems({});
      setCustomBlends([]);
      showToast("Order placed — we'll begin blending now!", 'success');
      navigate('/orders');
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  }

  const inputClass = "border border-gold/20 bg-white/70 rounded-xl py-3 px-4 pr-9 w-full text-sm focus:border-gold transition-colors outline-none";

  return (
    <form onSubmit={onSubmitHandler} onChangeCapture={clearErrors} noValidate className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 pt-5 sm:pt-14 pb-10">
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-4 w-full max-w-130">
        <div className="text-left lg:text-3xl my-3">
          <Title text1={'Delivery'} text2={'Information'} />
        </div>
        <div className="flex gap-3">
          <div className="relative w-full">
            <input required onChange={onChangeHandler} name="firstName" value={formData.firstName} className={inputClass} type="text" placeholder="First name" />
            <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="relative w-full">
            <input required onChange={onChangeHandler} name="lastName" value={formData.lastName} className={inputClass} type="text" placeholder="Last name" />
            <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="relative">
          <input required onChange={onChangeHandler} name="email" value={formData.email} className={inputClass} type="email" placeholder="Email address" />
          <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="relative">
          <input required onChange={onChangeHandler} name="location" value={formData.location} className={inputClass} type="text" placeholder="Street / Location / Tole" />
          <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="flex gap-3">
          <div className="relative w-full">
            <input required onChange={onChangeHandler} name="district" value={formData.district} className={inputClass} type="text" placeholder="District" />
            <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <div className="relative w-full">
            <input required onChange={onChangeHandler} name="city" value={formData.city} className={inputClass} type="text" placeholder="City" />
            <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="relative">
          <input required onChange={onChangeHandler} name="phone" value={formData.phone} className={inputClass} type="number" placeholder="Phone" />
          <RequiredMark className="absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:max-w-md">
        <div className="mt-2">
          <CartTotal />
        </div>
        {blendUnits > 0 && (
          <p className="text-xs text-ink-soft bg-white/70 border border-gold/20 rounded-xl p-3 mt-3">
            {blendUnits} custom blend{blendUnits > 1 ? 's' : ''} included — we&apos;ll hand-blend {blendUnits > 1 ? 'them' : 'it'} fresh for you.
          </p>
        )}
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
          <div className="mt-8 flex flex-col items-start gap-3">
            <FormErrors errors={errors} />
            <div className="w-full text-center">
              <button type="submit" className="btn-primary w-full">Place Order — {new Intl.NumberFormat().format(subtotal + DELIVERY_FEE)}</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;