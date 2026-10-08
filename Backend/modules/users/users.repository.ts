import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import db from '../../database/client.js';
import { users, admins, orders, customorders } from '../../database/schema/index.js';
import { serializeUser } from './users.utils.js';
import type { UpdateProfileInput } from './users.types.js';

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

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

export interface UserListFilters {
  search?: string;
}

const buildUserWhere = (filters: UserListFilters = {}) => {
  const conditions: (ReturnType<typeof sql> | undefined)[] = [];
  if (filters.search) {
    const q = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(
        sql`${users.id}::text ilike ${q}`,
        ilike(users.name, q),
        ilike(users.email, q),
        ilike(users.phone, q),
        sql`${users.address}::text ilike ${q}`
      )
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const listAll = async (opts?: { limit?: number; offset?: number } & UserListFilters) => {
  const where = buildUserWhere(opts);
  const query = db.select().from(users).where(where ?? sql`1=1`).orderBy(desc(users.createdAt));
  const all = opts ? await query.limit(opts.limit ?? 50).offset(opts.offset ?? 0) : await query;
  return all.map(serializeUser);
};

export const countUsers = async (filters: UserListFilters = {}) => {
  const where = buildUserWhere(filters);
  const counts = await db.select({ count: sql<number>`count(*)` }).from(users).where(where ?? sql`1=1`);
  return Number(counts[0]?.count ?? 0);
};

export interface AdminListFilters {
  search?: string;
  role?: string;
  /** 'active' | 'disabled' */
  status?: string;
}

const buildAdminWhere = (filters: AdminListFilters = {}) => {
  const conditions: (ReturnType<typeof sql> | undefined)[] = [];
  if (filters.search) {
    const q = `%${escapeLike(filters.search.trim())}%`;
    conditions.push(
      or(sql`${admins.id}::text ilike ${q}`, ilike(admins.name, q), ilike(admins.email, q), ilike(admins.role, q))
    );
  }
  if (filters.role) conditions.push(eq(admins.role, filters.role));
  if (filters.status === 'active') conditions.push(eq(admins.active, true));
  if (filters.status === 'disabled') conditions.push(eq(admins.active, false));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const listAllAdmins = async (opts?: { limit?: number; offset?: number } & AdminListFilters) => {
  const where = buildAdminWhere(opts);
  const query = db.select().from(admins).where(where ?? sql`1=1`).orderBy(desc(admins.createdAt));
  const all = opts ? await query.limit(opts.limit ?? 50).offset(opts.offset ?? 0) : await query;
  return all.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    active: a.active,
    createdAt: a.createdAt,
  }));
};

export const countAdmins = async (filters: AdminListFilters = {}) => {
  const where = buildAdminWhere(filters);
  const counts = await db.select({ count: sql<number>`count(*)` }).from(admins).where(where ?? sql`1=1`);
  return Number(counts[0]?.count ?? 0);
};

export const listAdminRoles = async () => {
  const rows = await db.selectDistinct({ role: admins.role }).from(admins).orderBy(asc(admins.role));
  return rows.map((r) => r.role).filter(Boolean);
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

export const removeById = async (userId: number) => {
  const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
  return deleted[0] ? serializeUser(deleted[0]) : null;
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