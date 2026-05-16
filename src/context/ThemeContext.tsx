import React, { createContext, useContext, useMemo } from 'react'
import { lightColors, darkColors, Colors } from '../theme'
import { useDataStore } from '../stores/data'

export type ThemeKey = 'light' | 'dark'

interface ThemeCtx {
  colors: Colors
  isDark: boolean
  themeKey: ThemeKey
  setTheme: (t: ThemeKey) => void
}

const Ctx = createContext<ThemeCtx>({
  colors: lightColors,
  isDark: false,
  themeKey: 'light',
  setTheme: () => {},
})

function resolveColors(key: string): Colors {
  if (key === 'dark') return darkColors
  return lightColors
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeKey = useDataStore(s => s.settings.theme) as ThemeKey
  const updateSettings = useDataStore(s => s.updateSettings)
  const isDark = themeKey === 'dark'
  const colors = resolveColors(themeKey)
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
