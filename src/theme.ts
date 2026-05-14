import { Platform } from 'react-native'

export const theme = {
  // Dark backgrounds
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceEl: '#242424',
  surfaceHigh: '#2E2E2E',

  // Borders (subtle on dark)
  border: '#2A2A2A',
  borderStrong: '#3A3A3A',

  // Text
  text: '#FFFFFF',
  textMuted: '#666666',
  textFaint: '#333333',

  // Accent — white on dark
  accent: '#FFFFFF',
  accentFg: '#000000',
  accentSoft: '#1E1E1E',

  // Semantic
  success: '#22C55E',
  successBg: '#0A1F0F',
  danger: '#EF4444',
  dangerBg: '#1F0707',
  warning: '#F59E0B',

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
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    web: {
      boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
    },
    default: {},
  }) as object,

  shadowMd: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    web: {
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
