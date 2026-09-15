/* eslint-disable @typescript-eslint/no-namespace */
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';
import db from '../config/db.js';
import { admins } from '../models/schema/index.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../utils/finance.constants.js';

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
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { id?: number };
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
    if (req.admin === undefined) {
      return res.json({ success: false, message: 'Not Authorized, Login Again', code: 'AUTH' });
    }
    if (!req.admin) {
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
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { id?: number };
    return !!decoded.id;
  } catch {
    return false;
  }
};

export const registerDbPermissions = () => {
  void PERMISSIONS;
};