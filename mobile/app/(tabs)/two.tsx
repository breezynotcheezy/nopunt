import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

type MeResponse = {
  user: null | {
    id: string;
    email: string | null;
    displayName: string | null;
    rating: number;
    tier: string;
    streakCount: number;
    entitlement: {
      isPaid: boolean;
      currentPeriodEnd: string | null;
    };
  };
};

export default function ProfileScreen() {
  const { token, signOut } = useAuth();
  const [me, setMe] = useState<MeResponse['user']>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<MeResponse>({ path: '/v1/me', token, method: 'GET' });
      setMe(res.user);
    } catch (e: any) {
      setError(e?.body?.error ?? 'Failed to load profile');
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {busy ? <ActivityIndicator /> : null}

        {me ? (
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Rating</Text>
            <Text style={styles.rowValue}>{me.rating} · {me.tier}</Text>

            <Text style={styles.rowLabel}>Streak</Text>
            <Text style={styles.rowValue}>{me.streakCount} days</Text>

            <Text style={styles.rowLabel}>Entitlement</Text>
            <Text style={styles.rowValue}>{me.entitlement.isPaid ? 'Pro' : 'Free'}</Text>

            {me.entitlement.currentPeriodEnd ? (
              <Text style={styles.meta}>Renews/Ends: {me.entitlement.currentPeriodEnd}</Text>
            ) : null}
          </View>
        ) : null}

        <Pressable style={styles.secondary} onPress={load} disabled={busy}>
          <Text style={styles.secondaryText}>Refresh</Text>
        </Pressable>

        <Pressable style={styles.danger} onPress={signOut}>
          <Text style={styles.dangerText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  rowLabel: {
    opacity: 0.65,
    marginTop: 8,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    marginTop: 8,
    opacity: 0.7,
  },
  secondary: {
    backgroundColor: 'rgba(17,24,39,0.08)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: {
    fontWeight: '700',
  },
  danger: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerText: {
    color: 'white',
    fontWeight: '800',
  },
  error: {
    color: '#dc2626',
  },
});
