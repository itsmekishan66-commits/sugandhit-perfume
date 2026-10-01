import type { Request, Response } from 'express';
import * as service from './settings.service.js';
import { ok, fail } from '../../shared/utils/response.js';

export const getSettings = async (_req: Request, res: Response) => {
  try {
    ok(res, { settings: await service.getShopSettings() });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    ok(res, { settings: await service.saveShopSettings(req.body ?? {}) }, 'Settings saved');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};