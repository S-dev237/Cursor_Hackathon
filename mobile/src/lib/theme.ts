/**
 * Thème de l'application — palette verte & blanche, design minimaliste.
 */

export const colors = {
  // Verts (couleur de marque)
  primary: '#0E9F6E',
  primaryDark: '#047857',
  primaryLight: '#D1FAE5',
  primarySurface: '#F0FAF5',

  // Neutres
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F5F9F7',
  surfaceAlt: '#EDF3F0',
  border: '#E2EAE6',

  // Texte
  text: '#0F1F18',
  textMuted: '#5B6B63',
  textFaint: '#92A199',

  // États
  danger: '#DC2626',
  dangerSurface: '#FEF2F2',
  warning: '#D97706',
  info: '#2563EB',

  // Accès
  accesPublic: '#0E9F6E',
  accesCampus: '#2563EB',
  accesPrive: '#D97706',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0E3D2B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#0E3D2B',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
