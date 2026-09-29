import type { Request, Response } from 'express';
import { getPalette as getPaletteFromService, getTable, seedPalette } from './notes.service.js';
import { ok, fail } from '../../shared/utils/response.js';
import { PALETTE_TABLES, type PaletteTable } from './notes.types.js';

export const getPalette = async (_req: Request, res: Response) => {
  try {
    ok(res, { palette: await getPaletteFromService() });
  } catch (error) {
    console.log(error);
    fail(res, (error as Error).message);
  }
};

/**
 * Reads a single palette table (`?table=bases`) so a caller that only needs one table
 * does not load all five. Omit the param, or use /palette, for the full set.
 */
export const getPaletteTable = async (req: Request, res: Response) => {
  const table = String(req.query.table ?? '') as PaletteTable;
  if (!PALETTE_TABLES.includes(table)) {
    fail(res, `Unknown table '${table}'. Use one of: ${PALETTE_TABLES.join(', ')}.`);
    return;
  }
  try {
    ok(res, { table, rows: await getTable(table) });
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