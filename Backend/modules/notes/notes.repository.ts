import { desc, eq } from 'drizzle-orm';
import db from '../../database/client.js';
import { notes, perfumebases, bottlesizes, bottletypes } from '../../database/schema/index.js';
import type { Note, PerfumeBase, BottleSize, BottleType, CustomizationSettings } from './notes.types.js';

export const getAllNotes = async (): Promise<Note[]> => {
  const rows = await db.select().from(notes).where(eq(notes.active, true)).orderBy(desc(notes.id));
  return rows.map((n) => ({ ...n, price: parseFloat(n.price as string) }));
};

export const getAllBases = async (): Promise<PerfumeBase[]> => {
  const rows = await db
    .select()
    .from(perfumebases)
    .where(eq(perfumebases.active, true))
    .orderBy(desc(perfumebases.id));
  return rows.map((b) => ({ ...b, extraPrice: parseFloat(b.extraPrice as string) }));
};

export const getSizes = async (): Promise<BottleSize[]> => {
  const rows = await db
    .select()
    .from(bottlesizes)
    .where(eq(bottlesizes.active, true))
    .orderBy(desc(bottlesizes.id));
  return rows.map((s) => ({ id: s.id, label: s.label, ml: s.ml, price: parseFloat(s.price as string), desc: s.description, active: s.active }));
};

export const getBottleTypes = async (): Promise<BottleType[]> => {
  const rows = await db
    .select()
    .from(bottletypes)
    .where(eq(bottletypes.active, true))
    .orderBy(desc(bottletypes.id));
  return rows.map((b) => ({ ...b, extraPrice: parseFloat(b.extraPrice as string) }));
};

export const getSettings = async (): Promise<CustomizationSettings | null> => {
  const row = await db.query.customizationSettings.findFirst();
  if (!row) return null;
  return { maxNotesPerLayer: row.maxNotesPerLayer, deliveryFee: parseFloat(row.deliveryFee as string) };
};

/**
 * Per-table read functions live above (getAllNotes / getAllBases / getSizes /
 * getBottleTypes / getSettings). Call the one you need for a single table; this
 * aggregate exists only for the /customize page, which renders all of them at once.
 */
export const getPalette = async () => {
  const [allNotes, bases, sizes, bottleTypes, settings] = await Promise.all([
    getAllNotes(),
    getAllBases(),
    getSizes(),
    getBottleTypes(),
    getSettings(),
  ]);
  return { notes: allNotes, bases, sizes, bottleTypes, settings };
};