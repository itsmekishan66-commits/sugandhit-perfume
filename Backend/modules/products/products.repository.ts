import { and, asc, desc, eq, gt, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import { products } from '../../database/schema/index.js';
import { serializeProduct } from './products.utils.js';
import type { ProductInput, ProductListFilters, ProductUpdateInput } from './products.types.js';

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

export const findAll = async () => {
  const all = await db.select().from(products).orderBy(desc(products.date));
  return all.map(serializeProduct);
};

export const findAllPaginated = async (
  limit: number,
  offset: number,
  filters: ProductListFilters = {}
) => {
  const conditions: (ReturnType<typeof sql> | undefined)[] = [];
  if (filters.search) {
    const q = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        ilike(products.name, q),
        ilike(products.sku, q),
        ilike(products.category, q),
        ilike(products.subCategory, q),
        ilike(products.description, q),
        sql`${products.colors}::text ilike ${q}`
      )
    );
  }
  if (filters.category?.length) conditions.push(inArray(products.category, filters.category));
  if (filters.subCategory?.length) conditions.push(inArray(products.subCategory, filters.subCategory));
  if (filters.stock === 'in') conditions.push(gt(products.stock, 0));
  if (filters.stock === 'out') conditions.push(lte(products.stock, 0));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy =
    filters.sort === 'low-high'
      ? asc(products.price)
      : filters.sort === 'high-low'
        ? desc(products.price)
        : desc(products.date);

  const items = await db.select().from(products).where(where ?? sql`1=1`).orderBy(orderBy).limit(limit).offset(offset);
  const counts = await db.select({ count: sql<number>`count(*)` }).from(products).where(where ?? sql`1=1`);
  return { items: items.map(serializeProduct), total: Number(counts[0]?.count ?? 0) };
};

export const listProductCategories = async () => {
  const rows = await db.selectDistinct({ category: products.category }).from(products).orderBy(asc(products.category));
  return rows.map((r) => r.category).filter(Boolean);
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
}