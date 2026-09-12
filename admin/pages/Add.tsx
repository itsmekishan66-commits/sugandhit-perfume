import { useState } from 'react';
import type { FormEvent } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../config'
import { toast } from 'react-toastify';
import { productAddSchema } from '../validate/schemas';

interface AddProps {
  token: string;
}

const Add = ({ token }: AddProps) => {
  const [image1, setImage1] = useState<File | false>(false)
  const [image2, setImage2] = useState<File | false>(false)
  const [image3, setImage3] = useState<File | false>(false)
  const [image4, setImage4] = useState<File | false>(false)

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

    try {
      const formData = new FormData()

      formData.append("name", parsed.data.name)
      formData.append("description", parsed.data.description)
      formData.append("price", parsed.data.price)
      formData.append("category", parsed.data.category)
      formData.append("subCategory", parsed.data.subCategory)
      formData.append("bestseller", String(parsed.data.bestseller))
      formData.append("colors", JSON.stringify([]))

      if (image1) formData.append("image1", image1)
      if (image2) formData.append("image2", image2)
      if (image3) formData.append("image3", image3)
      if (image4) formData.append("image4", image4)

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
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
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
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3 bg-white rounded-2xl p-8 border border-orange-100 shadow-sm'>
      <h2 className='text-xl font-semibold text-[#7c2d12] mb-2'>Add New Perfume</h2>

      {/* Image Upload */}
      <div>
        <p className='mb-2 text-sm text-gray-500'>Upload Image</p>
        <div className='flex gap-2'>
          <label htmlFor="image1" className='block'>
            <img className='w-20 rounded-xl' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="Upload" style={{ cursor: 'pointer' }} />
          </label>
          <input onChange={(e) => setImage1(e.target.files?.[0] || false)} type="file" id="image1" hidden />

          <label htmlFor="image2" className='block'>
            <img className='w-20 rounded-xl' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="Upload" style={{ cursor: 'pointer' }} />
          </label>
          <input onChange={(e) => setImage2(e.target.files?.[0] || false)} type="file" id="image2" hidden />

          <label htmlFor="image3" className='block'>
            <img className='w-20 rounded-xl' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="Upload" style={{ cursor: 'pointer' }} />
          </label>
          <input onChange={(e) => setImage3(e.target.files?.[0] || false)} type="file" id="image3" hidden />

          <label htmlFor="image4" className='block'>
            <img className='w-20 rounded-xl' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="Upload" style={{ cursor: 'pointer' }} />
          </label>
          <input onChange={(e) => setImage4(e.target.files?.[0] || false)} type="file" id="image4" hidden />
        </div>
      </div>

      {/* Product Name */}
      <div className='w-full'>
        <p className='mb-2 text-sm text-gray-500'>Perfume name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className='w-full max-w-[500px] px-3 py-2'
          type="text"
          placeholder='e.g. Golden Oud'
          required
        />
      </div>

      {/* Product Description */}
      <div className='w-full'>
        <p className='mb-2 text-sm text-gray-500'>Perfume description</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className='w-full max-w-[500px] px-3 py-2'
          placeholder='Write content here'
          required
        />
      </div>

      {/* Product Category and Subcategory */}
      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2 text-sm text-gray-500'>Audience</p>
          <select onChange={(e) => SetCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        <div>
          <p className='mb-2 text-sm text-gray-500'>Fragrance family</p>
          <select onChange={(e) => setSubCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value="Eau de Parfum">Eau de Parfum</option>
            <option value="Eau de Toilette">Eau de Toilette</option>
            <option value="Attar / Oil">Attar / Oil</option>
            <option value="Bodyspray">Body Spray</option>
            <option value="Rollerball">Rollerball</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>

        <div>
          <p className='mb-2 text-sm text-gray-500'>Price (Rs.)</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className='w-full px-3 py-2 sm:w-[120px]'
            type="number"
            placeholder='2999'
          />
        </div>
      </div>

      <div className='flex gap-2 mt-2'>
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' />
        <label className='cursor-pointer text-sm text-gray-600' htmlFor="bestseller">Add to Bestseller</label>
      </div>

      <button
        type='submit'
        className='w-32 py-3 mt-4 bg-gradient-to-r from-[#7c2d12] to-[#C586A5] text-white rounded-xl font-medium hover:opacity-90 transition-opacity'>
        ADD
      </button>
    </form>
  );
};

export default Add;