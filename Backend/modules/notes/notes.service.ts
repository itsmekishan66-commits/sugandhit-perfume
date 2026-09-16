import db from '../../database/client.js';
import { notes, perfumebases } from '../../database/schema/index.js';
import { defaultNotes } from '../../database/seed/notes.js';
import { defaultBases } from '../../database/seed/bases.js';
import * as repo from './notes.repository.js';
import type { NotePalette } from './notes.types.js';

export const getPalette = async (): Promise<NotePalette> => {
  const { notes: allNotes, bases } = await repo.getPalette();
  return {
    top: allNotes.filter((n) => n.layer === 'top'),
    heart: allNotes.filter((n) => n.layer === 'heart'),
    base: allNotes.filter((n) => n.layer === 'base'),
    bases,
  };
};

export const seedPalette = async () => {
  const existingNotes = await repo.getAllNotes();
  if (existingNotes.length === 0 && defaultNotes.length) {
    await db.insert(notes).values(defaultNotes);
  }

  const existingBases = await repo.getAllBases();
  if (existingBases.length === 0 && defaultBases.length) {
    await db.insert(perfumebases).values(defaultBases);
  }
};