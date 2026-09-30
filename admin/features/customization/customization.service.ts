import { api } from '@/services/api';
import type { LayerKey } from './customization.types';
import type {
  PalettePayload,
  ServerBase,
  ServerBottleType,
  ServerNote,
  ServerSettings,
  ServerSize,
} from './customization.types';

/** API path segment for each note layer. Mirrors the LAYER_API map in the page. */
const LAYER_API: Record<LayerKey, string> = {
  topNotes:'top',
  heartNotes:'heart',
  baseNotes:'base',
};

export async function fetchPalette(
  token: string
): Promise<{ palette: PalettePayload }> {
  return api<{ palette: PalettePayload }>('/api/note/palette', token);
}

export async function apiSyncNotes(
  token: string,
  layer: LayerKey,
  notes: Partial<ServerNote>[]
): Promise<{ notes: ServerNote[] }> {
  return api<{ notes: ServerNote[] }>(
    `/api/customization/notes/${LAYER_API[layer]}`,
    token,
    { method:'PUT', body: { notes } }
  );
}

export async function apiSyncBases(
  token: string,
  bases: Partial<ServerBase>[]
): Promise<{ bases: ServerBase[] }> {
  return api<{ bases: ServerBase[] }>('/api/customization/bases', token, {
    method:'PUT',
    body: { bases },
  });
}

export async function apiSyncSizes(
  token: string,
  sizes: Partial<ServerSize>[]
): Promise<{ sizes: ServerSize[] }> {
  return api<{ sizes: ServerSize[] }>('/api/customization/sizes', token, {
    method:'PUT',
    body: { sizes },
  });
}

export async function apiSyncBottleTypes(
  token: string,
  bottleTypes: Partial<ServerBottleType>[]
): Promise<{ bottleTypes: ServerBottleType[] }> {
  return api<{ bottleTypes: ServerBottleType[] }>('/api/customization/bottletypes', token, {
    method:'PUT',
    body: { bottleTypes },
  });
}

export async function apiSyncSettings(
  token: string,
  settings: ServerSettings
): Promise<{ settings: ServerSettings | null }> {
  return api<{ settings: ServerSettings | null }>('/api/customization/settings', token, {
    method:'PUT',
    body: settings,
  });
}
