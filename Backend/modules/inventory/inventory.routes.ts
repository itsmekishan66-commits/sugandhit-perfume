import express from 'express';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import {
  inventoryAdjustSchema,
  stockLevelSchema,
  inventoryProductUpdateSchema,
  inventoryProductRemoveSchema,
  purchaseOrderCreateSchema,
  purchaseOrderIdSchema,
  purchaseOrderUpdateSchema,
} from './inventory.validation.js';
import {
  stockList,
  stockSummary,
  stockMovementList,
  stockAdjust,
  stockLevel,
  stockProductUpdate,
  stockProductRemove,
  purchaseOrderList,
  purchaseOrderDetail,
  purchaseOrderCreate,
  purchaseOrderReceive,
  purchaseOrderCancel,
  purchaseOrderUpdate,
  purchaseOrderDelete,
} from './inventory.controller.js';

const inventoryRouter = express.Router();

inventoryRouter.use(loadAdmin);

inventoryRouter.get('/stock', requireAdmin(PERMISSIONS.inventory_view), stockList);
inventoryRouter.get('/summary', requireAdmin(PERMISSIONS.inventory_view), stockSummary);
inventoryRouter.get('/movements', requireAdmin(PERMISSIONS.inventory_view), stockMovementList);
inventoryRouter.post('/stock/adjust', requireAdmin(PERMISSIONS.inventory_adjust), validate(inventoryAdjustSchema), stockAdjust);
inventoryRouter.post('/stock/level', requireAdmin(PERMISSIONS.inventory_manage), validate(stockLevelSchema), stockLevel);
inventoryRouter.post('/stock/product', requireAdmin(PERMISSIONS.inventory_manage), validate(inventoryProductUpdateSchema), stockProductUpdate);
inventoryRouter.post('/stock/product/remove', requireAdmin(PERMISSIONS.inventory_manage), validate(inventoryProductRemoveSchema), stockProductRemove);

inventoryRouter.get('/purchases', requireAdmin(PERMISSIONS.inventory_view), purchaseOrderList);
inventoryRouter.get('/purchases/:id', requireAdmin(PERMISSIONS.inventory_view), purchaseOrderDetail);
inventoryRouter.post('/purchases', requireAdmin(PERMISSIONS.inventory_manage), validate(purchaseOrderCreateSchema), purchaseOrderCreate);
inventoryRouter.post('/purchases/receive', requireAdmin(PERMISSIONS.inventory_manage), validate(purchaseOrderIdSchema), purchaseOrderReceive);
inventoryRouter.post('/purchases/cancel', requireAdmin(PERMISSIONS.inventory_manage), validate(purchaseOrderIdSchema), purchaseOrderCancel);
inventoryRouter.post('/purchases/update', requireAdmin(PERMISSIONS.inventory_manage), validate(purchaseOrderUpdateSchema), purchaseOrderUpdate);
inventoryRouter.post('/purchases/delete', requireAdmin(PERMISSIONS.inventory_manage), validate(purchaseOrderIdSchema), purchaseOrderDelete);

export default inventoryRouter;
