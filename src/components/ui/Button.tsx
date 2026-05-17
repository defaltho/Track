import React, { useState } from 'react'
import { Pressable, Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'surface'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Foreground color matching the primary button surface in the active theme.
// Use this for icons / text rendered as IconButton children.
export function usePrimaryFg() {
  const { isDark } = useTheme()
  return isDark ? '#111111' : '#FFFFFF'
}

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
  const { isDark } = useTheme()

  const sizeStyle = SIZE[size]
  const VARIANTS = isDark ? VARIANT_DARK : VARIANT
  const HOVERS   = isDark ? HOVER_DARK   : HOVER
  const variantBase = VARIANTS[variant]
  const variantHover = HOVERS[variant]
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
        {/* Subtle top highlight (light theme only — dark theme uses gradient stroke instead) */}
        {variant === 'primary' && !isDark && <View style={base.topHighlight} pointerEvents="none" />}

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
        transition: 'box-shadow 160ms ease, background 160ms ease',
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
    web: { background: 'linear-gradient(180deg, #2A282F 0%, #3A393F 100%)', boxShadow: '0 3px 6px rgba(0,0,0,0.12), 0 0 0 1px #0D0D0D' } as any,
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

// Surface — neutral grayscale variant (nav chevrons, secondary actions).
// Light: subtle filled card-like surface with soft top edge.
const SURFACE = {
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E2DC',
    ...Platform.select({
      web: {
        backgroundColor: '#F4F3F0',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
        transition: 'box-shadow 160ms ease, background 160ms ease',
      } as any,
      ios: {
        backgroundColor: '#F4F3F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { backgroundColor: '#F4F3F0', elevation: 1 },
      default: { backgroundColor: '#F4F3F0' },
    }),
  },
  label: { color: '#111111' },
} as const

const SURFACE_HOVER = {
  container: Platform.select({
    web: { backgroundColor: '#ECEBE8', boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' } as any,
    default: {},
  }) as object,
}

const VARIANT = {
  primary:   PRIMARY,
  secondary: SECONDARY,
  ghost:     GHOST,
  danger:    DANGER,
  surface:   SURFACE,
}

const HOVER = {
  primary:   PRIMARY_HOVER,
  secondary: SECONDARY_HOVER,
  ghost:     GHOST_HOVER,
  danger:    DANGER_HOVER,
  surface:   SURFACE_HOVER,
}

// ─── Dark theme DNA — white buttons on black bg ────────────────────────
// Spec: flat fill #E3E3E3 @ 80% + gradient stroke #FDFDFD(100%)→#F1F1F1(0%) top→bottom,
// shadow1: 0 2 4 rgba(0,0,0,0.10), shadow2: 0 0 0 1 rgba(0,0,0,0.16), text #111.
const PRIMARY_DARK_FILL = 'rgba(227,227,227,0.8)'
const PRIMARY_DARK = {
  container: {
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      web: {
        // Two-layer background: solid fill clipped to padding-box, gradient stroke clipped to border-box.
        background:
          `linear-gradient(${PRIMARY_DARK_FILL}, ${PRIMARY_DARK_FILL}) padding-box, ` +
          'linear-gradient(180deg, #FDFDFD 0%, rgba(241,241,241,0) 100%) border-box',
        borderColor: 'transparent',
        boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.16)',
        transition: 'box-shadow 160ms ease, background 160ms ease',
      } as any,
      ios: {
        backgroundColor: PRIMARY_DARK_FILL,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
      },
      android: { backgroundColor: PRIMARY_DARK_FILL, elevation: 3 },
      default: { backgroundColor: PRIMARY_DARK_FILL },
    }),
  },
  label: { color: '#111111' },
} as const

const PRIMARY_DARK_HOVER = {
  container: Platform.select({
    web: {
      background:
        'linear-gradient(rgba(235,235,235,0.9), rgba(235,235,235,0.9)) padding-box, ' +
        'linear-gradient(180deg, #FFFFFF 0%, rgba(241,241,241,0) 100%) border-box',
      boxShadow: '0 3px 6px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.18)',
    } as any,
    default: {},
  }) as object,
}

const SECONDARY_DARK = {
  container: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  label: { color: '#FFFFFF' },
} as const

const SECONDARY_DARK_HOVER = {
  container: Platform.select({
    web: { backgroundColor: 'rgba(255,255,255,0.06)' } as any,
    default: {},
  }) as object,
}

const GHOST_DARK = {
  container: { backgroundColor: 'transparent' },
  label:     { color: '#FFFFFF' },
} as const

