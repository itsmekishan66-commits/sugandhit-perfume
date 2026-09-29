import db from '../../database/client.js';
import { notes, perfumebases, bottletypes } from '../../database/schema/index.js';
import { defaultNotes, defaultBases, defaultBottleTypes } from '../../database/seed/customization.js';
import { ensureCustomizationTables } from '../../database/seed/customization.seed.js';
import * as repo from './notes.repository.js';
import type { NotePalette, PaletteTable } from './notes.types.js';

/**
 * Reads exactly one palette table. Each branch hits a single table so a caller that only
 * needs, say, the bottle types does not pay for the other four.
 */
export const getTable = async (table: PaletteTable) => {
  switch (table) {
    case 'notes':
      return repo.getAllNotes();
    case 'bases':
      return repo.getAllBases();
    case 'sizes':
      return repo.getSizes();
    case 'bottletypes':
      return repo.getBottleTypes();
    case 'settings':
      return repo.getSettings();
  }
};

export const getPalette = async (): Promise<NotePalette> => {
  const { notes: allNotes, bases, sizes, bottleTypes, settings } = await repo.getPalette();
  return {
    top: allNotes.filter((n) => n.layer === 'top'),
    heart: allNotes.filter((n) => n.layer === 'heart'),
    base: allNotes.filter((n) => n.layer === 'base'),
    bases,
    sizes,
    bottleTypes,
    settings,
  };
};

/**
 * Fills any empty /customize table with its defaults. Exposed via POST /api/note/seed so
 * an admin can top up a table that was cleared. Shares `seedCustomization`'s DDL so this
 * works even when the tables have never been created.
 *
 * Each table is checked through its own repository read, so this only touches the tables
 * that are actually empty.
 */
export const seedPalette = async () => {
  await ensureCustomizationTables();

  if ((await repo.getAllNotes()).length === 0 && defaultNotes.length) {
    await db.insert(notes).values(defaultNotes);
  }

  if ((await repo.getAllBases()).length === 0 && defaultBases.length) {
    await db.insert(perfumebases).values(defaultBases);
  }

  if ((await repo.getBottleTypes()).length === 0 && defaultBottleTypes.length) {
    await db.insert(bottletypes).values(defaultBottleTypes);
  }
};