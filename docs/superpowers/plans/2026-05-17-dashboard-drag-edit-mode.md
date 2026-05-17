# Dashboard drag edit-mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current up/down-arrow `ReorderBar` edit mode in `src/pages/Dashboard.tsx` with an iOS-style drag-and-drop: jiggle animation, long-press to grab, drag to reorder with live layout reflow, `−` button to hide a widget into a tray, and a Done button replacing the ✏ Edit icon while editing.

**Architecture:** A pure `computeDropIndex` utility resolves cursor position to an insertion index in the flat `order: WKey[]`; React state changes trigger layout shifts that `LinearTransition` (already wired) animates. A new `EditableWidget` wrapper owns the per-widget jiggle, gesture handling, lift visuals, and `−` button. A new `HiddenWidgetTray` shows hidden widgets at the bottom of the page in edit mode. Paired-square layout is preserved because reordering operates on the flat array and `renderAll()` auto-pairs at render time.

**Tech Stack:** React Native, Expo SDK 52, `react-native-gesture-handler` (new), `react-native-reanimated` (already present), `moti` (already present), TypeScript. Pure logic tested via Node's built-in test runner mirroring the chart-test convention at `scripts/test-chart.mjs`.

---

## File map

| Status | Path | Responsibility |
|---|---|---|
| Modified | `package.json` | Adds `react-native-gesture-handler` dep |
| Modified | `app/_layout.tsx` | Mount `<GestureHandlerRootView>` at app root |
| New | `src/utils/dragReorder.ts` | Pure `computeDropIndex(layouts, cursorY, draggedId, order)` |
| New | `scripts/test-drag-reorder.mjs` | Node tests mirroring `dragReorder.ts` logic |
| Modified | `package.json` (scripts) | Add `test:drag` script and chain into `test` |
| New | `src/components/dashboard/EditableWidget.tsx` | Jiggle + LongPress + Pan gestures + `−` button + drag-lift visual |
| New | `src/components/dashboard/HiddenWidgetTray.tsx` | Horizontal scrollable tray of hidden-widget chips |
| Modified | `src/pages/Dashboard.tsx` | New `draggingId` state, header Done/Edit swap, wrap widgets with `EditableWidget`, render `HiddenWidgetTray`, tap-outside-to-exit, drop the old `ReorderBar` |

---

## Task 1: Install `react-native-gesture-handler` and mount the root view

**Files:**
- Modify: `package.json` (via expo install)
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Install the dep**

Run:

```bash
npx expo install react-native-gesture-handler
```

Expected: package.json gains `"react-native-gesture-handler": "~<version-compatible-with-expo-52>"`. Lockfile updated.

- [ ] **Step 2: Read `app/_layout.tsx` to find the outermost component**

Run:

```bash
cat app/_layout.tsx
```

Expected: a default-exported component (e.g. `RootLayout`) returning something like a `<Stack>` or wrapper. We will wrap that return value in `<GestureHandlerRootView style={{ flex: 1 }}>`.

- [ ] **Step 3: Wrap root with `GestureHandlerRootView`**

Edit `app/_layout.tsx`:

```tsx
// Add to imports
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// In the default export, wrap the existing returned JSX:
export default function RootLayout() {
  // ...existing code unchanged...
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* existing content here */}
    </GestureHandlerRootView>
  )
}
```

- [ ] **Step 4: Verify the app still builds**

