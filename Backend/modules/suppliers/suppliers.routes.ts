import { Router } from 'express';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import { supplierList, supplierCreate, supplierUpdate, supplierToggle, supplierDetail, supplierDelete } from './suppliers.controller.js';
import { supplierCreateSchema, supplierUpdateSchema, validate } from './suppliers.validation.js';

const router = Router();

router.use(loadAdmin);

router.get('/', requireAdmin(PERMISSIONS.payables_view), supplierList);
router.get('/:id', requireAdmin(PERMISSIONS.payables_view), supplierDetail);
router.post('/', requireAdmin(PERMISSIONS.payables_manage), validate(supplierCreateSchema), supplierCreate);
router.put('/:id', requireAdmin(PERMISSIONS.payables_manage), validate(supplierUpdateSchema), supplierUpdate);
router.post('/:id/toggle', requireAdmin(PERMISSIONS.payables_manage), supplierToggle);
router.delete('/:id', requireAdmin(PERMISSIONS.payables_manage), supplierDelete);

export default router;
