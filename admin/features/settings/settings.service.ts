import { api } from '@/services/api';
import type { Settings } from './settings.types';

export interface SettingsResult {
  success: boolean;
  settings: Settings;
  message?: string;
}

export async function fetchSettings(token: string): Promise<SettingsResult> {
  return api<SettingsResult>('/api/settings', token);
}

export async function apiSaveSettings(
  token: string,
  settings: Settings
): Promise<SettingsResult> {
  return api<SettingsResult>('/api/settings', token, { method:'PUT', body: settings });
}