Run:

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no new errors. Pre-existing errors in `Dashboard.tsx` (lines 673-674) are acceptable — they exist on `main` and are unrelated.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/_layout.tsx
git commit -m "feat(deps): add react-native-gesture-handler and mount root view"
```

---

## Task 2: Pure drop-target resolver utility

**Files:**
- Create: `src/utils/dragReorder.ts`
- Create: `scripts/test-drag-reorder.mjs`
- Modify: `package.json` (scripts.test chain)

- [ ] **Step 1: Write the failing test mirror**

Create `scripts/test-drag-reorder.mjs`:

```js
// Tests for `src/utils/dragReorder.ts` — run with: `node --test scripts/test-drag-reorder.mjs`
// Mirrors the TS function 1:1 (same pattern as scripts/test-chart.mjs).
// If you change `computeDropIndex` in dragReorder.ts, update this file in lockstep.

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ── Mirror of src/utils/dragReorder.ts → computeDropIndex ──────────
function computeDropIndex (layouts, cursorY, draggedId, order) {
  const candidates = order
    .filter(id => id !== draggedId && layouts.has(id))
    .map(id => {
      const { top, height } = layouts.get(id)
      return { id, center: top + height / 2 }
    })
  if (candidates.length === 0) return order.indexOf(draggedId)

  // Cursor above the first visible candidate's center → top of list
  if (cursorY < candidates[0].center) {
    const targetIdx = order.indexOf(candidates[0].id)
    return Math.max(0, targetIdx)
  }
  // Cursor past the last candidate's center → end of list
  const last = candidates[candidates.length - 1]
  if (cursorY > last.center) return order.length - 1

  // Otherwise, find the candidate whose center is closest and decide before/after
  let nearest = candidates[0]
  for (const c of candidates) {
    if (Math.abs(c.center - cursorY) < Math.abs(nearest.center - cursorY)) nearest = c
  }
  const targetIdx = order.indexOf(nearest.id)
  return cursorY < nearest.center ? targetIdx : targetIdx
  // Note: with one-step reorder per move, both branches land on targetIdx;
  // before/after distinction is consumed by the caller when splicing.
}

test('drops dragged widget into the slot of the nearest non-dragged widget', () => {
  const order = ['a', 'b', 'c', 'd']
  const layouts = new Map([
    ['a', { top:   0, height: 100 }],
    ['b', { top: 110, height: 100 }],
    ['c', { top: 220, height: 100 }],
    ['d', { top: 330, height: 100 }],
  ])
  // Dragging 'a' with cursor near 'c' center (≈ 270) → c's index
  assert.equal(computeDropIndex(layouts, 270, 'a', order), 2)
})

test('cursor above the first non-dragged widget snaps to top', () => {
  const order = ['a', 'b', 'c']
  const layouts = new Map([
    ['a', { top:   0, height: 100 }],
    ['b', { top: 110, height: 100 }],
    ['c', { top: 220, height: 100 }],
  ])
  // Dragging 'c' with cursor at y = 10 (well above 'a' center 50) → top
  assert.equal(computeDropIndex(layouts, 10, 'c', order), 0)
})

test('cursor past the last non-dragged widget snaps to end', () => {
  const order = ['a', 'b', 'c']
  const layouts = new Map([
    ['a', { top:   0, height: 100 }],
    ['b', { top: 110, height: 100 }],
    ['c', { top: 220, height: 100 }],
  ])
  // Dragging 'a' with cursor at y = 9999 → last index
  assert.equal(computeDropIndex(layouts, 9999, 'a', order), 2)
})

test('returns original index when no other layouts are known', () => {
  const order = ['a', 'b']
  const layouts = new Map([['a', { top: 0, height: 100 }]])
  // Dragging 'a' but only 'a' has a layout entry → stay put
  assert.equal(computeDropIndex(layouts, 200, 'a', order), 0)
})
```

- [ ] **Step 2: Run the test — expect it to fail**

Run:

```bash
node --test scripts/test-drag-reorder.mjs
```

Expected: tests run and PASS for the mirror logic (the test file is self-contained and tests its own mirror). This passing test serves as the spec for the TS source. Now we write the TS source to match.

- [ ] **Step 3: Write `src/utils/dragReorder.ts`**

Create `src/utils/dragReorder.ts`:

```ts
// Pure resolver: given the measured layout of each widget, the current
// pointer Y in the same coordinate space, the id of the widget being
// dragged, and the current order array, return the index in `order`
// where the dragged widget should be inserted.
//
// Coordinate space is the caller's responsibility — both `layouts` values
// and `cursorY` must use the same origin (typically: page-relative Y from
// `measureInWindow` or the gesture event's `absoluteY`).
//
// The caller splices the dragged id out and reinserts it at the returned
// index. This module does no mutation.

export interface WidgetLayout {
  top:    number
  height: number
}

