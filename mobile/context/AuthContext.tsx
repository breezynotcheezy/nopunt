import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/storage';

type AuthState = {
  token: string | null;
  isLoading: boolean;
};

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  signInWithBackendToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, isLoading: true });

  useEffect(() => {
    let mounted = true;
    getToken()
      .then((token) => {
        if (!mounted) return;
        setState({ token, isLoading: false });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ token: null, isLoading: false });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithBackendToken = useCallback(async (token: string) => {
    await setToken(token);
    setState({ token, isLoading: false });

    try {
      await apiRequest({ path: '/v1/me', token });
    } catch {
      await clearToken();
      setState({ token: null, isLoading: false });
      throw new Error('Failed to validate session');
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setState({ token: null, isLoading: false });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: state.token,
      isLoading: state.isLoading,
      signInWithBackendToken,
      signOut,
    }),
    [state.isLoading, state.token, signInWithBackendToken, signOut],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not mounted');
  return ctx;
}
