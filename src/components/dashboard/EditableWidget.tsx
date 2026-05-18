import React, { useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

interface Props<Id extends string> {
  id:           Id
  editMode:     boolean
  isDragging:   boolean
  isDropTarget?: boolean
  onRemove:     () => void
  /** Long-press to enter edit mode (only fires when editMode === false). */
  onEnterEdit:  () => void
  onDragStart:  (id: Id) => void
  onDragMove:   (id: Id, absoluteY: number) => void
  onDragEnd:    () => void
  onMeasure:    (id: Id, top: number, height: number) => void
  children:     React.ReactNode
}

const JIGGLE_DEG     = 0.7
const JIGGLE_PERIOD  = 200   // ms — half-swing duration
const LONG_PRESS_MS  = 450
const STOP_DURATION  = 140
const SCALE_DURATION = 140

export function EditableWidget<Id extends string> ({
  id, editMode, isDragging, isDropTarget, onRemove, onEnterEdit, onDragStart, onDragMove, onDragEnd, onMeasure, children,
}: Props<Id>) {
  const rot   = useSharedValue(0)
  const scale = useSharedValue(1)
  const tx    = useSharedValue(0)
  const ty    = useSharedValue(0)
  const viewRef = useRef<Animated.View>(null)

  // Jiggle in unison (iOS Home Screen actually does this too — no phase offset).
  // The loop is symmetric: +deg ↔ -deg with smooth sin easing. We seed with
  // +deg so the first swing is a clean half-cycle to -deg, never starting from 0.
  useEffect(() => {
    if (editMode && !isDragging) {
      rot.value = JIGGLE_DEG
      rot.value = withRepeat(
        withSequence(
          withTiming(-JIGGLE_DEG, { duration: JIGGLE_PERIOD, easing: Easing.inOut(Easing.sin) }),
          withTiming( JIGGLE_DEG, { duration: JIGGLE_PERIOD, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      )
    } else {
      cancelAnimation(rot)
      rot.value = withTiming(0, { duration: STOP_DURATION })
    }
  }, [editMode, isDragging, rot])

  useEffect(() => {
    scale.value = withTiming(isDragging ? 1.05 : 1, { duration: SCALE_DURATION })
    if (!isDragging) {
      tx.value = withTiming(0, { duration: 200 })
      ty.value = withTiming(0, { duration: 200 })
    }
  }, [isDragging, scale, tx, ty])

  // ── Gestures ────────────────────────────────────────────────────────
  // Strategy: TWO independent gestures, mutually exclusive via `enabled` toggles:
  //   1. enterEditPress  — long-press in NON-edit mode → enters edit mode.
  //   2. dragPan         — pan in edit mode → drags & reorders immediately.
  // No composite/chained gestures (those are flaky on RN-web).

  const enterEditPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .enabled(!editMode)
    .onStart(() => { runOnJS(onEnterEdit)() })

  // Pan only activates after a 180ms hold — short enough to feel snappy when
  // intentionally grabbing, long enough that a quick vertical swipe is left
  // alone and passes through to the underlying ScrollView.
  const dragPan = Gesture.Pan()
    .enabled(editMode)
    .activateAfterLongPress(60)
    .onStart(() => { runOnJS(onDragStart)(id) })
    .onUpdate((e) => {
      tx.value = e.translationX
      ty.value = e.translationY
      runOnJS(onDragMove)(id, e.absoluteY)
    })
    .onEnd(() => { runOnJS(onDragEnd)() })
    .onFinalize(() => { runOnJS(onDragEnd)() })

  // Race so only one fires at a time. enterEditPress is enabled outside edit
  // mode; dragPan is enabled inside it. Cannot both be active.
  const composed = Gesture.Race(enterEditPress, dragPan)

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }))

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
        {isDropTarget && !isDragging && (
          <View style={ew.dropTarget} pointerEvents="none" />
        )}
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
  dropTarget: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  removeBtn: {
    position: 'absolute', top: -8, left: -8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.20)' } as any,
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 3 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  removeBar: { width: 12, height: 2, backgroundColor: '#000', borderRadius: 1 },
})
