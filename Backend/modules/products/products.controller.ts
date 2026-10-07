import type { Request, Response } from 'express';
import {
  addProduct,
  uploadImages,
  listProducts,
  listCategories,
  removeProduct,
  getProductById,
  updateProduct,
} from './products.service.js';
import type { ProductVariant } from '../../database/schema/products.js';
import { ok, fail } from '../../shared/utils/response.js';
import { hasPaginationParams } from '../../middleware/pagination.middleware.js';
import { DEFAULT_PAGE_SIZE } from '../../config/constants.js';

export const add = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, subCategory, bestseller, variants } = req.body;

    const files = (req.files as { mainImage?: Express.Multer.File[]; variantImages?: Express.Multer.File[] }) ?? {};
    const main = files.mainImage?.[0];
    const variantFiles = files.variantImages ?? [];

    if (!main) {
      return fail(res, 'A main image is required.');
    }

    const image = await uploadImages([main, ...variantFiles]);

    let parsedVariants: { name: string; price: string; description: string; image: string }[] = [];
    try {
      parsedVariants = variants ? JSON.parse(variants) : [];
    } catch {
      parsedVariants = [];
    }

    let fileIndex = 0;
    parsedVariants = parsedVariants.map((v) => ({
      ...v,
      image: fileIndex < variantFiles.length ? image[1 + fileIndex++] : '',
    }));

    await addProduct({
      name,
      description,
      price,
      category,
      subCategory,
      bestseller,
      variants: parsedVariants,
      image,
      date: Date.now(),
    });

    ok(res, {}, 'Product Added');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, unknown>;
    const toArray = (value: unknown): string[] | undefined => {
      if (Array.isArray(value)) return value.map(String).filter(Boolean);
      if (typeof value === 'string' && value.trim()) return value.split(',').map((v) => v.trim()).filter(Boolean);
      return undefined;
    };
    const filters = {
      search: typeof q.search === 'string' ? q.search : undefined,
      category: toArray(q.category),
      subCategory: toArray(q.subCategory),
      stock: typeof q.stock === 'string' ? q.stock : undefined,
      sort: typeof q.sort === 'string' ? q.sort : undefined,
    };
    if (!hasPaginationParams(req)) {
      const products = await listProducts();
      return ok(res, { products });
    }
    const pagination = req.pagination ?? { page: 1, limit: DEFAULT_PAGE_SIZE, offset: 0 };
    const result = await listProducts({ page: pagination.page, limit: pagination.limit, ...filters });
    ok(res, {
      products: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      categories: await listCategories(),
    });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await removeProduct(req.body.id);
    ok(res, {}, 'Product Removed');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const single = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const product = await getProductById(productId);
    ok(res, { product });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id, name, description, price, category, subCategory, bestseller, variants, scheme } = req.body;

    const existing = await getProductById(id);
    if (!existing) {
      return fail(res, 'Product not found.');
    }

    let parsedVariants: ProductVariant[] = [];
    try {
      parsedVariants = variants ? JSON.parse(variants) : [];
    } catch {
      parsedVariants = [];
    }

    let parsedScheme: { replaceMain?: boolean; variantFileIndexes?: number[] } = {};
    try {
      parsedScheme = scheme ? JSON.parse(scheme) : {};
    } catch {
      parsedScheme = {};
    }

    const files = (req.files as { mainImage?: Express.Multer.File[]; files?: Express.Multer.File[] }) ?? {};
    const mainFiles = files.mainImage ?? [];
    const variantFiles = files.files ?? [];

    let image = existing.image || [];

    if (mainFiles.length) {
      const [url] = await uploadImages([mainFiles[0]]);
      image = [url, ...image.slice(1)];
    }

    if (variantFiles.length) {
      const urls = await uploadImages(variantFiles);
      const indexes = Array.isArray(parsedScheme.variantFileIndexes) ? parsedScheme.variantFileIndexes : [];
      parsedVariants = parsedVariants.map((v, i) => {
        const fileIndex = indexes[i];
        return {
          ...v,
          image: typeof fileIndex === 'number' && fileIndex >= 0 && fileIndex < urls.length ? urls[fileIndex] : v.image,
        };
      });
    }

    await updateProduct(id, {
      name,
      description,
      price,
      category,
      subCategory,
      bestseller,
      variants: parsedVariants,
      image,
    });

    ok(res, {}, 'Product Updated');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};