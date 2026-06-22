import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ThemedText, Card, Screen, Button } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { colors, spacing, radius } from '@/theme';

type Me = { id: string; email: string; name: string | null; memberSince: string };

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api.get<Me>('/api/mobile/me').then(setMe).catch(() => {});
  }, []);

  const displayName = me?.name || user?.name || user?.email || 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <ThemedText style={{ fontSize: 28, color: colors.ink, fontWeight: '700' }}>{initial}</ThemedText>
          </View>
          <ThemedText variant="h2" style={{ marginTop: spacing.md }}>
            {displayName}
          </ThemedText>
          <ThemedText variant="bodyMuted">{me?.email || user?.email}</ThemedText>
          {me?.memberSince ? (
            <ThemedText variant="small" style={{ marginTop: 4 }}>
              Member since {formatDate(me.memberSince)}
            </ThemedText>
          ) : null}
        </View>

        <Card style={{ marginTop: spacing.xl }}>
          <ThemedText variant="body">Notifications, settings & full account management are available on the web app.</ThemedText>
        </Card>

        <Button title="Sign out" variant="secondary" onPress={async () => { await signOut(); router.replace('/(auth)/login'); }} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
