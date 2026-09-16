import express from 'express';
import { register, login, adminLoginController } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const authRouter = express.Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.post('/admin', validate(loginSchema), adminLoginController);

export default authRouter;