import { Platform } from 'react-native'

export const theme = {
  // Light backgrounds
  bg: '#F2F1EE',
  surface: '#FFFFFF',
  surfaceEl: '#F0EFEC',
  surfaceHigh: '#E8E6E2',

  // Borders
  border: '#E4E2DC',
  borderStrong: '#C8C4BC',

  // Text
  text: '#111111',
  textMuted: '#888880',
  textFaint: '#B5B3AD',

  // Accent — black on white
  accent: '#111111',
  accentFg: '#FFFFFF',
  accentSoft: '#F0EFEC',

  // Semantic
  success: '#16A34A',
  successBg: '#F0FDF4',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  warning: '#D97706',

  // Typography — Roboto family
  fontLight: 'Roboto_300Light',
  fontRegular: 'Roboto_400Regular',
  fontMedium: 'Roboto_500Medium',
  fontBold: 'Roboto_700Bold',
  fontBlack: 'Roboto_900Black',

  // Spacing
  sp1: 4,
  sp2: 8,
  sp3: 12,
  sp4: 16,
  sp5: 20,
  sp6: 24,
  sp8: 32,

  // Radii
  radiusSm: 8,
  radiusMd: 14,
  radiusLg: 18,
  radiusXl: 22,
  radiusFull: 999,

  // Typography
  textXs: 11,
  textSm: 13,
  textBase: 15,
  textLg: 18,
  textXl: 26,
  textHero: 60,

  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    web: {
      boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
    },
    default: {},
  }) as object,

  shadowMd: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.09,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    web: {
      boxShadow: '0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)',
    },
    default: {},
  }) as object,
} as const

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
}
