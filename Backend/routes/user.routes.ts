import express from 'express';
import { register, login, adminLoginController, getProfile, updateProfile } from '../controllers/user.controller.js';
import authUser from '../middleware/auth.middleware.js';
import { validate, registerSchema, loginSchema, userIdSchema, updateProfileSchema } from '../validate/index.js';

const userRouter = express.Router();

userRouter.post('/register', validate(registerSchema), register);
userRouter.post('/login', validate(loginSchema), login);
userRouter.post('/admin', validate(loginSchema), adminLoginController);
userRouter.post('/profile', authUser, validate(userIdSchema), getProfile);
userRouter.post('/update-profile', authUser, validate(updateProfileSchema), updateProfile);

export default userRouter;