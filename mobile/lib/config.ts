import Constants from 'expo-constants';

function extra(): Record<string, unknown> {
  return (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
}

export function apiBaseUrl(): string {
  const fromExtra = typeof extra().API_BASE_URL === 'string' ? (extra().API_BASE_URL as string) : '';
  return fromExtra || 'http://localhost:3000';
}

export function googleWebClientId(): string {
  return typeof extra().GOOGLE_WEB_CLIENT_ID === 'string' ? (extra().GOOGLE_WEB_CLIENT_ID as string) : '';
}

export function demoMode(): boolean {
  return extra().DEMO_MODE === true;
}
