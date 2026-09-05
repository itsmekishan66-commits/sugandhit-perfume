import express from 'express';
import { register, login, adminLoginController, getProfile, updateProfile } from '../controllers/user.controller.js';
import authUser from '../middleware/auth.middleware.js';

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/admin', adminLoginController);
userRouter.post('/profile', authUser, getProfile);
userRouter.post('/update-profile', authUser, updateProfile);

export default userRouter;