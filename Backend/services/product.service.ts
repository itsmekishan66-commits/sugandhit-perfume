import { v2 as cloudinary } from 'cloudinary';
import { desc, eq } from 'drizzle-orm';
import db from '../config/db.js';
import { products } from '../models/schema/index.js';
import { serializeProduct } from '../utils/helper.js';

interface ProductInput {
  name: string;
  description: string;
  price: string;
  category: string;
  subCategory: string;
  variants?: { name: string; price: string; description: string; image: string }[];
  bestseller?: string;
  image: string[];
  date: number;
}

export const addProduct = async (data: ProductInput) => {
  await db.insert(products).values({
    name: data.name,
    description: data.description,
    category: data.category,
    subCategory: data.subCategory,
    price: data.price,
    bestseller: Boolean(data.bestseller),
    colors: data.variants || [],
    image: data.image,
    date: data.date,
  });
};

export const uploadImages = async (imgs: Express.Multer.File[]) => {
  if (!imgs.length) return [];
  return Promise.all(
    imgs.map(async (item) => {
      const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
      return result.secure_url;
    })
  );
};

export const listProducts = async () => {
  const all = await db.select().from(products).orderBy(desc(products.date));
  return all.map(serializeProduct);
};

export const removeProduct = async (id: string | number) => {
  await db.delete(products).where(eq(products.id, Number(id)));
};

export const getProductById = async (productId: string | number) => {
  const product = await db.query.products.findFirst({ where: eq(products.id, Number(productId)) });
  return product ? serializeProduct(product) : null;
};