export function computeDropIndex<Id> (
  layouts:   Map<Id, WidgetLayout>,
  cursorY:   number,
  draggedId: Id,
  order:     Id[],
): number {
  const candidates = order
    .filter(id => id !== draggedId && layouts.has(id))
    .map(id => {
      const layout = layouts.get(id)!
      return { id, center: layout.top + layout.height / 2 }
    })

  if (candidates.length === 0) return order.indexOf(draggedId)

  if (cursorY < candidates[0].center) {
    return Math.max(0, order.indexOf(candidates[0].id))
  }
  const last = candidates[candidates.length - 1]
  if (cursorY > last.center) return order.length - 1

  let nearest = candidates[0]
  for (const c of candidates) {
    if (Math.abs(c.center - cursorY) < Math.abs(nearest.center - cursorY)) nearest = c
  }
  return order.indexOf(nearest.id)
}
```

- [ ] **Step 4: Wire test into npm `test` script**

Edit `package.json` `scripts.test`:

```jsonc
{
  "scripts": {
    // ...
    "test": "node --test scripts/test-chart.mjs scripts/test-drag-reorder.mjs"
  }
}
```

- [ ] **Step 5: Run all tests — expect PASS**

Run:

```bash
npm test
```

Expected: both `scripts/test-chart.mjs` and `scripts/test-drag-reorder.mjs` pass.

- [ ] **Step 6: Verify TypeScript still compiles**

Run:

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: no new errors related to `dragReorder.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/utils/dragReorder.ts scripts/test-drag-reorder.mjs package.json
git commit -m "feat(util): pure computeDropIndex for drag-to-reorder"
```

---

## Task 3: `EditableWidget` wrapper — jiggle + `−` button (no drag yet)

This task only adds the wrapper shell and wires it into `Dashboard.tsx`. The Pan gesture is layered on in Task 6.

**Files:**
- Create: `src/components/dashboard/EditableWidget.tsx`
- Modify: `src/pages/Dashboard.tsx` (replace `wrapWidget` body to use `EditableWidget`)

- [ ] **Step 1: Create `EditableWidget` with jiggle and `−` button**

Create `src/components/dashboard/EditableWidget.tsx`:

```tsx
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
   * lockstep across all widgets. Caller passes the widget index or a
   * random-on-mount value.
   */
  phase?: number
}

const JIGGLE_DEG     = 0.8
const JIGGLE_PERIOD  = 240  // ms

export function EditableWidget ({ editMode, isDragging, onRemove, children, phase = 0 }: Props) {
  const rot   = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (editMode && !isDragging) {
      // Start jiggle: alternate ±JIGGLE_DEG forever
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
```

- [ ] **Step 2: Replace `wrapWidget` in `Dashboard.tsx` to use `EditableWidget`**

In `src/pages/Dashboard.tsx`:

Add import near the other component imports:

```tsx
import { EditableWidget } from '../components/dashboard/EditableWidget'
```

Replace the existing `wrapWidget` function body (the function around line 618 — keep its signature):

```tsx
function wrapWidget(id: WKey, content: React.ReactNode, _idx: number, fill = false): React.ReactNode {
  const fillStyle = fill ? { flex: 1 } : undefined
  return (
    <Animated.View
      key={id}
      layout={LinearTransition.springify().damping(22).stiffness(220)}
      style={fillStyle}
    >
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: WIDGET_DELAY[id] }}
        style={fillStyle}
      >
        <EditableWidget
          editMode={editMode}
          isDragging={false}            // Task 6 sets this when drag is live
          phase={_idx / Math.max(order.length, 1)}
          onRemove={() => setOrder(prev => prev.filter(k => k !== id))}
        >
          {content}
        </EditableWidget>
      </MotiView>
    </Animated.View>
  )
}
```

Note: the `ReorderBar` call at the start of the previous wrapper is removed. (It still exists as a component for now — we will delete it in Task 7. Search for `<ReorderBar` inside `renderSingle` cases and remove those JSX usages too — there are no inline calls inside `wrapWidget` after this change, but if any `renderSingle` case renders `<ReorderBar />` directly, those should also go.)

- [ ] **Step 3: Run the dev server and smoke-check in a browser**

Run (background):

```bash
npm run web
```

Expected: the dashboard renders. Click ✏ Edit. All widgets gently jiggle. A small white `−` circle appears on the top-left corner of every widget. Clicking the `−` removes the widget from the grid (it disappears — re-add happens in Task 5). Done button does not yet exist (Task 4).

- [ ] **Step 4: Verify TypeScript compiles**

Run:

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "EditableWidget|Dashboard\.tsx" | head -10
```

