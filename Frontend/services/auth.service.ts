import { api, apiFetch } from '@/services/api';
import type { AuthResponse, LoginPayload, ProfileUpdateInput, RegisterPayload, UserProfile } from '@/types/user';

export async function loginUser(payload: LoginPayload): Promise<{ success: boolean; token: string; message?: string }> {
  const { data, success } = await apiFetch<AuthResponse>(api('/api/user/login'), { method: 'POST', body: payload });
  return { success, token: data.token || '', message: !success ? data.message : undefined };
}

export async function registerUser(payload: RegisterPayload): Promise<{ success: boolean; message?: string }> {
  const { data, success } = await apiFetch<AuthResponse>(api('/api/user/register'), { method: 'POST', body: payload });
  return { success, message: !success ? data.message : undefined };
}

export async function fetchUserProfile(token: string): Promise<UserProfile | null> {
  const { data, success } = await apiFetch<{ success: boolean; user?: UserProfile }>(
    api('/api/user/profile'),
    { method: 'POST', body: {} },
    token
  );
  return success && data.success && data.user ? data.user : null;
}

export async function updateUserProfile(
  token: string,
  input: ProfileUpdateInput
): Promise<{ ok: boolean; user?: UserProfile; message?: string }> {
  const { data, success } = await apiFetch<{ success: boolean; user?: UserProfile; message?: string }>(
    api('/api/user/update-profile'),
    { method: 'POST', body: input },
    token
  );
  return { ok: success && !!data.success, user: data.user, message: data.message };
}