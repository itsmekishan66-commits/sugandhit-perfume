import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';
import db from '../config/db.js';
import { admins } from '../models/schema/index.js';

const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { id?: number };
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

export default adminAuth;