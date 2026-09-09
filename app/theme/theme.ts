/**
 * FitTrack Pro — Premium Performance Operating System
 * Design System Tokens & Theme Configuration
 * Inspired by Apple Fitness+, Whoop & Linear.
 */

export const COLORS = {
  // Background & Surfaces
  background: '#080A0C',
  surfacePrimary: '#111519',
  surfaceElevated: '#171C21',
  border: '#252B31',

  // Typography
  textPrimary: '#F5F7F8',
  textSecondary: '#A1A9B0',
  textMuted: '#68727C',

  // FitTrack Brand (~8% of interface)
  brand: '#C7F000',
  brandSoft: '#E8FF7A',

  // Semantic Colors (~2% of interface)
  warning: '#F5A524',
  error: '#FF5C5C',
  info: '#55B9E8',
  recovery: '#9B8AFB',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const LAYOUT = {
  maxContentWidth: 1200,
  paddingMobile: 20,
  paddingTablet: 24,
  paddingDesktop: 32,
};

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const ACCENTS = {
  electricLime: COLORS.brand,
  softLime: COLORS.brandSoft,
  warning: COLORS.warning,
  error: COLORS.error,
  info: COLORS.info,
  recovery: COLORS.recovery,
  // Backwards compatibility
  vividOrange: COLORS.warning,
  neonBlue: COLORS.info,
  emeraldGreen: COLORS.brand,
  crimsonRed: COLORS.error,
  purplePulse: COLORS.recovery,
};

export const DARK_THEME = {
  mode: 'dark' as const,
  background: COLORS.background,
  cardBackground: COLORS.surfacePrimary,
  cardBorder: COLORS.border,
  surfaceSecondary: COLORS.surfaceElevated,
  textPrimary: COLORS.textPrimary,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
  primary: COLORS.brand,
  primaryText: '#080A0C',
  accentLime: COLORS.brand,
  accentLimeSecondary: COLORS.brandSoft,
  accentOrange: COLORS.warning,
  accentBlue: COLORS.info,
  surfaceVariant: COLORS.surfaceElevated,
  surfaceActive: COLORS.border,
  shadowColor: 'rgba(0, 0, 0, 0.6)',
  glassBackground: 'rgba(8, 10, 12, 0.92)',
};

export const LIGHT_THEME = {
  ...DARK_THEME,
  // System enforces dark mode default for performance OS aesthetic
};

export type ThemeType = typeof DARK_THEME;

export const TYPOGRAPHY = {
  // Screen title: 28-32px, 700
  screenTitle: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  // Section title: 20-22px, 700
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  // Card title: 16-18px, 600
  cardTitle: { fontSize: 16, fontWeight: '600' as const },
  // Body: 14-16px
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  // Secondary: 13-14px
  secondary: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  // Caption: 11-12px
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2 },
  // Performance numbers: 32-48px, 700/800
  performanceNumberLarge: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1 },
  performanceNumberMedium: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  // Labels: 11-12px, 600 uppercase, letterSpacing 0.8px
  label: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  // Backwards compatibility
  h1: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '600' as const },
  button: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.3 },
  kpi: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
};

export const BUTTONS = {
  primary: {
    height: 50,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: SPACING.lg,
  },
  primaryText: {
    color: '#080A0C',
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  secondary: {
    height: 50,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: SPACING.lg,
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  ghost: {
    height: 50,
    backgroundColor: 'transparent',
    borderRadius: RADIUS.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: SPACING.md,
  },
  ghostText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
};

export const INPUTS = {
  container: {
    height: 50,
    backgroundColor: COLORS.surfacePrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  containerFocused: {
    borderColor: COLORS.brand,
  },
};
