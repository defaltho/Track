import React, { useEffect, useRef } from 'react'
import { View, Pressable, StyleSheet, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
  type SharedValue,
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
  onDragMove:      (id: Id, absoluteY: number, absoluteX: number) => void
  onDragEnd:       () => void
  onRegisterRef:   (id: Id, node: View | null) => void
  /** Scroll offset shared value from the parent ScrollView — used to keep
   *  the dragged widget visually locked to the cursor when auto-scroll fires. */
  scrollY:      SharedValue<number>
  children:     React.ReactNode
}

const JIGGLE_DEG     = 0.7
const JIGGLE_PERIOD  = 200   // ms — half-swing duration
const LONG_PRESS_MS  = 450
const STOP_DURATION  = 140
const SCALE_DURATION = 140

export function EditableWidget<Id extends string> ({
  id, editMode, isDragging, isDropTarget, onRemove, onEnterEdit,
  onDragStart, onDragMove, onDragEnd, onRegisterRef, scrollY, children,
}: Props<Id>) {
  const rot   = useSharedValue(0)
  const scale = useSharedValue(1)
  const tx    = useSharedValue(0)
  const ty    = useSharedValue(0)
  // Accumulated scroll delta during a drag — keeps the widget visually locked
  // to the cursor even when auto-scroll moves the ScrollView underneath it.
  const scrollComp     = useSharedValue(0)
  const isDraggingShared = useSharedValue(false)

  const viewRef = useRef<View | null>(null)
  const callbackRef = React.useCallback((node: View | null) => {
    viewRef.current = node
    onRegisterRef(id, node)
  }, [id, onRegisterRef])

  // When the scroll view moves during a drag, compensate so the widget stays
  // at the cursor. We track the delta separately (scrollComp) rather than
  // mutating ty so the pan gesture's own translationY writes never conflict.
  useAnimatedReaction(
    () => scrollY.value,
    (current, previous) => {
      if (previous === null || !isDraggingShared.value) return
      scrollComp.value += current - previous
    },
  )

  // Jiggle in unison (iOS Home Screen actually does this too — no phase offset).
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
      tx.value         = withTiming(0, { duration: 200 })
      ty.value         = withTiming(0, { duration: 200 })
      scrollComp.value = withTiming(0, { duration: 200 })
    }
  }, [isDragging, scale, tx, ty, scrollComp])

  // ── Gestures ────────────────────────────────────────────────────────
  const enterEditPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .maxDistance(30)   // more forgiving on mobile — finger drifts during hold
    .enabled(!editMode)
    .onStart(() => { runOnJS(onEnterEdit)() })

  const dragPan = Gesture.Pan()
    .enabled(editMode)
    .activateAfterLongPress(200)  // 200ms lets quick scrolls pass through in edit mode
    .onStart(() => {
      scrollComp.value   = 0
      isDraggingShared.value = true
      runOnJS(onDragStart)(id)
    })
    .onUpdate((e) => {
      tx.value = e.translationX
      ty.value = e.translationY
      runOnJS(onDragMove)(id, e.absoluteY, e.absoluteX)
    })
    .onEnd(()      => { isDraggingShared.value = false; runOnJS(onDragEnd)() })
    .onFinalize(() => { isDraggingShared.value = false; runOnJS(onDragEnd)() })

  const composed = Gesture.Race(enterEditPress, dragPan)

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value + scrollComp.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }))

  return (
    <Animated.View style={[{ position: 'relative', overflow: 'visible' }, animStyle]}>
      <GestureDetector gesture={composed}>
        <View
          ref={callbackRef}
          style={[ew.container, isDragging && ew.dragging]}
        >
          {children}
          {isDropTarget && !isDragging && (
            <View style={ew.dropTarget} pointerEvents="none" />
          )}
        </View>
      </GestureDetector>
      {editMode && (
        <Pressable onPress={onRemove} style={ew.removeBtnArea} accessibilityLabel="Remove widget">
          <View style={ew.removeBtnCircle}>
            <View style={ew.removeBar} />
          </View>
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
  dropTarget: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.25)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  removeBtnArea: {
    position: 'absolute', top: -10, left: -10,
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  removeBtnCircle: {
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
