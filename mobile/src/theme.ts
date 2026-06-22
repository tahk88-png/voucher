/**
 * Vouchr mobile theme — mirrors the web "warm" design system
 * (app/globals.css design tokens) so the apps feel like one product.
 */

export const colors = {
  // Neutrals
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceDim: '#F4EEE5',
  ink: '#2D2721',
  inkMuted: '#6B5744',
  inkFaint: '#9A8B7A',
  border: '#E8DECE',

  // Brand
  gold: '#FFC857',
  goldDeep: '#EAB02F',
  goldSoft: '#FFF3D6',
  accent: '#FFF1D0',

  // States
  sage: '#9DB5A5',
  sageSoft: '#E6EFE9',
  success: '#22C55E',
  danger: '#C0492F',
  white: '#FFFFFF',
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.ink },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.ink },
  bodyMuted: { fontSize: 15, fontWeight: '400' as const, color: colors.inkMuted },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.inkMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.inkMuted },
} as const;

export const shadow = {
  card: {
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;
