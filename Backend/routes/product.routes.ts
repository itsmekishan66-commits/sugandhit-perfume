import express from 'express';
import { add, list, remove, single } from '../controllers/product.controller.js';
import upload from '../middleware/multer.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';

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
  add
);
productRouter.get('/list', list);
productRouter.post('/remove', remove);
productRouter.post('/single', single);

export default productRouter;