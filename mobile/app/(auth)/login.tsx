import { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { ThemedText, Button, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.logo}>
              <ThemedText style={{ fontSize: 32 }}>🎁</ThemedText>
            </View>
            <ThemedText variant="h1" style={{ textAlign: 'center' }}>
              Welcome to Vouchr
            </ThemedText>
            <ThemedText variant="bodyMuted" style={{ textAlign: 'center', marginTop: 4, marginBottom: spacing.xl }}>
              Sign in to your wallet, vouchers & rewards.
            </ThemedText>

            <ThemedText variant="label" style={styles.label}>
              Email
            </ThemedText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.inkFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Email"
            />

            <ThemedText variant="label" style={styles.label}>
              Password
            </ThemedText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.inkFaint}
              secureTextEntry
              autoComplete="password"
              accessibilityLabel="Password"
            />

            {error ? (
              <ThemedText style={{ color: colors.danger, marginTop: spacing.md }}>{error}</ThemedText>
            ) : null}

            <Button title="Sign in" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.xl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logo: { alignSelf: 'center', marginBottom: spacing.md },
  label: { marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
});
