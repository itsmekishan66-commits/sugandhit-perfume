import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
}

const authUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: 'Not Authorized, Login Again' });
  }
  try {
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { id: string };
    req.body.userId = Number(decoded.id);
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export default authUser;