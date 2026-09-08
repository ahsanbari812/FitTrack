/**
 * FitTrack Design Tokens & Theme Configuration
 * Inspired by Nike Training Club, Whoop & Apple Fitness.
 * Material Design 3 spacing and corner radius guidelines (16px-24px radii, 8pt grid).
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const ACCENTS = {
  electricLime: '#CCFF00',
  vividOrange: '#FF5500',
  neonBlue: '#00D2FF',
  emeraldGreen: '#10B981',
  crimsonRed: '#EF4444',
  purplePulse: '#A855F7',
};

export const LIGHT_THEME = {
  mode: 'light' as const,
  background: '#FFFFFF',
  cardBackground: '#F8FAFC',
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  primary: '#0F172A',
  primaryText: '#FFFFFF',
  accentLime: '#84CC16', // Sleek Lime 500 for light mode
  accentOrange: '#F97316',
  accentBlue: '#0284C7',
  surfaceVariant: '#F1F5F9',
  surfaceActive: '#E2E8F0',
  shadowColor: 'rgba(15, 23, 42, 0.05)',
  glassBackground: 'rgba(255, 255, 255, 0.9)',
};

export const DARK_THEME = {
  mode: 'dark' as const,
  background: '#080A0C',
  cardBackground: '#101418',
  cardBorder: '#20262D',
  surfaceSecondary: '#151A1F',
  textPrimary: '#F5F7F8',
  textSecondary: '#8B949E',
  textMuted: '#6B7280',
  primary: '#C7F000',
  primaryText: '#080A0C',
  accentLime: '#C7F000', // Sleek Lime
  accentLimeSecondary: '#9DBF00',
  accentOrange: '#FB923C',
  accentBlue: '#38BDF8',
  surfaceVariant: '#151A1F',
  surfaceActive: '#20262D',
  shadowColor: 'rgba(0, 0, 0, 0.6)',
  glassBackground: 'rgba(16, 20, 24, 0.9)',
};

export type ThemeType = typeof LIGHT_THEME;

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  bodyLarge: { fontSize: 16, fontWeight: '500' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.2 },
  button: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.3 },
  kpi: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1 },
};
