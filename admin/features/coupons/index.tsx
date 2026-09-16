import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { backendUrl, currency } from '../../config';
import { toast } from 'react-toastify';
import { couponSchema, couponToggleSchema, couponIdSchema } from '../../validate/schemas';
import { PageHeader } from '../../components';

interface Coupon {
  _id: string;
  code: string;
  title: string;
  description: string;
  image: string;
  discountType: 'percent' | 'flat';
  discountValue: number | string;
  minPurchase: number | string;
  active: boolean;
  validTill: number;
}

interface CouponsProps {
  token: string;
}

const Coupons = ({ token }: CouponsProps) => {
  const [list, setList] = useState<Coupon[]>([]);
  const [image, setImage] = useState<File | false>(false);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    try {
      const response = await fetch(backendUrl + '/api/coupon/admin/list', {
        method: 'POST',
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setList(data.coupons);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  const resetForm = () => {
    setImage(false);
    setCode('');
    setTitle('');
    setDescription('');
    setDiscountType('percent');
    setDiscountValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setValidUntil('');
  };

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = couponSchema.safeParse({
      code,
      title,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount: maxDiscount || undefined,
      validTill: validUntil ? new Date(`${validUntil}T23:59:59`).getTime() : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('code', parsed.data.code);
      formData.append('title', parsed.data.title);
      formData.append('description', parsed.data.description || '');
      formData.append('discountType', parsed.data.discountType);
      formData.append('discountValue', String(parsed.data.discountValue));
      formData.append('minPurchase', String(parsed.data.minPurchase));
      if (parsed.data.maxDiscount) formData.append('maxDiscount', String(parsed.data.maxDiscount));
      formData.append('validTill', String(parsed.data.validTill));
      if (image) formData.append('image', image);

      const response = await fetch(backendUrl + '/api/coupon/create', {
        method: 'POST',
        body: formData,
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        resetForm();
        await fetchList();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const parsed = couponToggleSchema.safeParse({ id: coupon._id, active: !coupon.active });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      const response = await fetch(backendUrl + '/api/coupon/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await fetchList();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  const deleteCoupon = async (id: string) => {
    const parsed = couponIdSchema.safeParse({ id });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      const response = await fetch(backendUrl + '/api/coupon/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(parsed.data)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await fetchList();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    fetch(backendUrl + '/api/coupon/admin/list', {
      method: 'POST',
      headers: { token }
    })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) {
          setList(data.coupons);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error((error as Error).message);
      });
    return () => {
      ignore = true;
    };
  }, [token]);

  const inputClass = 'w-full max-w-[500px] px-3 py-2';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Coupons" subtitle="Create and manage discount codes" />
      {/* Create coupon */}
      <form onSubmit={onSubmitHandler} className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">Create Coupon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-sm text-ink-soft">Coupon image (optional)</p>
            <label htmlFor="couponImage" className="block">
              {!image ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-gold/30 bg-cream text-2xl text-espresso">ðŸ–¼ï¸</div>
              ) : (
                <img className="w-24 h-24 rounded-xl object-cover border border-gold/20" src={URL.createObjectURL(image)} alt="Upload" style={{ cursor: 'pointer' }} />
              )}
            </label>
            <input onChange={(e) => setImage(e.target.files?.[0] || false)} type="file" id="couponImage" hidden accept="image/*" />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Coupon code</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)} value={code} className={inputClass} type="text" placeholder="e.g. FESTIVE20" required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Title</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} value={title} className={inputClass} type="text" placeholder="Festival Offer" required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Description</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} value={description} className={inputClass} type="text" placeholder="Save big on festival blends" />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Discount type</p>
            <select onChange={(e) => setDiscountType(e.target.value as 'percent' | 'flat')} value={discountType} className={inputClass}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Discount value</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscountValue(e.target.value)} value={discountValue} className={inputClass} type="number" placeholder={discountType === 'percent' ? '20' : '500'} required />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Min. purchase (Rs.)</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setMinPurchase(e.target.value)} value={minPurchase} className={inputClass} type="number" placeholder="2000" />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Max discount (Rs., optional)</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxDiscount(e.target.value)} value={maxDiscount} className={inputClass} type="number" placeholder="1500" />
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-soft">Valid until</p>
            <input onChange={(e: ChangeEvent<HTMLInputElement>) => setValidUntil(e.target.value)} value={validUntil} className={inputClass} type="date" required />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-32 py-3 mt-6 disabled:opacity-50">
          {saving ? 'Savingâ€¦' : 'CREATE'}
        </button>
      </form>

      {/* Coupons list */}
      <div className="bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur">
        <p className="mb-4 font-display text-2xl font-semibold text-ink">Coupons ({list.length})</p>
        <div className="flex flex-col gap-2">
          {list.length === 0 && <p className="text-center text-ink-soft/60 py-8">No coupons yet. Create your first one!</p>}
          {list.map((coupon) => (
            <div
              key={coupon._id}
              className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] items-center gap-2 py-2 px-3 border text-sm hover:bg-sand/40 hover:border-gold/30 transition-colors rounded-lg"
            >
              {coupon.image ? (
                <img className="w-12 h-12 object-cover rounded-lg" src={coupon.image} alt="" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-espresso text-white text-lg">ðŸŽŸï¸</div>
              )}
              <div className="min-w-0">
                <p className="text-ink font-medium truncate">{coupon.title}</p>
                <p className="text-xs text-ink-soft/70 font-semibold tracking-wide">{coupon.code}</p>
              </div>
              <p>{coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `${currency} ${coupon.discountValue} off`}</p>
              <p className="text-xs text-ink-soft">Till {new Date(coupon.validTill).toLocaleDateString()}</p>
              <div className="flex items-center justify-end gap-3">
                <input
                  type="checkbox"
                  checked={coupon.active}
                  onChange={() => toggleCoupon(coupon)}
                  className="accent-gold cursor-pointer"
                  title="Active"
                />
                <p onClick={() => deleteCoupon(coupon._id)} className="cursor-pointer text-lg text-red-500 hover:scale-110 transition-transform">âœ•</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Coupons;