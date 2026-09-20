import { eq, desc } from 'drizzle-orm';
import db from '../../database/client.js';
import { products } from '../../database/schema/index.js';
import { serializeProduct } from './products.utils.js';
import type { ProductInput, ProductUpdateInput } from './products.types.js';

export const findAll = async () => {
  const all = await db.select().from(products).orderBy(desc(products.date));
  return all.map(serializeProduct);
};

export const findById = async (id: string | number) => {
  const product = await db.query.products.findFirst({ where: eq(products.id, Number(id)) });
  return product ? serializeProduct(product) : null;
};

export const create = async (data: ProductInput) => {
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

export const update = async (id: string | number, data: ProductUpdateInput) => {
  await db
    .update(products)
    .set({
      name: data.name,
      description: data.description,
      category: data.category,
      subCategory: data.subCategory,
      price: data.price,
      bestseller: Boolean(data.bestseller),
      colors: data.variants || [],
      image: data.image,
    })
    .where(eq(products.id, Number(id)));
};

export const remove = async (id: string | number) => {
  await db.delete(products).where(eq(products.id, Number(id)));
};