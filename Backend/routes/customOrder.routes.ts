import express from 'express';
import { place, listUserController, listAllController, updateStatus } from '../controllers/customOrder.controller.js';
import authUser from '../middleware/auth.middleware.js';
import adminAuth from '../middleware/adminAuth.middleware.js';
import { validate, customOrderPlaceSchema, orderStatusSchema, userIdSchema } from '../validate/index.js';

const customOrderRouter = express.Router();

customOrderRouter.post('/place', authUser, validate(customOrderPlaceSchema), place);
customOrderRouter.post('/userorders', authUser, validate(userIdSchema), listUserController);
customOrderRouter.post('/list', adminAuth, listAllController);
customOrderRouter.post('/status', adminAuth, validate(orderStatusSchema), updateStatus);

export default customOrderRouter;