import type { Request, Response } from 'express';
import {
  getUserById,
  updateUserById,
  listAllUsers,
  listAllAdmins,
  getUserWithHistory,
  addUserCredit,
} from './users.service.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { ok, fail } from '../../shared/utils/response.js';
import { createAuditLog } from '../accounting/accounting.service.js';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await getUserById(Number(userId));
    if (!user) {
      return fail(res, 'User not found');
    }
    ok(res, { user });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, name, phone, address } = req.body;
    const user = await updateUserById(Number(userId), { name, phone, address });
    ok(res, { user }, 'Profile updated');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId ?? Number(req.body.userId);
    const file = req.file;
    if (!file) {
      return fail(res, 'Please choose an image.');
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${file.filename}`;
    const user = await updateUserById(Number(userId), { image: imageUrl });
    ok(res, { user }, 'Profile photo updated');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const userList = async (_req: Request, res: Response) => {
  try {
    const users = await listAllUsers();
    const admins = await listAllAdmins();
    ok(res, { users, admins, totalCustomers: users.length, totalAdmins: admins.length });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const adminList = async (_req: Request, res: Response) => {
  try {
    ok(res, { admins: await listAllAdmins() });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const userDetail = async (req: Request, res: Response) => {
  try {
    const data = await getUserWithHistory(Number(req.body.userId));
    if (!data) throw new Error('User not found.');
    ok(res, data);
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const userCredit = async (req: Request, res: Response) => {
  try {
    const a = { actorId: req.admin?.id, ip: req.ip };
    const { userId, amount } = req.body;
    const user = await addUserCredit(Number(userId), Number(amount));
    await createAuditLog({
      ...a,
      action: 'user.credit.add',
      entityType: 'users',
      entityId: String(userId),
      newValue: { amount: Number(amount), newCredit: user.credit },
      ip: a.ip,
    });
    ok(res, { user }, 'Credit balance updated.');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};