import { eq, desc } from 'drizzle-orm';
import db from '../../database/client.js';
import { users, admins, orders, customorders } from '../../database/schema/index.js';
import { serializeUser } from './users.utils.js';
import type { UpdateProfileInput } from './users.types.js';

export const findById = async (userId: number) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user ? serializeUser(user) : null;
};

export const update = async (userId: number, data: UpdateProfileInput) => {
  const patch: Partial<typeof users.$inferSelect> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.address !== undefined) patch.address = data.address;
  if (data.image !== undefined) patch.image = data.image;

  const updated = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
  return serializeUser(updated[0]);
};

export const listAll = async () => {
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

export const findWithHistory = async (userId: number) => {
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

export const addCredit = async (userId: number, amount: number) => {
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