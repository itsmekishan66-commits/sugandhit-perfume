// Types local to the customization feature.
// Props interfaces stay inline in their component files.

export interface Note {
  id: string;
  name: string;
  icon: string;
  color: string;
  price: number;
  description?: string;
}

export interface PaletteBase {
  id: string;
  name: string;
  code: string;
  description: string;
  extraPrice: number;
}

export interface SizeOption {
  id: string;
  label: string;
  ml: string;
  price: number;
  desc: string;
}

export interface BottleTypeOption {
  id: string;
  name: string;
  code: string;
  description: string;
  image: string;
  extraPrice: number;
}

export interface CustomizationData {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  bases: PaletteBase[];
  sizes: SizeOption[];
  bottleTypes: BottleTypeOption[];
  maxNotesPerLayer: number;
  deliveryFee: number;
}

export type LayerKey ='topNotes' |'heartNotes' |'baseNotes';

export type TabKey ='notes' |'bases' |'sizes' |'bottletypes' |'settings';

export type SectionKey = LayerKey |'bases' |'sizes' |'bottleTypes' |'settings';

export interface Message {
  kind:'error' |'info' |'success';
  text: string;
  /** Sticky messages stay until the user edits a field, cancels, or saves. */
  sticky?: boolean;
}

export interface Drafts {
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  bases: PaletteBase[];
  sizes: SizeOption[];
  bottleTypes: BottleTypeOption[];
}

export interface ServerNote { id: number; name: string; layer: string; icon: string; color: string; description: string; price: number; active: boolean; }

export interface ServerBase { id: number; name: string; code: string; description: string; extraPrice: number; active: boolean; }

export interface ServerSize { id: number; label: string; ml: string; price: number; desc: string; active: boolean; }

export interface ServerBottleType { id: number; name: string; code: string; description: string; image: string; extraPrice: number; active: boolean; }

export interface ServerSettings { maxNotesPerLayer: number; deliveryFee: number; }

export interface PalettePayload {
  top: ServerNote[];
  heart: ServerNote[];
  base: ServerNote[];
  bases: ServerBase[];
  sizes: ServerSize[];
  bottleTypes: ServerBottleType[];
  settings: ServerSettings | null;
}
