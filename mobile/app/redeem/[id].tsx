import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText, Card, Screen } from '@/components/ui';
import { colors, spacing, radius } from '@/theme';

/**
 * Full-screen redemption QR. The merchant's scanner reads the voucher code;
 * the user holds this up at the point of sale. Brightness boost / NFC can be
 * layered on later.
 */
export default function RedeemScreen() {
  const params = useLocalSearchParams<{ id: string; code: string; merchantName: string }>();

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <ThemedText variant="h2" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
        Scan to redeem
      </ThemedText>
      <ThemedText variant="bodyMuted" style={{ textAlign: 'center', marginBottom: spacing.xl }}>
        Show this to {params.merchantName || 'the merchant'} at checkout.
      </ThemedText>

      <Card style={styles.qrCard}>
        {params.code ? (
          <QRCode
            value={params.code}
            size={240}
            color={colors.ink}
            backgroundColor={colors.white}
          />
        ) : (
          <ThemedText variant="bodyMuted">No code available</ThemedText>
        )}
      </Card>

      <View style={styles.codeBox}>
        <ThemedText variant="label" style={{ textAlign: 'center' }}>
          Voucher code
        </ThemedText>
        <ThemedText variant="h3" style={{ textAlign: 'center', letterSpacing: 2, marginTop: 2 }}>
          {params.code}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: { marginTop: spacing.xl },
});
