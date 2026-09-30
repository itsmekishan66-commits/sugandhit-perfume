import { backendUrl } from '@/config/constants';
import type { Coupon } from './coupons.types';

export interface CouponListResult {
  success: boolean;
  coupons: Coupon[];
  message?: string;
}

export interface CouponSummary {
  code?: string;
  discountType?: string;
  discountValue?: string | number;
  active?: boolean;
}

export interface CouponResult {
  success: boolean;
  message?: string;
}

export async function fetchCoupons(token: string): Promise<CouponListResult> {
  const response = await fetch(backendUrl +'/api/coupon/admin/list', {
    method:'POST',
    headers: { token },
  });
  return response.json();
}

export async function apiCreateCoupon(token: string, formData: FormData): Promise<CouponResult> {
  const response = await fetch(backendUrl +'/api/coupon/create', {
    method:'POST',
    body: formData,
    headers: { token },
  });
  return response.json();
}

export async function apiToggleCoupon(
  token: string,
  body: { id: string | number; active: boolean }
): Promise<CouponResult> {
  const response = await fetch(backendUrl +'/api/coupon/toggle', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function apiDeleteCoupon(
  token: string,
  body: { id: string | number }
): Promise<CouponResult> {
  const response = await fetch(backendUrl +'/api/coupon/delete', {
    method:'POST',
    headers: {'Content-Type':'application/json', token },
    body: JSON.stringify(body),
  });
  return response.json();
}
