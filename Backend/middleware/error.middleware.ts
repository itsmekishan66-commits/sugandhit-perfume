import type { Request, Response, NextFunction } from 'express';

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
};