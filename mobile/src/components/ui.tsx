import React from 'react';
import {
  Text,
  TextProps,
  View,
  ViewProps,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, shadow, typography } from '../theme';

/** Themed text with a variant matching the type ramp. */
export function ThemedText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: keyof typeof typography }) {
  return <Text {...props} style={[typography[variant], style]} />;
}

/** Warm card surface. */
export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        pressed && !isDisabled && styles.btnPressed,
        isDisabled && styles.btnDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.ink : colors.gold} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'primary' ? { color: colors.ink } : { color: colors.ink },
            variant === 'ghost' && { color: colors.inkMuted },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/** Small rounded badge / pill. */
export function Pill({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'sage' | 'muted' }) {
  const bg = tone === 'sage' ? colors.sageSoft : tone === 'muted' ? colors.surfaceDim : colors.goldSoft;
  const fg = tone === 'sage' ? '#3F6B53' : tone === 'muted' ? colors.inkMuted : colors.goldDeep;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.soft,
  },
  btn: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
  },
  btnPrimary: { backgroundColor: colors.gold, ...shadow.soft },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnGhost: { backgroundColor: 'transparent' },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 16, fontWeight: '600' },
  pill: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '600' },
});
