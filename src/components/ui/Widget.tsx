import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'

// ── Widget DNA ────────────────────────────────────────────────────────
// MONO sizing: only two shapes — `square` (1×1) and `rectangle` (2×1).
// Squares pair into rows of 2. Rectangles take the full row.
// Same padding, same radius, same internal gap on both.
//
// Rules:
//   1. Surface fill (colors.surface) on page bg — no border, no shadow.
//      Elevation comes from surface vs. bg lightness difference (§Subtle Layering).
//   2. Border radius theme.radiusXl (22).
//   3. Padding theme.sp5 (20) on all sides.
//   4. Required top header: lowercase marginalia tag (10px Roboto Medium tracking 1.6)
//      on the left + optional action (Button/IconButton sm) on the right.
//      Every widget has a tag — no anonymous cards.
//   5. Body has gap theme.sp4 between children.
//   6. Size:
//        - `square`     : flex:1 + aspectRatio 1 (sits in a WidgetRow pair).
//        - `rectangle`  : width 100%, minHeight WIDGET_H (full row).
//   7. If onPress, whole widget animates (press scale 0.96, web hover scale 1.025).

export const WIDGET_H = 160

interface WidgetProps {
  tag: string
  action?: React.ReactNode
  children: React.ReactNode
  onPress?: () => void
  size?: 'square' | 'rectangle'
  style?: any
}

export function Widget({
  tag, action, children, onPress, size = 'rectangle', style,
}: WidgetProps) {
  const { colors } = useTheme()
  const scale = useSharedValue(1)
  const [hovered, setHovered] = useState(false)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isWeb = Platform.OS === 'web'
  const interactive = !!onPress

  // Mono sizing: square = flex:1 + aspectRatio:1; rectangle = full width + WIDGET_H min height
  const sizeStyle = size === 'square'
    ? { flex: 1, aspectRatio: 1 }
    : { width: '100%' as const, minHeight: WIDGET_H }

  const shellStyle = [
    w.shell,
    sizeStyle,
    { backgroundColor: colors.surface },
    hovered && isWeb && interactive && { backgroundColor: colors.surfaceHigh },
    animStyle,
    style,
  ]

  const inner = (
    <>
      <View style={w.header}>
        <Text style={[w.tag, { color: colors.textMuted }]}>{tag}</Text>
        {action ? <View style={w.action}>{action}</View> : null}
      </View>
      <View style={w.body}>{children}</View>
    </>
  )

  if (interactive) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={()  => { scale.value = withSpring(0.96, { damping: 18, stiffness: 420 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 420 }) }}
        onHoverIn={()  => { if (isWeb) { setHovered(true);  scale.value = withSpring(1.025, { damping: 22, stiffness: 360 }) } }}
        onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }) } }}
        style={size === 'square' ? { flex: 1 } : undefined}
      >
        <Animated.View style={shellStyle}>{inner}</Animated.View>
      </Pressable>
    )
  }

  return <Animated.View style={shellStyle}>{inner}</Animated.View>
}

// Helper: row of two square widgets — pairs them with consistent gap
export function WidgetRow({ children, gap }: { children: React.ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', gap: gap ?? theme.sp3 }}>{children}</View>
}

const w = StyleSheet.create({
  shell: {
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    overflow: 'hidden',
    gap: theme.sp4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Lowercase marginalia tag — system spec §Typography
  tag: {
    fontSize: 10,
    fontFamily: theme.fontMedium,
    letterSpacing: 1.6,
    textTransform: 'lowercase',
  },
  action: { marginLeft: 'auto' },
  // Body fills the remaining widget height after the header so
  // metric widgets can vertically center their hero content.
  body: { flex: 1, gap: theme.sp4 },
})
