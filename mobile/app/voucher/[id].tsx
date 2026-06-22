import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText, Card, Screen, Button, Pill } from '@/components/ui';
import { voucherValueLabel, formatDate } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';

export default function VoucherDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    code: string;
    type: string;
    value: string;
    currency: string;
    merchantName: string;
    validTo: string;
    status: string;
  }>();
  const router = useRouter();

  const value = Number(params.value || 0);
  const expired = params.status === 'expired';

  return (
    <Screen>
      <View style={{ padding: spacing.lg }}>
        <Card style={styles.hero}>
          <Pill label={expired ? 'Expired' : 'Active'} tone={expired ? 'muted' : 'sage'} />
          <ThemedText style={styles.value}>
            {voucherValueLabel(params.type || 'fixed_amount', value, params.currency || 'EUR')}
          </ThemedText>
          <ThemedText variant="bodyMuted">{params.merchantName}</ThemedText>
          {params.validTo ? (
            <ThemedText variant="small" style={{ marginTop: spacing.sm }}>
              {expired ? 'Expired' : `Valid until ${formatDate(params.validTo)}`}
            </ThemedText>
          ) : null}
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <ThemedText variant="label">Voucher code</ThemedText>
          <ThemedText variant="h3" style={{ marginTop: 4, letterSpacing: 1 }}>
            {params.code}
          </ThemedText>
        </Card>

        <Button
          title="Show QR to redeem"
          onPress={() =>
            router.push({
              pathname: '/redeem/[id]',
              params: { id: params.id, code: params.code, merchantName: params.merchantName },
            })
          }
          disabled={expired}
          style={{ marginTop: spacing.xl }}
        />
        {expired ? (
          <ThemedText variant="small" style={{ textAlign: 'center', marginTop: spacing.sm }}>
            This voucher has expired and can no longer be redeemed.
          </ThemedText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.accent, borderColor: colors.goldSoft, borderRadius: radius.xl, alignItems: 'flex-start' },
  value: { fontSize: 34, fontWeight: '700', color: colors.ink, marginTop: spacing.md, marginBottom: 2 },
});
