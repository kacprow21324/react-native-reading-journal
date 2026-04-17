export type ColorScheme = 'light' | 'dark';

export type Palette = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  divider: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryText: string;
  primaryMuted: string;
  accent: string;
  danger: string;
  dangerBg: string;
  warning: string;
  success: string;
  overlay: string;
  shadow: string;
};

export const lightPalette: Palette = {
  bg: '#F4F6FB',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F7',
  border: '#E2E6EF',
  divider: '#EBEEF3',
  text: '#0F172A',
  textMuted: '#475569',
  textSubtle: '#94A3B8',
  primary: '#3B6EEA',
  primaryText: '#FFFFFF',
  primaryMuted: '#E4ECFD',
  accent: '#F59E0B',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  warning: '#F59E0B',
  success: '#16A34A',
  overlay: 'rgba(15, 23, 42, 0.4)',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export const darkPalette: Palette = {
  bg: '#0B1220',
  bgElevated: '#111A2E',
  surface: '#152142',
  surfaceMuted: '#1B294C',
  border: '#243355',
  divider: '#1E2A4B',
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textSubtle: '#94A3B8',
  primary: '#6D94F5',
  primaryText: '#0B1220',
  primaryMuted: '#1E2E57',
  accent: '#FBBF24',
  danger: '#F87171',
  dangerBg: '#3B1F24',
  warning: '#FBBF24',
  success: '#4ADE80',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
} as const;

export function palette(scheme: ColorScheme): Palette {
  return scheme === 'dark' ? darkPalette : lightPalette;
}

export type Theme = {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};
