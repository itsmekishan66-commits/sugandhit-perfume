import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError.js';

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
  console.error(error);
  res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
};