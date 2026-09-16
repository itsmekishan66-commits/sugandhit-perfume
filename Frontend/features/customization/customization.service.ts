import { api, apiFetch } from '@/services/api';
import type { Palette } from '@/types/product';
import type { CustomOrderPayload } from './customization.types';

export async function fetchPalette(): Promise<Palette> {
  const { data, success } = await apiFetch<{ success: boolean; palette?: Palette }>(api('/api/note/palette'));
  return success && data.success && data.palette
    ? data.palette
    : { top: [], heart: [], base: [], bases: [] };
}

export async function placeCustomOrder(
  token: string,
  payload: CustomOrderPayload
): Promise<{ success: boolean; message?: string }> {
  const { data, success } = await apiFetch<{ success: boolean; message?: string }>(
    api('/api/custom-order/place'),
    { method: 'POST', body: payload },
    token
  );
  return { success: success && !!data.success, message: data.message };
}