import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, View, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { ThemedText, Card, Screen, Pill } from '@/components/ui';
import { voucherValueLabel, formatDate } from '@/lib/format';
import { colors, spacing } from '@/theme';

type Voucher = {
  purchaseId: string;
  voucherId: string;
  type: string;
  value: number;
  currency: string;
  merchantName: string;
  merchantSlug: string;
  code: string;
  validTo: string | null;
  status: string;
};

export default function VouchersScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ vouchers: Voucher[] }>('/api/mobile/vouchers');
      setVouchers(data.vouchers ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vouchers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: Voucher }) => {
    const expired = item.status === 'expired';
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/voucher/[id]',
            params: {
              id: item.voucherId,
              code: item.code,
              type: item.type,
              value: String(item.value),
              currency: item.currency,
              merchantName: item.merchantName,
              validTo: item.validTo ?? '',
              status: item.status,
            },
          })
        }
        style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      >
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="h3">{voucherValueLabel(item.type, item.value, item.currency)}</ThemedText>
              <ThemedText variant="bodyMuted" style={{ marginTop: 2 }}>
                {item.merchantName}
              </ThemedText>
              {item.validTo ? (
                <ThemedText variant="small" style={{ marginTop: 4 }}>
                  {expired ? 'Expired' : `Valid until ${formatDate(item.validTo)}`}
                </ThemedText>
              ) : null}
            </View>
            <Pill label={expired ? 'Expired' : 'Active'} tone={expired ? 'muted' : 'sage'} />
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <Screen>
      <FlatList
        data={vouchers}
        keyExtractor={(v) => v.purchaseId}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
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
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <ThemedText style={{ fontSize: 40 }}>🎟</ThemedText>
              <ThemedText variant="bodyMuted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                {error || 'No vouchers yet. Purchased vouchers appear here.'}
              </ThemedText>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});
