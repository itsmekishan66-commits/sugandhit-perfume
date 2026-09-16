import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  userList,
  adminList,
  userDetail,
  userCredit,
} from './users.controller.js';
import authUser from '../../middleware/auth.middleware.js';
import { loadAdmin, requireAdmin } from '../../middleware/permission.middleware.js';
import { uploadAvatarImage } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { PERMISSIONS } from '../../shared/constants/finance.constants.js';
import { userIdSchema, updateProfileSchema, addCreditSchema } from './users.validation.js';

const usersRouter = express.Router();

usersRouter.use(loadAdmin);

usersRouter.post('/profile', authUser, validate(userIdSchema), getProfile);
usersRouter.post('/update-profile', authUser, validate(updateProfileSchema), updateProfile);
usersRouter.post('/upload-image', authUser, uploadAvatarImage.single('image'), uploadProfileImage);
usersRouter.get('/users', requireAdmin(PERMISSIONS.accounts_view), userList);
usersRouter.get('/admins', requireAdmin(PERMISSIONS.accounts_view), adminList);
usersRouter.post('/user/details', requireAdmin(PERMISSIONS.accounts_view), validate(userIdSchema), userDetail);
usersRouter.post('/user/credit', requireAdmin(PERMISSIONS.payments_create), validate(addCreditSchema), userCredit);

export default usersRouter;