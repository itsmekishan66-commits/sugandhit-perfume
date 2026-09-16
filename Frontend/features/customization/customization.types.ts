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
  topNotes: CustomNoteInput[];
  heartNotes: CustomNoteInput[];
  baseNotes: CustomNoteInput[];
  perfumeBase: string;
  strength: string;
  strengthName: string;
  customLabel: string;
  amount: number;
  address: CustomAddress;
}

export type { PaletteBase } from '@/types/product';