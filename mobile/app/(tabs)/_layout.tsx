import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/theme';

/**
 * Bottom tab navigation. Uses emoji glyphs for icons to keep the scaffold
 * dependency-light; swap for an icon set (e.g. @expo/vector-icons) when
 * wiring final assets.
 */
function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.goldDeep,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Wallet', tabBarIcon: ({ color }) => <TabIcon glyph="◈" color={color} /> }}
      />
      <Tabs.Screen
        name="vouchers"
        options={{ title: 'Vouchers', tabBarIcon: ({ color }) => <TabIcon glyph="🎟" color={color} /> }}
      />
      <Tabs.Screen
        name="referrals"
        options={{ title: 'Referrals', tabBarIcon: ({ color }) => <TabIcon glyph="✦" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon glyph="☺" color={color} /> }}
      />
    </Tabs>
  );
}
