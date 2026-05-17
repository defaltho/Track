import React, { useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

interface Props<Id extends string> {
  id:           Id
  editMode:     boolean
  isDragging:   boolean
  onRemove:     () => void
  onDragStart:  (id: Id) => void
  onDragMove:   (id: Id, absoluteY: number) => void
  onDragEnd:    () => void
  onMeasure:    (id: Id, top: number, height: number) => void
  phase?:       number
  children:     React.ReactNode
}

const JIGGLE_DEG     = 0.8
const JIGGLE_PERIOD  = 240   // ms — duration of a half-swing
const LONG_PRESS_MS  = 400
const STOP_DURATION  = 120
const SCALE_DURATION = 140

export function EditableWidget<Id extends string> ({
  id, editMode, isDragging, onRemove, onDragStart, onDragMove, onDragEnd, onMeasure, phase = 0, children,
}: Props<Id>) {
  const rot   = useSharedValue(0)
  const scale = useSharedValue(1)
  const tx    = useSharedValue(0)
  const ty    = useSharedValue(0)
  // Ref to the outer Animated.View — used for `measureInWindow` on layout.
  const viewRef = useRef<Animated.View>(null)

  useEffect(() => {
    if (editMode && !isDragging) {
      // Phase-offset via withDelay so the swing duration stays constant
      // (previous version warped the first segment, causing irregular timing).
      const phaseShift = phase * JIGGLE_PERIOD
      rot.value = withDelay(
        phaseShift,
        withRepeat(
          withSequence(
            withTiming( JIGGLE_DEG, { duration: JIGGLE_PERIOD, easing: Easing.inOut(Easing.quad) }),
            withTiming(-JIGGLE_DEG, { duration: JIGGLE_PERIOD, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        ),
      )
    } else {
      cancelAnimation(rot)
      rot.value = withTiming(0, { duration: STOP_DURATION })
    }
  }, [editMode, isDragging, phase, rot])

  useEffect(() => {
    scale.value = withTiming(isDragging ? 1.05 : 1, { duration: SCALE_DURATION })
    if (!isDragging) {
      tx.value = withTiming(0, { duration: 200 })
      ty.value = withTiming(0, { duration: 200 })
    }
  }, [isDragging, scale, tx, ty])

  // LongPress.onStart sets `draggingId`; if the user releases without dragging,
  // LongPress.onEnd clears it. If Pan activates, its onEnd also clears (idempotent).
  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .onStart(() => { runOnJS(onDragStart)(id) })
    .onEnd(() => { runOnJS(onDragEnd)() })

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onUpdate((e) => {
      tx.value = e.translationX
      ty.value = e.translationY
      runOnJS(onDragMove)(id, e.absoluteY)
    })
    .onEnd(() => { runOnJS(onDragEnd)() })

  // Run both gestures simultaneously: long-press always fires (sets edit mode +
  // dragging state); pan also activates after the long-press threshold for
  // continuous movement. Either ending clears draggingId.
  const composed = Gesture.Simultaneous(longPress, pan)

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }))

  // Measure window-relative top + height after layout settles. Defer to next
  // frame so React Native finalizes layout before measureInWindow returns
  // coords (otherwise measurements can be 0 on initial mount).
  function handleLayout () {
    requestAnimationFrame(() => {
      viewRef.current?.measureInWindow((_x: number, top: number, _w: number, height: number) => {
        if (typeof top === 'number' && typeof height === 'number') {
          onMeasure(id, top, height)
        }
      })
    })
  }

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        ref={viewRef}
        style={[ew.container, isDragging && ew.dragging, animStyle]}
        onLayout={handleLayout}
      >
        {children}
        {editMode && (
          <Pressable onPress={onRemove} hitSlop={10} style={ew.removeBtn} accessibilityLabel="Remove widget">
            <View style={ew.removeBar} />
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
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
      default: {},
    }),
  },
  removeBar: { width: 12, height: 2, backgroundColor: '#000', borderRadius: 1 },
})
