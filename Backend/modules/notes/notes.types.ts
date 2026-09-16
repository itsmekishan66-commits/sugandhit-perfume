export interface Note {
  id: number;
  name: string;
  layer: string;
  icon: string;
  color: string;
  description: string;
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

export interface NotePalette {
  top: Note[];
  heart: Note[];
  base: Note[];
  bases: PerfumeBase[];
}