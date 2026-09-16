import { v2 as cloudinary } from 'cloudinary';
import { findAll, findById, create, remove } from './products.repository.js';
import type { ProductInput } from './products.types.js';

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

export const listProducts = async () => findAll();

export const removeProduct = async (id: string | number) => remove(id);

export const getProductById = async (productId: string | number) => findById(productId);