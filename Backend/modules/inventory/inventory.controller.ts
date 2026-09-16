import type { Request, Response } from 'express';
import {
  listStock,
  inventorySummary,
  listMovements,
  adjustStock,
  updateReorderLevel,
  updateProductInfo,
  deleteProduct,
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from './inventory.service.js';

const actor = (req: Request) => ({ actorId: req.admin?.id, ip: req.ip });

const paging = (req: Request) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 500);
  return { page, limit };
};

export const stockList = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? '');
    const lowStock = req.query.lowStock === 'true' ? 'true' : undefined;
    res.json({ success: true, data: await listStock({ ...paging(req), search, lowStock }) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const stockSummary = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await inventorySummary() });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const stockMovementList = async (req: Request, res: Response) => {
  try {
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    res.json({ success: true, data: await listMovements({ ...paging(req), productId, type, search }) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const stockAdjust = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await adjustStock({ ...req.body, ...a }), message: 'Stock updated.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const stockLevel = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await updateReorderLevel({ ...req.body, actorId: a.actorId }), message: 'Minimum stock level updated.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const stockProductUpdate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await updateProductInfo({ ...req.body, actorId: a.actorId }), message: 'Product updated.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const stockProductRemove = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await deleteProduct({ ...req.body, actorId: a.actorId }), message: 'Product deleted.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderList = async (req: Request, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    res.json({ success: true, data: await listPurchaseOrders({ ...paging(req), status, supplierId, search }) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderDetail = async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await getPurchaseOrder(Number(req.params.id)) });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderCreate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await createPurchaseOrder({ ...req.body, createdBy: a.actorId }), message: 'Purchase order created.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderReceive = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({
      success: true,
      data: await receivePurchaseOrder({ ...req.body, ...a }),
      message: 'Purchase order received — stock added, bill and journal entry created.',
    });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderCancel = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await cancelPurchaseOrder({ ...req.body, ...a }), message: 'Purchase order cancelled.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderUpdate = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await updatePurchaseOrder({ ...req.body, actorId: a.actorId }), message: 'Purchase order updated.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};

export const purchaseOrderDelete = async (req: Request, res: Response) => {
  try {
    const a = actor(req);
    res.json({ success: true, data: await deletePurchaseOrder({ ...req.body, actorId: a.actorId }), message: 'Purchase order deleted.' });
  } catch (error) {
    res.json({ success: false, message: (error as Error).message });
  }
};