Expected: no new errors in `EditableWidget.tsx` or in the `Dashboard.tsx` lines you touched.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/EditableWidget.tsx src/pages/Dashboard.tsx
git commit -m "feat(dashboard): EditableWidget wrapper with jiggle and remove button"
```

---

## Task 4: Header Done button + tap-outside-to-exit

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add `Done` button beside the existing Edit icon in the header**

The current header (around line 685-714) renders the ✏ Edit icon as `<IconButton variant="primary" size="md" onPress={() => setEditMode(true)} ...>`. Replace the swap logic to render `Done` when `editMode` is true:

```tsx
{editMode ? (
  <IconButton variant="primary" size="md" onPress={() => setEditMode(false)} accessibilityLabel="Done editing layout">
    <Text style={{ color: primaryFg, fontSize: 13, fontFamily: theme.fontBold, paddingHorizontal: 6 }}>Done</Text>
  </IconButton>
) : (
  <IconButton variant="primary" size="md" onPress={() => setEditMode(true)} accessibilityLabel="Edit layout">
    <View style={{ gap:3 }}>
      <View style={{ flexDirection:'row', gap:3 }}>
        {[8,8].map((w,i) => <View key={i} style={{ width:w, height:8, borderRadius:2, backgroundColor:primaryFg }} />)}
      </View>
      <View style={{ flexDirection:'row', gap:3 }}>
        {[8,8].map((w,i) => <View key={i} style={{ width:w, height:8, borderRadius:2, backgroundColor:primaryFg }} />)}
      </View>
    </View>
  </IconButton>
)}
```

Place this swap exactly where the current `<IconButton variant="primary" size="md" onPress={() => setEditMode(true)} accessibilityLabel="Edit layout">` block lives.

- [ ] **Step 2: Add tap-outside-to-exit via a `TapGestureHandler`**

Add import at the top of `Dashboard.tsx`:

```tsx
import { TapGestureHandler } from 'react-native-gesture-handler'
```

Wrap the existing inner `<View style={isDesktop ? s.widgetColumn : undefined}>` (around line 755) like so:

```tsx
<TapGestureHandler
  enabled={editMode}
  onActivated={() => setEditMode(false)}
>
  <Animated.View>
    <View style={isDesktop ? s.widgetColumn : undefined}>
      {header}
      {renderAll()}
    </View>
  </Animated.View>
</TapGestureHandler>
```

The wrapping `Animated.View` is required because `TapGestureHandler` needs a single animated child. Widgets, the `−` button, and the Done button each have their own `Pressable` or `IconButton` press handlers that consume the tap before bubbling up, so this only fires on background taps.

- [ ] **Step 3: Smoke-check in browser**

Refresh the running dev server (or `npm run web` again).

Expected:
- Click ✏ → enters edit mode (widgets jiggle, `−` buttons visible). Edit icon swaps for `Done`.
- Click `Done` → exits edit mode. Jiggle stops.
- In edit mode, click the empty page background (e.g. the gap area between widgets, OR the header text "Track") → exits edit mode.
- In edit mode, click a widget body itself → no exit (widget's own press is consumed).
- In edit mode, click a `−` button → widget disappears AND edit mode stays.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(dashboard): Done button replaces Edit icon; tap-outside exits edit mode"
```

---

## Task 5: `HiddenWidgetTray` + remove/re-add flow

**Files:**
- Create: `src/components/dashboard/HiddenWidgetTray.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create `HiddenWidgetTray`**

Create `src/components/dashboard/HiddenWidgetTray.tsx`:

```tsx
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
```

- [ ] **Step 2: Add ALL_KEYS constant + tray rendering in `Dashboard.tsx`**

In `src/pages/Dashboard.tsx`, near the existing `WIDGET_SIZE` map (around line 266), add:

```tsx
const ALL_KEYS: WKey[] = Object.keys(WIDGET_SIZE) as WKey[]

const WIDGET_META: Record<WKey, { label: string; emoji: string }> = {
  active:        { label: 'active',         emoji: '📊' },
  spend:         { label: 'spend',          emoji: '💸' },
  coffees:       { label: 'coffees',        emoji: '☕' },
  events:        { label: 'events',         emoji: '📅' },
  topExpense:    { label: 'top expense',    emoji: '🥇' },
  ytd:           { label: 'YTD',            emoji: '🗓️' },
  monthGoal:     { label: 'month goal',     emoji: '🎯' },
  clock:         { label: 'clock',          emoji: '🕐' },
  categoryRings: { label: 'top categories', emoji: '⭕' },
  heatmap:       { label: 'heatmap',        emoji: '🟩' },
  due:           { label: 'this week',      emoji: '📌' },
  category:      { label: 'by category',    emoji: '📈' },
  upcoming:      { label: 'upcoming',       emoji: '⏭️' },
  spendTrend:    { label: 'spend trend',    emoji: '📉' },
  radar:         { label: 'radar',          emoji: '🕸️' },
}
```

Add import:

```tsx
import { HiddenWidgetTray } from '../components/dashboard/HiddenWidgetTray'
```

Render the tray after `{renderAll()}` inside the widgetColumn (around line 757):

```tsx
<View style={isDesktop ? s.widgetColumn : undefined}>
  {header}
  {renderAll()}
  <HiddenWidgetTray
    visible={editMode}
    items={ALL_KEYS
      .filter(k => !order.includes(k))
      .map(k => ({ id: k, label: WIDGET_META[k].label, emoji: WIDGET_META[k].emoji }))}
    onAdd={(id) => setOrder(prev => [...prev, id as WKey])}
  />
