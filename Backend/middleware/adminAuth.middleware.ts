import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }
    const tokenDecode = jwt.verify(token as string, process.env.JWT_SECRET as string);
    if (tokenDecode !== (process.env.ADMIN_EMAIL as string) + (process.env.ADMIN_PASSWORD as string)) {
      return res.json({ success: false, message: 'Not Authorized, Login Again' });
    }
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export default adminAuth;