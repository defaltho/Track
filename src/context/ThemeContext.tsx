import React, { createContext, useContext, useMemo } from 'react'
import { lightColors, darkColors, nothingColors, Colors } from '../theme'
import { useDataStore } from '../stores/data'

interface ThemeCtx {
  colors: Colors
  isDark: boolean
  themeKey: string
  setTheme: (t: 'light' | 'dark' | 'nothing') => void
}

const Ctx = createContext<ThemeCtx>({
  colors: lightColors,
  isDark: false,
  themeKey: 'light',
  setTheme: () => {},
})

function resolveColors(key: string): Colors {
  if (key === 'nothing') return nothingColors
  if (key === 'dark') return darkColors
  return lightColors
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeKey = useDataStore(s => s.settings.theme)
  const updateSettings = useDataStore(s => s.updateSettings)
  const isDark = themeKey === 'dark' || themeKey === 'nothing'
  const colors = resolveColors(themeKey)
  const value = useMemo(
    () => ({
      colors,
      isDark,
      themeKey,
      setTheme: (t: 'light' | 'dark' | 'nothing') => updateSettings({ theme: t }),
    }),
    [colors, isDark, themeKey, updateSettings]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
