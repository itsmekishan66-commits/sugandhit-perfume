import express from 'express';
import { add, list, remove, single } from '../controllers/product.controller.js';
import upload from '../middleware/multer.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';
import { validate, productAddSchema, productIdSchema, productSingleSchema } from '../validate/index.js';

const productRouter = express.Router();

productRouter.post(
  '/add',
  adminAuth,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  validate(productAddSchema),
  add
);
productRouter.get('/list', list);
productRouter.post('/remove', validate(productIdSchema), remove);
productRouter.post('/single', validate(productSingleSchema), single);

export default productRouter;