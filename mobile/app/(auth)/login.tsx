import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { demoMode, googleWebClientId } from '@/lib/config';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginScreen() {
  const { signInWithBackendToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const googleClientId = googleWebClientId();

  const redirectUri = AuthSession.makeRedirectUri({});

  const requestConfig = useMemo<AuthSession.AuthRequestConfig>(
    () => ({
      clientId: googleClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: {
        nonce: String(Math.random()).slice(2),
      },
    }),
    [googleClientId, redirectUri],
  );

  const [request, , promptAsync] = AuthSession.useAuthRequest(requestConfig, discovery);

  async function finishGoogle(idToken: string) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await apiRequest<{ token: string }>({
      path: '/v1/auth/google',
      method: 'POST',
      body: { idToken, timezone },
    });
    await signInWithBackendToken(res.token);
  }

  async function onGooglePress() {
    setError(null);
    setBusy(true);
    try {
      if (!googleClientId) throw new Error('Missing GOOGLE_WEB_CLIENT_ID in app.json extra');
      if (!request) throw new Error('Google request not ready');
      const result = await promptAsync({ useProxy: true });
      if (result.type !== 'success') throw new Error('Sign-in cancelled');

      const idToken = (result.params as any).id_token as string | undefined;
      if (!idToken) throw new Error('No id_token returned');

      await finishGoogle(idToken);
    } catch (e: any) {
      setError(e?.message ?? 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDemoPress() {
    setError(null);
    setBusy(true);
    try {
      await signInWithBackendToken('demo');
    } catch (e: any) {
      setError(e?.message ?? 'Demo sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  async function onApplePress() {
    setError(null);
    setBusy(true);
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const idToken = cred.identityToken;
      if (!idToken) throw new Error('No Apple identityToken returned');

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await apiRequest<{ token: string }>({
        path: '/v1/auth/apple',
        method: 'POST',
        body: { idToken, timezone },
      });
      await signInWithBackendToken(res.token);
    } catch (e: any) {
      setError(e?.message ?? 'Apple sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nopunt</Text>
      <Text style={styles.subtitle}>Log in to track rating, streak, and drills.</Text>

      <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={onGooglePress} disabled={busy}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>

      <Pressable style={[styles.secondaryButton, busy && styles.buttonDisabled]} onPress={onDemoPress} disabled={busy}>
        <Text style={styles.secondaryButtonText}>{demoMode() ? 'Continue (Demo Mode)' : 'Continue in Demo Mode'}</Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.appleButton}
          onPress={onApplePress}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.hint}>
        If Google sign-in fails, you likely need to configure OAuth client IDs and set them in the backend.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(17,24,39,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  appleButton: {
    height: 44,
  },
  error: {
    color: '#dc2626',
    marginTop: 8,
  },
  hint: {
    marginTop: 8,
    opacity: 0.7,
    fontSize: 12,
    lineHeight: 16,
  },
});
