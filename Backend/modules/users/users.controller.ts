import type { Request, Response } from 'express';
import {
  getUserById,
  updateUserById,
  listAllUsers,
  listAllAdmins,
  getUserWithHistory,
  addUserCredit,
  deleteUserById,
  listAdminRoles,
} from './users.service.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import { ok, fail } from '../../shared/utils/response.js';
import { hasPaginationParams } from '../../middleware/pagination.middleware.js';
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

export const userList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, unknown>;
    const filters = {
      search: typeof q.search === 'string' && q.search.trim() ? q.search : undefined,
    };
    const admins = await listAllAdmins();
    if (!hasPaginationParams(req)) {
      const users = await listAllUsers();
      return ok(res, { users, admins, totalCustomers: users.length, totalAdmins: admins.length });
    }
    const result = await listAllUsers({ ...req.pagination, ...filters });
    ok(res, {
      users: result.items,
      admins,
      totalCustomers: result.total,
      totalAdmins: admins.length,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const adminList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, unknown>;
    const filters = {
      search: typeof q.search === 'string' && q.search.trim() ? q.search : undefined,
      role: typeof q.role === 'string' && q.role ? q.role : undefined,
      status: typeof q.status === 'string' && q.status ? q.status : undefined,
    };
    if (!hasPaginationParams(req)) {
      ok(res, { admins: await listAllAdmins() });
      return;
    }
    const result = await listAllAdmins({ ...req.pagination, ...filters });
    ok(res, {
      admins: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      roles: await listAdminRoles(),
    });
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

export const userDelete = async (req: Request, res: Response) => {
  try {
    const a = { actorId: req.admin?.id, ip: req.ip };
    const { userId } = req.body;
    const user = await deleteUserById(Number(userId));
    if (!user) return fail(res, 'User not found.');
    await createAuditLog({
      ...a,
      action: 'user.delete',
      entityType: 'users',
      entityId: String(userId),
      newValue: { deleted: user.email, name: user.name },
      ip: a.ip,
    });
    ok(res, {}, 'Customer deleted.');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};