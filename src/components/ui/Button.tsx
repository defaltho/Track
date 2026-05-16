import React, { useState } from 'react'
import { Pressable, Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { theme } from '../../theme'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
  style?: any
}

// Premium dark button DNA — gradient fill + double drop shadow + subtle top stroke.
// Spec (from design): fill #201E25→#323137, stroke #4B4951→#313036,
// shadow1: 0 2 4 rgba(0,0,0,0.10), shadow2: 0 0 0 1 #0D0D0D, text white.
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  iconLeft,
  iconRight,
  fullWidth,
  style,
}: Props) {
  const scale = useSharedValue(1)
  const [hovered, setHovered] = useState(false)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isWeb = Platform.OS === 'web'

  const sizeStyle = SIZE[size]
  const variantBase = VARIANT[variant]
  const variantHover = HOVER[variant]
  const isInteractive = !disabled && !loading

  return (
    <Pressable
      onPressIn={()  => { if (isInteractive) scale.value = withSpring(0.97, { damping: 18, stiffness: 420 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 420 }) }}
      onHoverIn={()  => { if (isInteractive && isWeb) { setHovered(true);  scale.value = withSpring(1.02, { damping: 22, stiffness: 360 }) } }}
      onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }) } }}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <Animated.View
        style={[
          base.btn,
          sizeStyle.container,
          variantBase.container,
          hovered && isWeb && variantHover.container,
          disabled && base.disabled,
          animStyle,
          style,
        ]}
      >
        {/* Subtle top highlight (only on primary, simulates the stroke gradient top edge) */}
        {variant === 'primary' && <View style={base.topHighlight} pointerEvents="none" />}

        {loading ? (
          <ActivityIndicator color={variantBase.label.color as string} size="small" />
        ) : (
          <View style={base.content}>
            {iconLeft}
            <Text style={[sizeStyle.label, variantBase.label]}>{label}</Text>
            {iconRight}
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

const base = StyleSheet.create({
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.5 },
  topHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
})

const SIZE = {
  sm: {
    container: { paddingVertical: 8,  paddingHorizontal: 14 },
    label:     { fontSize: 13, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
  },
  md: {
    container: { paddingVertical: 12, paddingHorizontal: 20 },
    label:     { fontSize: 14, fontFamily: theme.fontBold,   letterSpacing: -0.2 },
  },
  lg: {
    container: { paddingVertical: 14, paddingHorizontal: 24 },
    label:     { fontSize: 15, fontFamily: theme.fontBold,   letterSpacing: -0.2 },
  },
} as const

// Primary — the "Accept" DNA: dark gradient + double drop shadow + faint top edge
const PRIMARY = {
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3a3942',
    ...Platform.select({
      web: {
        backgroundColor: '#262428',
        background: 'linear-gradient(180deg, #201E25 0%, #323137 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 0 0 1px #0D0D0D',
      } as any,
      ios: {
        backgroundColor: '#262428',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: { backgroundColor: '#262428', elevation: 3 },
      default: { backgroundColor: '#262428' },
    }),
  },
  label: { color: '#FFFFFF' },
} as const

const PRIMARY_HOVER = {
  container: Platform.select({
    web: { background: 'linear-gradient(180deg, #2A282F 0%, #3A393F 100%)', boxShadow: '0 4px 8px rgba(0,0,0,0.18), 0 0 0 1px #0D0D0D' } as any,
    default: {},
  }) as object,
}

const SECONDARY = {
  container: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.4)',
  },
  label: { color: '#111111' },
} as const

const SECONDARY_HOVER = {
  container: Platform.select({
    web: { backgroundColor: 'rgba(0,0,0,0.04)' } as any,
    default: {},
  }) as object,
}

const GHOST = {
  container: { backgroundColor: 'transparent' },
  label:     { color: '#111111' },
} as const

const GHOST_HOVER = {
  container: Platform.select({
    web: { backgroundColor: 'rgba(0,0,0,0.06)' } as any,
    default: {},
  }) as object,
}

const DANGER = {
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#7A1212',
    ...Platform.select({
      web: {
        backgroundColor: '#B91C1C',
        background: 'linear-gradient(180deg, #B91C1C 0%, #991B1B 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 0 0 1px #7A0F0F',
      } as any,
      default: { backgroundColor: '#B91C1C' },
    }),
  },
  label: { color: '#FFFFFF' },
} as const

const DANGER_HOVER = {
  container: Platform.select({
    web: { background: 'linear-gradient(180deg, #D02323 0%, #B01F1F 100%)' } as any,
    default: {},
  }) as object,
}

const VARIANT = {
  primary:   PRIMARY,
  secondary: SECONDARY,
  ghost:     GHOST,
  danger:    DANGER,
}

const HOVER = {
  primary:   PRIMARY_HOVER,
  secondary: SECONDARY_HOVER,
  ghost:     GHOST_HOVER,
  danger:    DANGER_HOVER,
}
