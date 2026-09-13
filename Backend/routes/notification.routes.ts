import express from 'express';
import { list, adminList, create, markRead, remove } from '../controllers/notification.controller.js';
import adminAuth from '../middleware/adminAuth.middleware.js';
import authUser from '../middleware/auth.middleware.js';
import { validate, notificationSchema, notificationIdSchema, notificationListSchema } from '../validate/index.js';

const notificationRouter = express.Router();

notificationRouter.post('/list', authUser, validate(notificationListSchema), list);
notificationRouter.post('/mark-read', authUser, validate(notificationListSchema), markRead);
notificationRouter.post('/admin/list', adminAuth, adminList);
notificationRouter.post('/create', adminAuth, validate(notificationSchema), create);
notificationRouter.post('/delete', adminAuth, validate(notificationIdSchema), remove);

export default notificationRouter;