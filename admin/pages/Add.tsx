import { useState } from 'react';
import type { FormEvent } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../config'
import { toast } from 'react-toastify';
import { productAddSchema } from '../validate/schemas';
import PageHeader from '../components/PageHeader';

interface AddProps {
  token: string;
}

interface VariantDraft {
  name: string;
  price: string;
  description: string;
  image: File | false;
}

const Add = ({ token }: AddProps) => {
  const [mainImage, setMainImage] = useState<File | false>(false);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  const addVariant = () => {
    setVariants((prev) =>
      prev.length >= 8 ? prev : [...prev, { name: '', price: '', description: '', image: false }]
    );
  };
  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };
  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, SetCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Eau de Parfum");
  const [bestseller, setBestseller] = useState(false);

  const onSubmitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = productAddSchema.safeParse({ name, description, price, category, subCategory, bestseller: bestseller ? 'true' : 'false' });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (!mainImage) {
      toast.error('Please upload a main image.');
      return;
    }

    try {
      const formData = new FormData()

      formData.append("name", parsed.data.name)
      formData.append("description", parsed.data.description)
      formData.append("price", parsed.data.price)
      formData.append("category", parsed.data.category)
      formData.append("subCategory", parsed.data.subCategory)
      formData.append("bestseller", String(parsed.data.bestseller))

      formData.append("mainImage", mainImage)
      const variantsMeta = variants.map((v) => ({
        name: v.name,
        price: v.price,
        description: v.description,
      }));
      formData.append("variants", JSON.stringify(variantsMeta))
      variants.forEach((v) => {
        if (v.image) formData.append("variantImages", v.image)
      })

      const response = await fetch(backendUrl + "/api/product/add", {
        method: 'POST',
        body: formData,
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message)
        setName('')
        setDescription('')
        setMainImage(false)
        setVariants([])
        setPrice('')
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error);
      toast.error((error as Error).message)

    }
  }

  return (
    <>
      <PageHeader title="Add New Perfume" subtitle="Create a new fragrance for your boutique" />
      <form onSubmit={onSubmitHandler} className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start w-full bg-white/70 rounded-2xl p-8 border border-gold/15 shadow-sm backdrop-blur'>

      {/* LEFT — Images */}
      <div className='flex flex-col gap-6 lg:sticky lg:top-24'>
        <div className='rounded-2xl border border-gold/15 p-5'>
          <p className='mb-1 text-sm text-ink-soft'>Main Image <span className='text-espresso'>*</span></p>
          <p className='mb-3 text-xs text-ink-soft/70'>The main photo — shown as the product thumbnail across the store.</p>
          <label htmlFor="mainImage" className='relative inline-block'>
            <img
              className={`w-28 h-28 rounded-xl border ${mainImage ? 'border-gold/40' : 'border-dashed border-gold/30'} object-cover bg-cream`}
              src={!mainImage ? assets.upload_area : URL.createObjectURL(mainImage)}
              alt="Main image"
              style={{ cursor: 'pointer' }}
            />
            {mainImage && (
              <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-cream shadow-md'>✓</span>
            )}
          </label>
          <input onChange={(e) => setMainImage(e.target.files?.[0] || false)} type="file" id="mainImage" hidden accept="image/*" />
        </div>

      {/* Variants (hidden until toggled) */}
      {!variants.length && (
        <button
          type='button'
          onClick={addVariant}
          className='cursor-pointer rounded-full border border-dashed border-gold/50 px-4 py-2 text-sm font-medium text-espresso transition-colors hover:bg-sand/60 hover:border-gold self-start'
        >
          + Add Variants <span className='text-xs text-ink-soft/60 font-sans'>(optional)</span>
        </button>
      )}

      {variants.length > 0 && (
        <div className='w-full'>
          <div className='mb-1 flex flex-wrap items-center gap-3'>
            <p className='text-sm text-ink-soft'>Product Variants <span className='text-xs text-ink-soft/60 font-sans'>(optional)</span></p>
            <button
              type='button'
              onClick={addVariant}
              disabled={variants.length >= 8}
              className='cursor-pointer rounded-full border border-dashed border-gold/50 px-3 py-1 text-xs font-medium text-espresso transition-colors hover:bg-sand/60 hover:border-gold disabled:opacity-40 disabled:cursor-not-allowed'
            >
              + Add Another Variant
            </button>
          </div>
          <p className='mb-3 text-xs text-ink-soft/70'>
            Each variant can have its own name, price and description — e.g. bottle size, intensity or bundle.
          </p>

          <div className='flex flex-col gap-4'>
            {variants.map((variant, index) => (
              <div key={index} className='rounded-2xl border border-gold/20 bg-cream/60 p-4'>
                <div className='mb-3 flex items-center justify-between'>
                  <p className='font-display text-lg font-semibold text-ink'>Variant {index + 1}</p>
                  <span
                    onClick={() => removeVariant(index)}
                    title="Remove variant"
                    className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-espresso text-xs font-bold text-cream shadow-md transition-transform hover:scale-110'
                  >
                    ✕
                  </span>
                </div>

                <div className='flex flex-wrap items-start gap-4'>
                  <label htmlFor={`variant-image-${index}`} className='block shrink-0'>
                    <img
                      className={`w-20 h-20 rounded-xl border object-cover bg-cream ${variant.image ? 'border-gold/40' : 'border-dashed border-gold/30'}`}
                      src={!variant.image ? assets.upload_area : URL.createObjectURL(variant.image)}
                      alt={`Variant ${index + 1} image`}
                      style={{ cursor: 'pointer' }}
                    />
                  </label>
                  <input onChange={(e) => updateVariant(index, { image: e.target.files?.[0] || false })} type="file" id={`variant-image-${index}`} hidden accept="image/*" />

                  <div className='grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-2'>
                    <div>
                      <p className='mb-1 text-xs text-ink-soft'>Variant name</p>
                      <input
                        onChange={(e) => updateVariant(index, { name: e.target.value })}
                        value={variant.name}
                        className='w-full px-3 py-2'
                        type="text"
                        placeholder='e.g. 100ml, Gift Set, Eau de Parfum'
                      />
                    </div>
                    <div>
                      <p className='mb-1 text-xs text-ink-soft'>Variant price (Rs.)</p>
                      <input
                        onChange={(e) => updateVariant(index, { price: e.target.value })}
                        value={variant.price}
                        className='w-full px-3 py-2'
                        type="number"
                        placeholder='e.g. 3999'
                      />
                    </div>
                    <div className='sm:col-span-2'>
                      <p className='mb-1 text-xs text-ink-soft'>Variant description</p>
                      <textarea
                        onChange={(e) => updateVariant(index, { description: e.target.value })}
                        value={variant.description}
                        className='w-full px-3 py-2'
                        placeholder='Optional — differences: size, intensity, notes…'
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* RIGHT — Details */}
      <div className='flex flex-col gap-4'>
        <div className='rounded-2xl border border-gold/15 p-5 flex flex-col gap-4'>
          <div className='w-full'>
            <p className='mb-2 text-sm text-ink-soft'>Perfume name</p>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className='w-full px-3 py-2'
              type="text"
              placeholder='e.g. Golden Oud'
              required
            />
          </div>

          <div className='w-full'>
            <p className='mb-2 text-sm text-ink-soft'>Perfume description</p>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className='w-full px-3 py-2'
              placeholder='Write content here'
              required
            />
          </div>

          {/* Product Category and Subcategory */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 w-full'>
            <div>
              <p className='mb-2 text-sm text-ink-soft'>Audience</p>
              <select onChange={(e) => SetCategory(e.target.value)} value={category} className='w-full px-3 py-2'>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <p className='mb-2 text-sm text-ink-soft'>Fragrance family</p>
              <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='w-full px-3 py-2'>
                <option value="Eau de Parfum">Eau de Parfum</option>
                <option value="Eau de Toilette">Eau de Toilette</option>
                <option value="Attar / Oil">Attar / Oil</option>
                <option value="Bodyspray">Body Spray</option>
                <option value="Rollerball">Rollerball</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <p className='mb-2 text-sm text-ink-soft'>Price (Rs.)</p>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className='w-full px-3 py-2'
                type="number"
                placeholder='2999'
              />
            </div>
          </div>

          <div className='flex gap-2 mt-1'>
            <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' />
            <label className='cursor-pointer text-sm text-ink-soft' htmlFor="bestseller">Add to Bestseller</label>
          </div>

          <button
            type='submit'
            className='btn-primary w-32 py-3 mt-2'>
            ADD
          </button>
        </div>
      </div>
    </form>
    </>
  );
};

export default Add;