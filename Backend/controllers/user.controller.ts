import type { Request, Response } from 'express';
import { registerUser, loginUser, adminLogin, getUserById, updateUserById } from '../services/user.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const ok = (res: Response, payload: Record<string, unknown>, message?: string) => {
  res.json({ success: true, ...(message ? { message } : {}), ...payload });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const token = await registerUser({ name, email, password, phone, address });
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await loginUser({ email, password });
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const adminLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await adminLogin({ email, password });
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await getUserById(Number(userId));
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    ok(res, { user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId, name, phone, address } = req.body;
    const user = await updateUserById(Number(userId), { name, phone, address });
    ok(res, { user }, 'Profile updated');
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId ?? Number(req.body.userId);
    const file = req.file;
    if (!file) {
      return res.json({ success: false, message: 'Please choose an image.' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${file.filename}`;
    const user = await updateUserById(Number(userId), { image: imageUrl });
    ok(res, { user }, 'Profile photo updated');
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};