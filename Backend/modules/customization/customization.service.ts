import { eq } from 'drizzle-orm';
import db from '../../database/client.js';
import { notes, perfumebases, bottlesizes, bottletypes, customizationSettings } from '../../database/schema/index.js';
import type { NoteInput, BaseInput, SizeInput, BottleTypeInput, SettingsInput } from './customization.types.js';

const toNum = (value: unknown): string => {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '0';
};

/** Replaces every note in a single layer with the given rows (delete + insert). */
export const saveNotesLayer = async (layer: string, rows: NoteInput[]) => {
  const safeLayer = ['top', 'heart', 'base'].includes(layer) ? layer : 'top';
  await db.delete(notes).where(eq(notes.layer, safeLayer));
  if (rows.length) {
    await db.insert(notes).values(
      rows.map((r) => ({
        name: r.name,
        layer: safeLayer,
        icon: r.icon || '🌿',
        color: r.color || '#ffffff',
        description: r.description ?? '',
        price: toNum(r.price),
        active: true,
      }))
    );
  }
  const saved = await db.select().from(notes).where(eq(notes.layer, safeLayer));
  return saved.map((n) => ({ ...n, price: parseFloat(n.price as string) }));
};

/** Replaces every perfume base with the given rows (delete + insert). */
export const saveBases = async (rows: BaseInput[]) => {
  await db.delete(perfumebases);
  if (rows.length) {
    await db.insert(perfumebases).values(
      rows.map((b) => ({
        name: b.name,
        code: b.code,
        description: b.description ?? '',
        extraPrice: toNum(b.extraPrice),
        active: true,
      }))
    );
  }
  const saved = await db.select().from(perfumebases);
  return saved.map((b) => ({ ...b, extraPrice: parseFloat(b.extraPrice as string) }));
};

/** Replaces every bottle size with the given rows (delete + insert). */
export const saveSizes = async (rows: SizeInput[]) => {
  await db.delete(bottlesizes);
  if (rows.length) {
    await db.insert(bottlesizes).values(
      rows.map((s) => ({
        label: s.label,
        ml: s.ml,
        price: toNum(s.price),
        description: s.desc ?? '',
        active: true,
      }))
    );
  }
  const saved = await db.select().from(bottlesizes);
  return saved.map((s) => ({ ...s, price: parseFloat(s.price as string) }));
};

/** Replaces every bottle type with the given rows (delete + insert). */
export const saveBottleTypes = async (rows: BottleTypeInput[]) => {
  await db.delete(bottletypes);
  if (rows.length) {
    await db.insert(bottletypes).values(
      rows.map((b) => ({
        name: b.name,
        code: b.code,
        description: b.description ?? '',
        image: b.image ?? '',
        extraPrice: toNum(b.extraPrice),
        active: true,
      }))
    );
  }
  const saved = await db.select().from(bottletypes);
  return saved.map((b) => ({ ...b, extraPrice: parseFloat(b.extraPrice as string) }));
};

/** Upserts the single-row customization settings. */
export const saveSettings = async (input: SettingsInput) => {
  const maxNotesPerLayer = Number(input.maxNotesPerLayer);
  const maxNotes = Number.isFinite(maxNotesPerLayer) && maxNotesPerLayer >= 1 ? Math.floor(maxNotesPerLayer) : 3;
  const deliveryFee = toNum(input.deliveryFee);
  const existing = await db.query.customizationSettings.findFirst();
  if (existing) {
    await db
      .update(customizationSettings)
      .set({ maxNotesPerLayer: maxNotes, deliveryFee, updatedAt: Date.now() })
      .where(eq(customizationSettings.id, existing.id));
  } else {
    await db.insert(customizationSettings).values({
      maxNotesPerLayer: maxNotes,
      deliveryFee,
      updatedAt: Date.now(),
    });
  }
  const row = await db.query.customizationSettings.findFirst();
  return row ? { maxNotesPerLayer: row.maxNotesPerLayer, deliveryFee: parseFloat(row.deliveryFee as string) } : null;
};