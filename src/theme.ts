import { Platform } from 'react-native'

export const theme = {
  bg: '#ebebeb',
  surface: '#ffffff',
  border: '#e0e0e0',
  text: '#111111',
  textMuted: '#888888',
  accent: '#000000',
  accentFg: '#ffffff',

  sp1: 4,
  sp2: 8,
  sp3: 12,
  sp4: 16,
  sp5: 20,
  sp6: 24,
  sp8: 32,

  radiusSm: 8,
  radiusMd: 16,
  radiusXl: 28,

  textXs: 11,
  textSm: 13,
  textBase: 15,
  textLg: 18,
  textXl: 24,
  textHero: 64,

  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }) as object,
} as const

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
}
