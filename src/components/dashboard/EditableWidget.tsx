import React, { useEffect } from 'react'
import { View, Pressable, StyleSheet, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'

interface Props {
  editMode:  boolean
  isDragging:boolean
  onRemove:  () => void
  children:  React.ReactNode
  /**
   * Stable per-widget phase offset (0..1) so the jiggle doesn't render in
   * lockstep across all widgets. Caller passes the widget index normalized
   * by total count.
   */
  phase?: number
}

const JIGGLE_DEG    = 0.8
const JIGGLE_PERIOD = 240  // ms

export function EditableWidget ({ editMode, isDragging, onRemove, children, phase = 0 }: Props) {
  const rot   = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (editMode && !isDragging) {
      // Start jiggle: alternate ±JIGGLE_DEG forever, offset by `phase`
      const phaseShift = phase * JIGGLE_PERIOD
      rot.value = withSequence(
        withTiming( JIGGLE_DEG, { duration: JIGGLE_PERIOD / 2 + phaseShift, easing: Easing.inOut(Easing.quad) }),
        withRepeat(
          withSequence(
            withTiming(-JIGGLE_DEG, { duration: JIGGLE_PERIOD, easing: Easing.inOut(Easing.quad) }),
            withTiming( JIGGLE_DEG, { duration: JIGGLE_PERIOD, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        ),
      )
    } else {
      cancelAnimation(rot)
      rot.value = withTiming(0, { duration: 120 })
    }
  }, [editMode, isDragging, phase, rot])

  useEffect(() => {
    scale.value = withTiming(isDragging ? 1.05 : 1, { duration: 140 })
  }, [isDragging, scale])

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }))

  return (
    <Animated.View style={[ew.container, isDragging && ew.dragging, animStyle]}>
      {children}
      {editMode && (
        <Pressable onPress={onRemove} hitSlop={8} style={ew.removeBtn} accessibilityLabel="Remove widget">
          <View style={ew.removeBar} />
        </Pressable>
      )}
    </Animated.View>
  )
}

const ew = StyleSheet.create({
  container: { position: 'relative' },
  dragging: {
    zIndex: 999,
    ...Platform.select({
      web: { boxShadow: '0 12px 28px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)' } as any,
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
      android: { elevation: 16 },
      default: {},
    }),
  },
  // Apple-style remove button: white circle, dark minus glyph, top-left.
  removeBtn: {
    position: 'absolute', top: -8, left: -8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.20)' } as any,
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },
  removeBar: { width: 12, height: 2, backgroundColor: '#000', borderRadius: 1 },
})
