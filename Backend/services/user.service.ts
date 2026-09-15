import { eq, desc } from 'drizzle-orm';
import validator from 'validator';
import db from '../config/db.js';
import { users, admins, orders, customorders } from '../models/schema/index.js';
import { createToken, createAdminToken, hashPassword, verifyPassword, serializeUser } from '../utils/helper.js';

export const registerUser = async ({ name, email, password, phone = '', address = {} }: { name: string; email: string; password: string; phone?: string; address?: Record<string, string> }) => {
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

export const loginUser = async ({ email, password }: { email: string; password: string }) => {
  if (!email || !password) throw new Error('Please enter email and password.');
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new Error("User doesn't exist.");

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  return createToken(user.id);
};

export const adminLogin = async ({ email, password }: { email: string; password: string }) => {
  if (!email || !password) throw new Error('Please enter email and password.');
  const admin = await db.query.admins.findFirst({ where: eq(admins.email, email) });
  if (!admin) throw new Error('Invalid Credentials');
  if (!admin.active) throw new Error('This admin account has been disabled.');

  const isMatch = await verifyPassword(password, admin.password);
  if (!isMatch) throw new Error('Invalid Credentials');

  return createAdminToken(admin.id);
};

export const getUserById = async (userId: number) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user ? serializeUser(user) : null;
};

export const updateUserById = async (
  userId: number,
  data: { name?: string; phone?: string; address?: Record<string, string>; image?: string }
) => {
  const patch: Partial<typeof users.$inferSelect> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.address !== undefined) patch.address = data.address;
  if (data.image !== undefined) patch.image = data.image;

  if (Object.keys(patch).length === 0) throw new Error('Nothing to update');

  const updated = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
  return serializeUser(updated[0]);
};

export const listAllUsers = async () => {
  const all = await db.select().from(users).orderBy(desc(users.createdAt));
  return all.map(serializeUser);
};

export const listAllAdmins = async () => {
  const all = await db.select().from(admins).orderBy(desc(admins.createdAt));
  return all.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    active: a.active,
    createdAt: a.createdAt,
  }));
};

export const getUserWithHistory = async (userId: number) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.date));
  const userCustomOrders = await db
    .select()
    .from(customorders)
    .where(eq(customorders.userId, userId))
    .orderBy(desc(customorders.date));
  return {
    user: serializeUser(user),
    orders: userOrders.map((o) => ({ ...o, _id: String(o.id), amount: parseFloat(String(o.amount)) })),
    customOrders: userCustomOrders.map((c) => ({ ...c, _id: String(c.id), amount: parseFloat(String(c.amount)) })),
  };
};

export const addUserCredit = async (userId: number, amount: number) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error('User not found.');
  const current = parseFloat(String(user.credit || 0));
  const total = Math.round((current + amount) * 100) / 100;
  const updated = await db
    .update(users)
    .set({ credit: String(total) })
    .where(eq(users.id, userId))
    .returning();
  return serializeUser(updated[0]);
};