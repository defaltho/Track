import React, { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { lightColors, darkColors, Colors } from '../theme'
import { useDataStore } from '../stores/data'

export type ThemeKey = 'light' | 'dark' | 'auto'

interface ThemeCtx {
  colors: Colors
  isDark: boolean
  themeKey: ThemeKey
  setTheme: (t: ThemeKey) => void
}

const Ctx = createContext<ThemeCtx>({
  colors: lightColors,
  isDark: false,
  themeKey: 'auto',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeKey = useDataStore(s => s.settings.theme) as ThemeKey
  const updateSettings = useDataStore(s => s.updateSettings)
  const systemScheme = useColorScheme()

  const resolvedKey: 'light' | 'dark' = themeKey === 'auto'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeKey

  const isDark = resolvedKey === 'dark'
  const colors = isDark ? darkColors : lightColors

  const value = useMemo(
    () => ({
      colors,
      isDark,
      themeKey,
      setTheme: (t: ThemeKey) => updateSettings({ theme: t }),
    }),
    [colors, isDark, themeKey, updateSettings]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
