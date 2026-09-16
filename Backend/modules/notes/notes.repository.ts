import { desc, eq } from 'drizzle-orm';
import db from '../../database/client.js';
import { notes, perfumebases } from '../../database/schema/index.js';
import type { Note, PerfumeBase } from './notes.types.js';

export const getAllNotes = async (): Promise<Note[]> => {
  return db.select().from(notes).where(eq(notes.active, true)).orderBy(desc(notes.id));
};

export const getAllBases = async (): Promise<PerfumeBase[]> => {
  const rows = await db
    .select()
    .from(perfumebases)
    .where(eq(perfumebases.active, true))
    .orderBy(desc(perfumebases.id));
  return rows.map((b) => ({ ...b, extraPrice: parseFloat(b.extraPrice as string) }));
};

export const getPalette = async () => {
  const [allNotes, bases] = await Promise.all([getAllNotes(), getAllBases()]);
  return { notes: allNotes, bases };
};