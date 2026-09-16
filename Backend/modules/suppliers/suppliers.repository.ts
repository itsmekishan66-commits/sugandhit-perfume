import { and, eq, ilike, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import db from '../../database/client.js';
import { vendors } from '../../database/schema/index.js';
import type { SupplierInput } from './suppliers.types.js';

export const insertSupplier = async (input: SupplierInput) => {
  const [row] = await db
    .insert(vendors)
    .values({
      name: input.name,
      email: input.email ?? '',
      phone: input.phone ?? '',
      address: input.address ?? '',
      category: input.category ?? '',
      notes: input.notes ?? '',
      createdBy: input.createdBy ?? null,
      createdAt: Date.now(),
    })
    .returning();
  return row;
};

export const findSupplierById = async (id: number) => {
  return db.query.vendors.findFirst({ where: eq(vendors.id, id) });
};

export const findSuppliers = async (opts: { active?: string; page?: number; limit?: number; search?: string } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const active = opts.active && opts.active !== 'all' ? opts.active === 'true' : undefined;
  const q = opts.search?.trim();
  const conditions: SQL[] = [];
  if (active !== undefined) conditions.push(eq(vendors.active, active));
  if (q) {
    conditions.push(
      or(
        ilike(vendors.name, `%${q}%`),
        ilike(vendors.category, `%${q}%`),
        ilike(vendors.phone, `%${q}%`),
        ilike(vendors.email, `%${q}%`),
        ilike(vendors.address, `%${q}%`)
      )!
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const items = await db.query.vendors.findMany({
    where,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(where ?? sql`1=1`);
  return { items, total: Number(counts[0]?.count ?? 0), page, limit };
};

export const updateSupplierById = async (id: number, patch: Record<string, unknown>) => {
  await db.update(vendors).set(patch).where(eq(vendors.id, id));
};

export const toggleSupplierById = async (id: number, active: boolean) => {
  await db.update(vendors).set({ active }).where(eq(vendors.id, id));
};

export const deleteSupplierById = async (id: number) => {
  await db.delete(vendors).where(eq(vendors.id, id));
};
