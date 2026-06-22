import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ThemedText, Card, Screen, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';

type Balance = { currency: string; available: number; locked: number };

export default function WalletScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ balances: Balance[] }>('/api/mobile/wallet');
      setBalances(data.balances ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const primary = balances[0];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.gold}
          />
        }
      >
        <ThemedText variant="bodyMuted">Welcome back</ThemedText>
        <ThemedText variant="h1" style={{ marginBottom: spacing.lg }}>
          {user?.name || user?.email || 'Member'}
        </ThemedText>

        <Card style={styles.hero}>
          <ThemedText variant="label" style={{ color: colors.goldDeep }}>
            Available credit
          </ThemedText>
          {loading ? (
            <ThemedText variant="h1" style={{ marginTop: 4 }}>
              …
            </ThemedText>
          ) : primary ? (
            <ThemedText style={styles.heroAmount}>
              {formatCurrency(primary.available, primary.currency)}
            </ThemedText>
          ) : (
            <ThemedText style={styles.heroAmount}>{formatCurrency(0, 'EUR')}</ThemedText>
          )}
          {primary && primary.locked > 0 ? (
            <ThemedText variant="small">
              + {formatCurrency(primary.locked, primary.currency)} pending
            </ThemedText>
          ) : null}
        </Card>

        {balances.length > 1 ? (
          <View style={{ marginTop: spacing.md }}>
            {balances.slice(1).map((b) => (
              <Card key={b.currency} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <ThemedText variant="body">{b.currency}</ThemedText>
                  <ThemedText variant="h3">{formatCurrency(b.available, b.currency)}</ThemedText>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {error ? (
          <ThemedText style={{ color: colors.danger, marginTop: spacing.md }}>{error}</ThemedText>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
          <Button title="My vouchers" variant="secondary" onPress={() => router.push('/(tabs)/vouchers')} style={{ flex: 1 }} />
          <Button title="Refer & earn" variant="secondary" onPress={() => router.push('/(tabs)/referrals')} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.accent, borderColor: colors.goldSoft, borderRadius: radius.xl },
  heroAmount: { fontSize: 40, fontWeight: '700', color: colors.ink, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
