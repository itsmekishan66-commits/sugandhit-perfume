import express from 'express';
import { add, list, remove, single } from './products.controller.js';
import upload from '../../middleware/upload.middleware.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import { productAddSchema, productIdSchema, productSingleSchema } from './products.validation.js';

const productRouter = express.Router();

productRouter.use(loadAdmin);

productRouter.post(
  '/add',
  requireAdmin(PERMISSIONS.inventory_manage),
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'variantImages', maxCount: 8 },
  ]),
  validate(productAddSchema),
  add
);
productRouter.get('/list', list);
productRouter.post('/remove', requireAdmin(PERMISSIONS.inventory_manage), validate(productIdSchema), remove);
productRouter.post('/single', validate(productSingleSchema), single);

export default productRouter;