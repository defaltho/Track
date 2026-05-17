import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native'
import { MotiView } from 'moti'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'

interface TrayItem {
  id:    string
  label: string
  emoji: string
}

interface Props {
  visible: boolean
  items:   TrayItem[]
  onAdd:   (id: string) => void
}

export function HiddenWidgetTray ({ visible, items, onAdd }: Props) {
  const { colors } = useTheme()
  if (!visible) return null
  return (
    <MotiView
      from={{ opacity: 0, translateY: 80 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 80 }}
      transition={{ type: 'spring', damping: 20, stiffness: 220 }}
      style={[tray.root, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={[tray.title, { color: colors.textMuted }]}>hidden widgets</Text>
      {items.length === 0 ? (
        <Text style={[tray.empty, { color: colors.textFaint }]}>none — tap − on a widget to hide it</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tray.row}>
          {items.map(it => (
            <Pressable
              key={it.id}
              onPress={() => onAdd(it.id)}
              style={({ hovered }: any) => [
                tray.chip,
                { backgroundColor: colors.surfaceEl, borderColor: colors.border },
                hovered && Platform.OS === 'web' && { backgroundColor: colors.surfaceHigh },
              ]}
              accessibilityLabel={`Add ${it.label} widget back`}
            >
              <Text style={tray.chipEmoji}>{it.emoji}</Text>
              <Text style={[tray.chipLabel, { color: colors.text }]}>{it.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </MotiView>
  )
}

const tray = StyleSheet.create({
  root: {
    marginTop: theme.sp4,
    padding: theme.sp4,
    borderRadius: theme.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.sp3,
  },
  title: {
    fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase',
  },
  empty: { fontSize: 12, fontFamily: theme.fontMono, fontStyle: 'italic' },
  row:   { gap: theme.sp2, paddingRight: theme.sp4 },
  chip:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 12, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
})
