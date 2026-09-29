export interface NoteInput {
  id?: number | string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  price?: number | string;
}

export interface BaseInput {
  id?: number | string;
  name: string;
  code: string;
  description?: string;
  extraPrice?: number | string;
}

export interface SizeInput {
  id?: number | string;
  label: string;
  ml: string;
  price?: number | string;
  desc?: string;
}

export interface BottleTypeInput {
  id?: number | string;
  name: string;
  code: string;
  description?: string;
  image?: string;
  extraPrice?: number | string;
}

export interface SettingsInput {
  maxNotesPerLayer?: number;
  deliveryFee?: number | string;
}