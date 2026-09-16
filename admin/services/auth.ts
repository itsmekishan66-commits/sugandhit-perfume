import { backendUrl } from '../config';
import { adminLoginSchema } from '../validate/schemas';
import type { LoginResponse } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export const adminLogin = async (payload: LoginPayload): Promise<LoginResponse> => {
  const parsed = adminLoginSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message);
  }
  const response = await fetch(backendUrl + '/api/user/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  return (await response.json()) as LoginResponse;
};

export const seedDashboardNotes = async (token: string): Promise<void> => {
  try {
    await fetch(backendUrl + '/api/note/seed', { method: 'POST', headers: { token } });
  } catch (error) {
    console.log(error);
  }
};