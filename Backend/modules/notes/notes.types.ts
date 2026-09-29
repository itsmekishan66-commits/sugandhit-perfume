export interface Note {
  id: number;
  name: string;
  layer: string;
  icon: string;
  color: string;
  description: string;
  price: number;
  active: boolean;
}

export interface PerfumeBase {
  id: number;
  name: string;
  code: string;
  description: string;
  extraPrice: number;
  active: boolean;
}

export interface BottleSize {
  id: number;
  label: string;
  ml: string;
  price: number;
  desc: string;
  active: boolean;
}

export interface BottleType {
  id: number;
  name: string;
  code: string;
  description: string;
  image: string;
  extraPrice: number;
  active: boolean;
}

export interface CustomizationSettings {
  maxNotesPerLayer: number;
  deliveryFee: number;
}

export interface NotePalette {
  top: Note[];
  heart: Note[];
  base: Note[];
  bases: PerfumeBase[];
  sizes: BottleSize[];
  bottleTypes: BottleType[];
  settings: CustomizationSettings | null;
}

/** Names accepted by the single-table read (`GET /api/note/palette/table?table=...`). */
export const PALETTE_TABLES = ['notes', 'bases', 'sizes', 'bottletypes', 'settings'] as const;

export type PaletteTable = (typeof PALETTE_TABLES)[number];