import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'

export function Toast() {
  const items = useToastStore(s => s.items)
  const { colors } = useTheme()
  if (items.length === 0) return null

  return (
    <View style={s.container} pointerEvents="none">
      {items.map(t => {
        const bg     = t.type === 'success' ? colors.success : colors.text
        const fg     = t.type === 'success' ? colors.accentFg : colors.bg
        return (
          <View key={t.id} style={[s.toast, { backgroundColor: bg }]}>
            <Text style={[s.text, { color: fg }]}>{t.message}</Text>
          </View>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96, // sits above floating tab bar (24 + 64)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    gap: theme.sp2,
  },
  toast: {
    paddingHorizontal: theme.sp4,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    maxWidth: 320,
  },
  text: {
    fontSize: theme.textSm,
    fontFamily: theme.fontMedium,
  },
})
