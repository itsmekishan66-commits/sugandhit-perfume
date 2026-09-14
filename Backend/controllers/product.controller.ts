import type { Request, Response } from 'express';
import { addProduct, uploadImages, listProducts, removeProduct, getProductById } from '../services/product.service.js';

export const add = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, subCategory, bestseller, variants } = req.body;

    const files = (req.files as { mainImage?: Express.Multer.File[]; variantImages?: Express.Multer.File[] }) ?? {};
    const main = files.mainImage?.[0];
    const variantFiles = files.variantImages ?? [];

    if (!main) {
      return res.json({ success: false, message: 'A main image is required.' });
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

    res.json({ success: true, message: 'Product Added' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    const products = await listProducts();
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await removeProduct(req.body.id);
    res.json({ success: true, message: 'Product Removed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const single = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const product = await getProductById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};