import Constants from 'expo-constants';

export function apiBaseUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = typeof extra.API_BASE_URL === 'string' ? extra.API_BASE_URL : '';
  return fromExtra || 'http://localhost:3000';
}
