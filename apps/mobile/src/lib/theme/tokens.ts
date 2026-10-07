/**
 * 🌿 PhytoSense v2 Mobile Design Tokens
 * Premium White / Light Theme with Emerald Botanical Accents
 */

export const colors = {
  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceHover: '#E2E8F0',

  // Primary Emerald Botanical Palette
  primary: '#059669', // Emerald 600
  primaryDark: '#047857', // Emerald 700
  primaryDeep: '#064E3B', // Emerald 900
  primaryLight: '#10B981', // Emerald 500
  primaryMuted: '#A7F3D0', // Emerald 200
  primaryTint: '#ECFDF5', // Emerald 50

  // Accent Colors
  accentBlue: '#0284C7', // Sky 600
  accentBlueTint: '#F0F9FF', // Sky 50
  accentAmber: '#D97706', // Amber 600
  accentAmberTint: '#FFFBEB', // Amber 50
  accentRose: '#E11D48', // Rose 600
  accentRoseTint: '#FFF1F2', // Rose 50
  accentPurple: '#7C3AED', // Violet 600
  accentPurpleTint: '#F5F3FF', // Violet 50

  // Text Hierarchies
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#334155', // Slate 700
  textMuted: '#64748B', // Slate 500
  textLight: '#94A3B8', // Slate 400
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0', // Slate 200
  borderSubtle: '#F1F5F9', // Slate 100
  borderActive: '#10B981', // Emerald 500

  // Functional Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

export const shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  floating: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};
