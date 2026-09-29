import type { Note } from '@/types/product';

export type LayerKey = 'top' | 'heart' | 'base';

export interface Layer {
  key: LayerKey;
  title: string;
  sub: string;
  color: string;
}

export const LAYERS: Layer[] = [
  { key: 'top', title: 'Top Notes', sub: 'The first impression — bright & fleeting', color: 'text-espresso' },
  { key: 'heart', title: 'Heart Notes', sub: 'The soul — blooms in the middle', color: 'text-espresso' },
  { key: 'base', title: 'Base Notes', sub: 'The memory — lingers on skin', color: 'text-espresso' },
];

export const MAX_NOTES_PER_LAYER = 3;

export interface SizeOption {
  label: string;
  ml: string;
  price: number;
  desc: string;
}

export const SIZE_CONFIG: SizeOption[] = [
  { label: '30 ml', ml: '30ml', price: 399, desc: 'Samples & travel' },
  { label: '50 ml', ml: '50ml', price: 699, desc: 'Most chosen' },
  { label: '100 ml', ml: '100ml', price: 999, desc: 'For the committed' },
];

export interface BottleTypeOption {
  name: string;
  code: string;
  extraPrice: number;
  description: string;
  image: string;
}

/** Fallback bottle types, used only when the backend palette has none yet. */
export const BOTTLE_TYPE_CONFIG: BottleTypeOption[] = [
  { name: 'Classic Clear Glass', code: 'classic', extraPrice: 0, description: 'Timeless clear glass with a gold cap', image: 'https://unsplash.com/photos/IBY3ImxMilY/download?w=800&q=80' },
  { name: 'Matte Black', code: 'matte-black', extraPrice: 100, description: 'Sleek, modern and understated', image: 'https://unsplash.com/photos/37EmTaUlAPs/download?w=800&q=80' },
  { name: 'Frosted Crystal', code: 'frosted', extraPrice: 150, description: 'Soft-touch frosted glass with a subtle glow', image: 'https://unsplash.com/photos/QE2T4ttelQk/download?w=800&q=80' },
  { name: 'Vintage Amber', code: 'vintage-amber', extraPrice: 200, description: 'Apothecary-inspired warm amber glass', image: 'https://unsplash.com/photos/gdUxNykbuZc/download?w=800&q=80' },
  { name: 'Faceted Crystal', code: 'faceted', extraPrice: 250, description: 'Cut-crystal gem bottle, gift-worthy', image: 'https://unsplash.com/photos/8m4V_wPWwbY/download?w=800&q=80' },
];

export interface LayerSelection {
  top: Note[];
  heart: Note[];
  base: Note[];
}

export interface CustomAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
}

export interface CustomNoteInput {
  name: string;
  icon: string;
  color: string;
}

export interface CustomOrderPayload {
  name: string;
  bottleSize: string;
  bottleType: string;
  topNotes: CustomNoteInput[];
  heartNotes: CustomNoteInput[];
  baseNotes: CustomNoteInput[];
  perfumeBase: string;
  strength: string;
  strengthName: string;
  customLabel: string;
  amount: number;
  address?: CustomAddress;
}

export type { PaletteBase, PaletteBottleType } from '@/types/product';