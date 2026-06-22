import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

/**
 * Launch gate: wait for the auth session to restore, then route to the
 * tabs (signed in) or the login screen (signed out).
 */
export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/(tabs)' : '/(auth)/login');
  }, [loading, user, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );
}
