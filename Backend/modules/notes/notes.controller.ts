import type { Request, Response } from 'express';
import { getPalette as getPaletteFromService, seedPalette } from './notes.service.js';
import { ok, fail } from '../../shared/utils/response.js';

export const getPalette = async (_req: Request, res: Response) => {
  try {
    ok(res, { palette: await getPaletteFromService() });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

export const seedPaletteController = async (_req: Request, res: Response) => {
  try {
    await seedPalette();
    ok(res, {}, 'Palette seeded');
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};