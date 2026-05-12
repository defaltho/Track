import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'

export function Toast() {
  const items = useToastStore(s => s.items)
  if (items.length === 0) return null

  return (
    <View style={s.container}>
      {items.map(t => (
        <View key={t.id} style={[s.toast, t.type === 'success' ? s.success : s.info]}>
          <Text style={s.text}>{t.message}</Text>
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    gap: theme.sp2,
    pointerEvents: 'none',
  },
  toast: {
    paddingHorizontal: theme.sp4,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    maxWidth: 320,
  },
  info: {
    backgroundColor: theme.text,
  },
  success: {
    backgroundColor: '#2d6a4f',
  },
  text: {
    color: '#fff',
    fontSize: theme.textSm,
    fontWeight: '600',
  },
})
