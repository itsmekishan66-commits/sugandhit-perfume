import { api, apiFetch } from '@/services/api';
import type { Coupon } from '@/types/common';

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, success } = await apiFetch<{ success: boolean; coupons?: Coupon[] }>(api('/api/coupon/list'));
  return success && data.success ? (data.coupons || []) : [];
}