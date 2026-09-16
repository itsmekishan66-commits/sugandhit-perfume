import type { SupplierInput, SerializedSupplier } from './suppliers.types.js';
import * as repo from './suppliers.repository.js';

const serialize = (v: Awaited<ReturnType<typeof repo.findSupplierById>>): SerializedSupplier => ({
  ...v!,
  _id: String(v!.id),
});

export const listSuppliers = async (opts: { active?: string; page?: number; limit?: number; search?: string } = {}) => {
  const result = await repo.findSuppliers(opts);
  return { ...result, items: result.items.map((v) => ({ ...v, _id: String(v.id) })) };
};

export const getSupplier = async (id: number) => {
  const vendor = await repo.findSupplierById(id);
  if (!vendor) throw new Error('Supplier not found.');
  return serialize(vendor);
};

export const createSupplier = async (input: SupplierInput) => {
  const vendor = await repo.insertSupplier(input);
  return { ...vendor, _id: String(vendor.id) };
};

export const updateSupplier = async (id: number, patch: Partial<SupplierInput>) => {
  const vendor = await repo.findSupplierById(id);
  if (!vendor) throw new Error('Supplier not found.');
  const cleaned = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined && v !== null));
  await repo.updateSupplierById(id, cleaned);
  return getSupplier(id);
};

export const toggleSupplier = async (id: number, active: boolean) => {
  await repo.toggleSupplierById(id, active);
  return getSupplier(id);
};

export const deleteSupplier = async (id: number) => {
  const vendor = await repo.findSupplierById(id);
  if (!vendor) throw new Error('Supplier not found.');
  await repo.deleteSupplierById(id);
  return { id, deleted: true, name: vendor.name };
};
