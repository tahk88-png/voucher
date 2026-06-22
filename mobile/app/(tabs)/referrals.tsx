import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { api } from '@/lib/api';
import { ThemedText, Card, Screen, Pill } from '@/components/ui';
import { colors, spacing, radius } from '@/theme';

/**
 * Referral overview. Reads the user's referral tier from the existing
 * /api/user/referral-tier endpoint and renders it defensively (the exact
 * shape can evolve without breaking the screen). Creating per-voucher
 * referral links happens from a voucher's share action / the web app.
 */
type ReferralTier = {
  tier?: string;
  currentTier?: string;
  referralsCount?: number;
  count?: number;
  nextTier?: string;
  [k: string]: unknown;
};

export default function ReferralsScreen() {
  const [data, setData] = useState<ReferralTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ReferralTier>('/api/user/referral-tier')
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const tier = data?.tier || data?.currentTier || 'Member';
  const count = data?.referralsCount ?? data?.count;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={styles.hero}>
          <ThemedText style={{ fontSize: 36 }}>✦</ThemedText>
          <ThemedText variant="h2" style={{ marginTop: spacing.sm }}>
            Refer friends, earn credit
          </ThemedText>
          <ThemedText variant="bodyMuted" style={{ textAlign: 'center', marginTop: 4 }}>
            When a friend you refer redeems, you earn wallet credit automatically.
          </ThemedText>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.row}>
            <ThemedText variant="label">Your tier</ThemedText>
            <Pill label={loading ? '…' : String(tier)} />
          </View>
          {typeof count === 'number' ? (
            <View style={[styles.row, { marginTop: spacing.md }]}>
              <ThemedText variant="label">Referrals</ThemedText>
              <ThemedText variant="h3">{count}</ThemedText>
            </View>
          ) : null}
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <ThemedText variant="body">
            Open any voucher and tap Share to send a referral link to a friend. Track all your referrals on the web app.
          </ThemedText>
        </Card>

        {error ? (
          <ThemedText variant="small" style={{ color: colors.danger, marginTop: spacing.md }}>
            {error}
          </ThemedText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', backgroundColor: colors.accent, borderColor: colors.goldSoft, borderRadius: radius.xl, paddingVertical: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
