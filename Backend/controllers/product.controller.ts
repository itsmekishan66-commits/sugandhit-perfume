import type { Request, Response } from 'express';
import { addProduct, uploadImages, listProducts, removeProduct, getProductById } from '../services/product.service.js';

export const add = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, subCategory, colors, bestseller } = req.body;

    const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};
    const imgs = [files.image1?.[0], files.image2?.[0], files.image3?.[0], files.image4?.[0]].filter(
      (i): i is Express.Multer.File => !!i
    );

    const image = await uploadImages(imgs);

    await addProduct({
      name,
      description,
      price,
      category,
      subCategory,
      colors,
      bestseller,
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