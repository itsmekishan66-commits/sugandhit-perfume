/* eslint-disable @typescript-eslint/no-namespace */
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';
import db from '../database/client.js';
import { admins } from '../database/schema/index.js';
import { ROLE_PERMISSIONS } from '../shared/constants/finance.constants.js';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      admin?: (typeof admins.$inferSelect) | null;
    }
  }
}

export const loadAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { token } = req.headers;
    if (!token) {
      req.admin = null;
      return next();
    }
    const decoded = jwt.verify(token as string, env.JWT_SECRET) as { id?: number };
    if (!decoded.id) {
      req.admin = null;
      return next();
    }
    const admin = await db.query.admins.findFirst({ where: eq(admins.id, Number(decoded.id)) });
    req.admin = admin && admin.active ? admin : null;
    next();
  } catch {
    req.admin = null;
    next();
  }
};

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }
    const decoded = jwt.verify(token as string, env.JWT_SECRET) as { id?: number };
    if (!decoded.id) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }
    const admin = await db.query.admins.findFirst({ where: eq(admins.id, Number(decoded.id)) });
    if (!admin || !admin.active) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const hasPermission = (req: Request, permission: string): boolean => {
  const admin = req.admin;
  if (!admin) return false;
  const rolePermissions = ROLE_PERMISSIONS[admin.role] ?? [];
  return rolePermissions.includes(permission);
};

export const requireAdmin =
  (permission: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!isAdminRequest(req)) {
      return res.json({ success: false, message: 'Not Authorized, Login Again', code: 'AUTH' });
    }
    if (req.admin === undefined || !req.admin) {
      return res.json({ success: false, message: 'Not Authorized, Login Again', code: 'AUTH' });
    }
    if (!hasPermission(req, permission)) {
      return res.json({ success: false, message: 'You do not have permission to perform this action.', code: 'FORBIDDEN' });
    }
    next();
  };

const isAdminRequest = (req: Request) => {
  const { token } = req.headers;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token as string, env.JWT_SECRET) as { id?: number };
    return !!decoded.id;
  } catch {
    return false;
  }
};