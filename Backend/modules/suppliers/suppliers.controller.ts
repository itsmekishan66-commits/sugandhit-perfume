import type { Request, Response } from 'express';
import * as service from './suppliers.service.js';
import { createAuditLog } from '../accounting/accounting.service.js';

const actor = (req: Request) => ({ actorId: req.admin?.id, ip: req.ip });

export const supplierList = async (req: Request, res: Response) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    res.json({
      success: true,
      ...(await service.listSuppliers({ active: q.active, page: q.page ? Number(q.page) : 1, limit: q.limit ? Number(q.limit) : 50, search: q.search })),
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const supplierCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const supplier = await service.createSupplier({ ...req.body, createdBy: a.actorId });
    await createAuditLog({ ...a, action: 'vendor.create', entityType: 'vendor', entityId: supplier.id, newValue: { name: supplier.name }, ip: a.ip });
    res.json({ success: true, supplier, message: 'Supplier created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const supplierUpdate = async (req: Request, res: Response) => {
  try {
    const { id, ...patch } = req.body;
    res.json({ success: true, supplier: await service.updateSupplier(Number(id), patch) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const supplierToggle = async (req: Request, res: Response) => {
  try {
    const { id, active } = req.body;
    res.json({ success: true, supplier: await service.toggleSupplier(Number(id), active) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const supplierDetail = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, supplier: await service.getSupplier(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const supplierDelete = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    const result = await service.deleteSupplier(Number(req.params.id));
    await createAuditLog({ ...a, action: 'vendor.delete', entityType: 'vendor', entityId: Number(req.params.id), previousValue: { name: result.name }, ip: a.ip });
    res.json({ success: true, data: result, message: 'Supplier deleted.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};
