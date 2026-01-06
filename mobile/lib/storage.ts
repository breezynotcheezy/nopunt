import { Platform } from 'react-native';

const TOKEN_KEY = 'nopunt_token';

async function getSecureStore() {
  const mod = await import('expo-secure-store');
  return mod;
}

function getWebStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(TOKEN_KEY) ?? null;
  }

  const SecureStore = await getSecureStore();
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(TOKEN_KEY, token);
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(TOKEN_KEY);
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
