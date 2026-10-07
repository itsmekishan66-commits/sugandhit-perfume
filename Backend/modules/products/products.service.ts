import { v2 as cloudinary } from 'cloudinary';
import { findAll, findAllPaginated, listProductCategories, findById, create, remove, update } from './products.repository.js';
import type { ProductInput, ProductListFilters, ProductUpdateInput } from './products.types.js';
import { buildPaginated, computePagination } from '../../shared/utils/pagination.js';
import type { Paginated } from '../../shared/types/common.types.js';

export const addProduct = async (data: ProductInput) => create(data);

export const uploadImages = async (imgs: Express.Multer.File[]) => {
  if (!imgs.length) return [];
  return Promise.all(
    imgs.map(async (item) => {
      const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
      return result.secure_url;
    })
  );
};

export async function listProducts(): Promise<Awaited<ReturnType<typeof findAll>>>;
export async function listProducts(
  opts: { page: number; limit: number } & ProductListFilters
): Promise<Paginated<Awaited<ReturnType<typeof findAll>>[number]>>;
export async function listProducts(opts?: { page: number; limit: number } & ProductListFilters) {
  if (!opts) return findAll();
  const { page, limit, offset } = computePagination(opts);
  const { items, total } = await findAllPaginated(limit, offset, opts);
  return buildPaginated(items, total, page, limit);
}

export const listCategories = () => listProductCategories();

export const removeProduct = async (id: string | number) => remove(id);

export const getProductById = async (productId: string | number) => findById(productId);

export const updateProduct = async (id: string | number, data: ProductUpdateInput) => update(id, data);