import { eq, sql } from 'drizzle-orm';
import db from '../config/db.js';
import { vendors } from '../models/schema/index.js';

export interface VendorInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  notes?: string;
  createdBy?: number;
}

export const createVendor = async (input: VendorInput) => {
  const [vendor] = await db
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
  return { ...vendor, _id: String(vendor.id) };
};

export const listVendors = async (opts: { active?: string; page?: number; limit?: number } = {}) => {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const active = opts.active && opts.active !== 'all' ? opts.active === 'true' : undefined;
  const items = await db.query.vendors.findMany({
    where: active === undefined ? undefined : (t, { eq }) => eq(t.active, active),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
    offset: (page - 1) * limit,
  });
  const counts = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(active === undefined ? sql`1=1` : eq(vendors.active, active));
  return { items: items.map((v) => ({ ...v, _id: String(v.id) })), total: Number(counts[0]?.count ?? 0), page, limit };
};

export const getVendor = async (id: number) => {
  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.id, id) });
  if (!vendor) throw new Error('Vendor not found.');
  return { ...vendor, _id: String(vendor.id) };
};

export const updateVendor = async (id: number, patch: Partial<VendorInput>) => {
  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.id, id) });
  if (!vendor) throw new Error('Vendor not found.');
  const cleaned = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined && v !== null)
  );
  await db.update(vendors).set(cleaned).where(eq(vendors.id, id));
  return getVendor(id);
};

export const toggleVendor = async (id: number, active: boolean) => {
  await db.update(vendors).set({ active }).where(eq(vendors.id, id));
  return getVendor(id);
};