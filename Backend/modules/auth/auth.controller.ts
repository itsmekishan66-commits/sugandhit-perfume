import type { Request, Response } from 'express';
import { registerUser, loginUser, adminLogin } from './auth.service.js';
import { ok, fail } from '../../shared/utils/response.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const token = await registerUser({ name, email, password, phone, address });
    ok(res, { token });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser({ email, password });
    ok(res, { token });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const adminLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await adminLogin({ email, password });
    ok(res, { token });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};