</View>
```

- [ ] **Step 3: Smoke-check in browser**

Refresh. In edit mode:

Expected:
- A "hidden widgets" tray appears below the grid (or shows "none — tap − on a widget to hide it" when empty).
- Tap a `−` button → widget disappears from grid AND a chip with its label/emoji appears in the tray.
- Tap a chip → widget reappears at the bottom of the grid; chip leaves the tray.
- Exiting edit mode hides the tray entirely.

- [ ] **Step 4: TypeScript check**

Run:

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "HiddenWidgetTray|Dashboard\.tsx" | head -10
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/HiddenWidgetTray.tsx src/pages/Dashboard.tsx
git commit -m "feat(dashboard): hidden-widget tray for remove/re-add flow"
```

---

## Task 6: Drag-to-reorder gesture

**Files:**
- Modify: `src/components/dashboard/EditableWidget.tsx` (add LongPress + Pan gestures)
- Modify: `src/pages/Dashboard.tsx` (track `draggingId`, layout map, pass callbacks)

- [ ] **Step 1: Extend `Dashboard.tsx` with drag state and the layout map**

Near other `useState` calls in `Dashboard` (around line 388):

```tsx
const [draggingId, setDraggingId] = useState<WKey | null>(null)
// Per-widget measured rectangle in page-relative coordinates (mutable ref-like;
// values change without re-rendering)
const layoutsRef = React.useRef<Map<WKey, { top: number; height: number }>>(new Map())
```

Add import:

```tsx
import { computeDropIndex } from '../utils/dragReorder'
```

Add a single shared `handleDragMove(id, absoluteY)` callback inside `Dashboard`:

```tsx
const handleDragMove = React.useCallback((id: WKey, absoluteY: number) => {
  setOrder(prev => {
    const target = computeDropIndex(layoutsRef.current, absoluteY, id, prev)
    const fromIdx = prev.indexOf(id)
    if (fromIdx === target) return prev
    const out = [...prev]
    out.splice(fromIdx, 1)
    out.splice(target, 0, id)
    return out
  })
}, [])

const handleDragStart = React.useCallback((id: WKey) => {
  setEditMode(true)
  setDraggingId(id)
}, [])

const handleDragEnd = React.useCallback(() => {
  setDraggingId(null)
}, [])

const handleMeasure = React.useCallback((id: WKey, top: number, height: number) => {
  layoutsRef.current.set(id, { top, height })
}, [])
```

- [ ] **Step 2: Pass new props through `wrapWidget` → `EditableWidget`**

Update the `wrapWidget` body (replacing the version from Task 3) so it passes `id`, drag state, and the callbacks:

```tsx
function wrapWidget(id: WKey, content: React.ReactNode, _idx: number, fill = false): React.ReactNode {
  const fillStyle = fill ? { flex: 1 } : undefined
  return (
    <Animated.View
      key={id}
      layout={LinearTransition.springify().damping(22).stiffness(220)}
      style={fillStyle}
    >
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: WIDGET_DELAY[id] }}
        style={fillStyle}
      >
        <EditableWidget
          id={id}
          editMode={editMode}
          isDragging={draggingId === id}
          phase={_idx / Math.max(order.length, 1)}
          onRemove={() => setOrder(prev => prev.filter(k => k !== id))}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onMeasure={handleMeasure}
        >
          {content}
        </EditableWidget>
      </MotiView>
    </Animated.View>
  )
}
```

- [ ] **Step 3: Extend `EditableWidget` props and add gestures**

Rewrite `src/components/dashboard/EditableWidget.tsx`:

