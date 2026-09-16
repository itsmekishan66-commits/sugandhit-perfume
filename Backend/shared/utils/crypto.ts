import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';

export const createToken = (id: number) => {
  return jwt.sign({ id }, env.JWT_SECRET);
};

export const createAdminToken = (id: number) => {
  return jwt.sign({ id }, env.JWT_SECRET);
};

export const verifyToken = (token: string): { id?: number } => {
  return jwt.verify(token, env.JWT_SECRET) as { id?: number };
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};