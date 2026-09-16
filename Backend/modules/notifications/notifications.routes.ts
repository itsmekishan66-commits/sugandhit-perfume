import { Router } from 'express';
import { adminAuth } from '../../middleware/permission.middleware.js';
import authUser from '../../middleware/auth.middleware.js';
import {
  listNotifications,
  adminListNotifications,
  createNotification,
  markRead,
  removeNotification,
} from './notifications.controller.js';
import {
  validate,
  notificationSchema,
  notificationIdSchema,
  notificationListSchema,
} from './notifications.validation.js';

const router = Router();

router.post('/list', authUser, validate(notificationListSchema), listNotifications);
router.post('/mark-read', authUser, validate(notificationListSchema), markRead);
router.post('/admin/list', adminAuth, adminListNotifications);
router.post('/create', adminAuth, validate(notificationSchema), createNotification);
router.post('/delete', adminAuth, validate(notificationIdSchema), removeNotification);

export default router;