const GHOST_DARK_HOVER = {
  container: Platform.select({
    web: { backgroundColor: 'rgba(255,255,255,0.08)' } as any,
    default: {},
  }) as object,
}

// Danger keeps its red identity in both themes — slightly brighter ring on dark bg.
const DANGER_DARK = {
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#7A1212',
    ...Platform.select({
      web: {
        backgroundColor: '#B91C1C',
        background: 'linear-gradient(180deg, #B91C1C 0%, #991B1B 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35), 0 0 0 1px #000000',
      } as any,
      default: { backgroundColor: '#B91C1C' },
    }),
  },
  label: { color: '#FFFFFF' },
} as const

const DANGER_DARK_HOVER = {
  container: Platform.select({
    web: { background: 'linear-gradient(180deg, #D02323 0%, #B01F1F 100%)' } as any,
    default: {},
  }) as object,
}

// Surface dark — grayscale elevated card on dark bg (nav chevrons etc.).
// Mirror of PRIMARY_DARK DNA: flat fill #1E1E1E + gradient stroke fading top→bottom + double shadow.
const SURFACE_DARK_FILL = '#1E1E1E'
const SURFACE_DARK = {
  container: {
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      web: {
        background:
          `linear-gradient(${SURFACE_DARK_FILL}, ${SURFACE_DARK_FILL}) padding-box, ` +
          'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 100%) border-box',
        borderColor: 'transparent',
        boxShadow: '0 2px 4px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.50)',
        transition: 'box-shadow 160ms ease, background 160ms ease',
      } as any,
      ios: {
        backgroundColor: SURFACE_DARK_FILL,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.30,
        shadowRadius: 4,
      },
      android: { backgroundColor: SURFACE_DARK_FILL, elevation: 3 },
      default: { backgroundColor: SURFACE_DARK_FILL },
    }),
  },
  label: { color: '#FFFFFF' },
} as const

const SURFACE_DARK_HOVER = {
  container: Platform.select({
    web: {
      background:
        'linear-gradient(#262626, #262626) padding-box, ' +
        'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%) border-box',
      boxShadow: '0 3px 6px rgba(0,0,0,0.36), 0 0 0 1px rgba(0,0,0,0.55)',
    } as any,
    default: {},
  }) as object,
}

const VARIANT_DARK = {
  primary:   PRIMARY_DARK,
  secondary: SECONDARY_DARK,
  ghost:     GHOST_DARK,
  danger:    DANGER_DARK,
  surface:   SURFACE_DARK,
}

const HOVER_DARK = {
  primary:   PRIMARY_DARK_HOVER,
  secondary: SECONDARY_DARK_HOVER,
  ghost:     GHOST_DARK_HOVER,
  danger:    DANGER_DARK_HOVER,
  surface:   SURFACE_DARK_HOVER,
}

// ─── IconButton — icon-only variant of the same DNA ────────────────────
interface IconButtonProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  style?: any
  accessibilityLabel?: string
}

const ICON_DIM: Record<ButtonSize, number> = { sm: 32, md: 38, lg: 44 }

export function IconButton({
  children, onPress, variant = 'secondary', size = 'md', disabled, style, accessibilityLabel,
}: IconButtonProps) {
  const scale = useSharedValue(1)
  const [hovered, setHovered] = useState(false)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isWeb = Platform.OS === 'web'
  const { isDark } = useTheme()
  const VARIANTS = isDark ? VARIANT_DARK : VARIANT
  const HOVERS   = isDark ? HOVER_DARK   : HOVER
  const variantBase = VARIANTS[variant]
  const variantHover = HOVERS[variant]
  const dim = ICON_DIM[size]
  const isInteractive = !disabled

  return (
    <Pressable
      onPressIn={()  => { if (isInteractive) scale.value = withSpring(0.94, { damping: 18, stiffness: 420 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 420 }) }}
      onHoverIn={()  => { if (isInteractive && isWeb) { setHovered(true);  scale.value = withSpring(1.04, { damping: 22, stiffness: 360 }) } }}
      onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }) } }}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          base.btn,
          { width: dim, height: dim, paddingHorizontal: 0, paddingVertical: 0 },
          variantBase.container,
          hovered && isWeb && variantHover.container,
          disabled && base.disabled,
          animStyle,
          style,
        ]}
      >
        {/* Top highlight on primary/danger (light theme); dark primary uses gradient stroke */}
        {((variant === 'primary' && !isDark) || variant === 'danger') && (
          <View style={base.topHighlight} pointerEvents="none" />
        )}
        {children}
      </Animated.View>
    </Pressable>
  )
}
