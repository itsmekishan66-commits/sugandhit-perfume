import type { Request, Response } from 'express';
import { seedPaletteStock, getPaletteStock } from '../services/note.service.js';

export const seed = async (_req: Request, res: Response) => {
  try {
    await seedPaletteStock();
    res.json({ success: true, message: 'Palette seeded' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};

export const getPalette = async (_req: Request, res: Response) => {
  try {
    const palette = await getPaletteStock();
    res.json({ success: true, palette });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: (error as Error).message });
  }
};