```tsx
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
  onRemove:     () => void
  onDragStart:  (id: Id) => void
  onDragMove:   (id: Id, absoluteY: number) => void
  onDragEnd:    () => void
  onMeasure:    (id: Id, top: number, height: number) => void
  phase?:       number
  children:     React.ReactNode
}

const JIGGLE_DEG     = 0.8
const JIGGLE_PERIOD  = 240
const LONG_PRESS_MS  = 400

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
    if (!isDragging) {
      tx.value = withTiming(0, { duration: 200 })
      ty.value = withTiming(0, { duration: 200 })
    }
  }, [isDragging, scale, tx, ty])

  // LongPress.onStart sets `draggingId`; if the user releases without dragging,
  // LongPress.onEnd clears it. If Pan activates, its onEnd also clears (idempotent).
  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .onStart(() => {
      runOnJS(onDragStart)(id)
    })
    .onEnd(() => {
      runOnJS(onDragEnd)()
    })

  const pan = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onUpdate((e) => {
      tx.value = e.translationX
      ty.value = e.translationY
      runOnJS(onDragMove)(id, e.absoluteY)
    })
    .onEnd(() => {
      runOnJS(onDragEnd)()
    })

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

  // Measure window-relative top + height after layout settles. We defer to the
  // next frame so React Native has finalized the layout before measureInWindow
  // returns coords (otherwise measurements can be 0 on initial mount).
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
          <Pressable onPress={onRemove} hitSlop={8} style={ew.removeBtn} accessibilityLabel="Remove widget">
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
    }),
  },
  removeBar: { width: 12, height: 2, backgroundColor: '#000', borderRadius: 1 },
})
```

- [ ] **Step 4: Smoke-check the drag**

Refresh the dev server. Enter edit mode via ✏.

Expected:
- Long-press any widget for ~400 ms → that widget visibly lifts (scale 1.05, drop-shadow) and its jiggle pauses.
- Drag the widget vertically. As your cursor passes the center of another widget, the rest of the grid reflows; `LinearTransition` animates the slide.
- Release → dragged widget settles into the new slot. The order is persisted in `order`.
- Squares re-pair correctly when their relative order in the flat list changes.
- Drag works for both squares and rectangles.

- [ ] **Step 5: TypeScript + tests**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "EditableWidget|Dashboard\.tsx" | head -10
npm test
```

Expected: no new TS errors in the touched files; all tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/EditableWidget.tsx src/pages/Dashboard.tsx
git commit -m "feat(dashboard): long-press + pan drag-to-reorder with live layout reflow"
```

---

## Task 7: Cleanup — remove old `ReorderBar`

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Delete the `ReorderBar` component and `moveWidget`**

In `src/pages/Dashboard.tsx`, search for and remove:

1. The `ReorderBar` function (around line 415-430).
2. The `moveWidget` function (around line 403-413). Nothing should reference it after Task 6.
3. Any remaining `<ReorderBar id={id} />` call sites if they survived Task 3 (search the file).

Run a final search:

```bash
grep -n "ReorderBar\|moveWidget" src/pages/Dashboard.tsx
```

Expected: zero matches.

- [ ] **Step 2: Also remove the now-unused `gh` style block**

The `gh = StyleSheet.create(...)` block (around line 765-768) was used only by `ReorderBar`. Remove it.

```bash
grep -n "\\bgh\\b" src/pages/Dashboard.tsx
```

Expected: zero matches.

- [ ] **Step 3: Full TypeScript + test sweep**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "Dashboard\.tsx" | head -10
npm test
```

Expected: no new errors introduced by this task; tests pass.

- [ ] **Step 4: Final manual smoke test**

Refresh the dev server. Run through the full happy path:

- Long-press a widget → enter edit mode + drag begins.
- Drop into a new slot → reorders.
- Tap `−` on a widget → moves to tray.
- Tap chip in tray → re-adds at end.
- Exit edit mode by tapping the page background → jiggle stops, tray hides.
- Exit edit mode by clicking `Done` → same.
- Click ✏ on the header (not in edit mode) → enters edit mode without a drag.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "chore(dashboard): remove old ReorderBar arrows and moveWidget"
```

---

## Out of scope (deferred, per spec)

- Drag-from-tray-to-specific-position re-insertion. Tap on tray re-adds to end.
- Persistence of `order` across reloads via AsyncStorage.
- Add-widget gallery (every widget is in `ALL_KEYS` — gallery only matters once user-configurable widgets exist).
