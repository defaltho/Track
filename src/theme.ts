import { Platform } from 'react-native'

export const lightColors = {
  bg: '#F2F1EE',
  surface: '#FFFFFF',
  surfaceEl: '#F0EFEC',
  surfaceHigh: '#E8E6E2',
  border: '#E4E2DC',
  borderStrong: '#C8C4BC',
  text: '#111111',
  textMuted: '#888880',
  textFaint: '#B5B3AD',
  accent: '#111111',
  accentFg: '#FFFFFF',
  accentSoft: '#F0EFEC',
  accentRed: '#FF2B2B',
  accentRedFg: '#FFFFFF',
  success: '#16A34A',
  successBg: '#F0FDF4',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  warning: '#D97706',
}

export const darkColors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceEl: '#1E1E1E',
  surfaceHigh: '#282828',
  border: '#242424',
  borderStrong: '#363636',
  text: '#FFFFFF',
  textMuted: '#666666',
  textFaint: '#2E2E2E',
  accent: '#FFFFFF',
  accentFg: '#000000',
  accentSoft: '#1A1A1A',
  accentRed: '#FF2B2B',
  accentRedFg: '#FFFFFF',
  success: '#22C55E',
  successBg: '#0A1F0F',
  danger: '#EF4444',
  dangerBg: '#1F0707',
  warning: '#F59E0B',
}

export type Colors = typeof lightColors

// Static design tokens — never change with theme
export const theme = {
  ...lightColors,

  fontLight: 'Roboto_300Light',
  fontRegular: 'Roboto_400Regular',
  fontMedium: 'Roboto_500Medium',
  fontBold: 'Roboto_700Bold',
  fontBlack: 'Roboto_900Black',
  fontMono: 'SpaceMono_400Regular',
  fontMonoBold: 'SpaceMono_700Bold',

  sp1: 4, sp2: 8, sp3: 12, sp4: 16, sp5: 20, sp6: 24, sp8: 32,

  radiusSm: 8, radiusMd: 14, radiusLg: 18, radiusXl: 22, radiusFull: 999,

  textXs: 11, textSm: 13, textBase: 15, textLg: 18, textXl: 26, textHero: 60,

  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)' },
    default: {},
  }) as object,

  shadowMd: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 16 },
    android: { elevation: 6 },
    web: { boxShadow: '0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05)' },
    default: {},
  }) as object,
} as const

export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', BRL: 'R$',
}

// Font + spacing helpers (don't change with theme)
export const fonts = {
  fontLight: 'Roboto_300Light',
  fontRegular: 'Roboto_400Regular',
  fontMedium: 'Roboto_500Medium',
  fontBold: 'Roboto_700Bold',
  fontBlack: 'Roboto_900Black',
  fontMono: 'SpaceMono_400Regular',
  fontMonoBold: 'SpaceMono_700Bold',
}

export const sp = { sp1: 4, sp2: 8, sp3: 12, sp4: 16, sp5: 20, sp6: 24, sp8: 32 }
export const r = { sm: 8, md: 14, lg: 18, xl: 22, full: 999 }
export const fs = { xs: 11, sm: 13, base: 15, lg: 18, xl: 26, hero: 60 }
