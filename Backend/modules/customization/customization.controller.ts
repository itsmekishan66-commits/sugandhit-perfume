import type { Request, Response } from 'express';
import * as service from './customization.service.js';
import { ok, fail } from '../../shared/utils/response.js';

export const saveNotes = async (req: Request, res: Response) => {
  try {
    const layer = String(req.params.layer || '');
    const rows = Array.isArray(req.body?.notes) ? req.body.notes : [];
    ok(res, { notes: await service.saveNotesLayer(layer, rows) });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const saveBases = async (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.bases) ? req.body.bases : [];
    ok(res, { bases: await service.saveBases(rows) });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const saveSizes = async (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.sizes) ? req.body.sizes : [];
    ok(res, { sizes: await service.saveSizes(rows) });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const saveBottleTypes = async (req: Request, res: Response) => {
  try {
    const rows = Array.isArray(req.body?.bottleTypes) ? req.body.bottleTypes : [];
    ok(res, { bottleTypes: await service.saveBottleTypes(rows) });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const saveSettings = async (req: Request, res: Response) => {
  try {
    ok(res, { settings: await service.saveSettings(req.body ?? {}) });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

/** Stores a single bottle-type image and returns its public URL. */
export const uploadBottleTypeImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return fail(res, 'Please choose an image.');
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/bottletypes/${file.filename}`;
    ok(res, { url }, 'Image uploaded');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};