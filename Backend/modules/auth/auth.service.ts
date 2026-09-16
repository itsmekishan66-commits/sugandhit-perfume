import { eq } from 'drizzle-orm';
import validator from 'validator';
import db from '../../database/client.js';
import { users, admins } from '../../database/schema/index.js';
import { createToken, createAdminToken, hashPassword, verifyPassword } from '../../shared/utils/crypto.js';
import type { RegisterInput, LoginInput } from './auth.types.js';

export const registerUser = async ({ name, email, password, phone = '', address = {} }: RegisterInput) => {
  const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (exists) throw new Error('Email already exists. Please login.');

  if (!name || !name.trim()) {
    throw new Error('Please enter your full name.');
  }
  if (!validator.isEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!/^[0-9]{10,15}$/.test(phone.trim())) {
    throw new Error('Please enter a valid phone number.');
  }
  if (!address || !String(address).trim()) {
    throw new Error('Please enter your address.');
  }

  const hashedPassword = await hashPassword(password);
  const user = await db
    .insert(users)
    .values({ name, email, password: hashedPassword, phone, address })
    .returning({ id: users.id });
  return createToken(user[0].id);
};

export const loginUser = async ({ email, password }: LoginInput) => {
  if (!email || !password) throw new Error('Please enter email and password.');
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new Error("User doesn't exist.");

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  return createToken(user.id);
};

export const adminLogin = async ({ email, password }: LoginInput) => {
  if (!email || !password) throw new Error('Please enter email and password.');
  const admin = await db.query.admins.findFirst({ where: eq(admins.email, email) });
  if (!admin) throw new Error('Invalid Credentials');
  if (!admin.active) throw new Error('This admin account has been disabled.');

  const isMatch = await verifyPassword(password, admin.password);
  if (!isMatch) throw new Error('Invalid Credentials');

  return createAdminToken(admin.id);
};