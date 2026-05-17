# Dashboard widget edit-mode revamp — iOS-style drag & drop

**Date**: 2026-05-17
**Owner**: defaltho
**Status**: Spec — awaiting implementation plan

## Goal

Replace the current edit-mode UX in `src/pages/Dashboard.tsx` (per-widget up/down arrow `ReorderBar`) with an iOS Home Screen / Control Center style interaction:

- Long-press a widget to enter edit mode, or click the existing ✏ Edit button in the header.
- All widgets jiggle (wobble animation) while edit mode is active.
- Drag a widget with the finger to reorder; the rest of the grid live-reflows to make space.
- Tap the `−` button on the top-left corner of a widget to send it to a hidden tray.
- Tap an item in the hidden tray (rendered at the bottom of the page) to re-add the widget to the end of the order.
- Tap the "Done" button (which replaces the ✏ Edit icon in the header) or tap outside any widget to exit edit mode.

## Non-goals (deferred)

- Drag-from-tray-to-specific-position re-insertion. Tap on tray = re-add to end.
- Persistence of widget order across reloads (trivial follow-up — serialize `order` array to `AsyncStorage`).
- Add-widget gallery / widget configuration screen. All widgets are predefined in `ALL_KEYS`.

## Architecture

### Dependencies

- Install `react-native-gesture-handler` via `npx expo install react-native-gesture-handler`.
- Reuse the existing `react-native-reanimated` for jiggle, drag transforms, and `LinearTransition` for layout shifts (already in `Dashboard.tsx`).

### State (in `Dashboard.tsx`)

- `editMode: boolean` — already exists.
- `draggingId: WKey | null` — new; identifies the currently-dragged widget so the wrapper can elevate it.
- `order: WKey[]` — already exists; remains a flat array.
- Hidden widgets are derived, not stored: `ALL_KEYS.filter(k => !order.includes(k))`.

### New components

| File | Responsibility |
|---|---|
| `src/components/dashboard/EditableWidget.tsx` | Wraps each rendered widget in edit mode. Owns the jiggle animation, the `GestureDetector` (long-press + pan), the top-left `−` remove button, and the visual lift/elevation while being dragged. |
| `src/components/dashboard/HiddenWidgetTray.tsx` | Horizontal scrollable bar pinned to the bottom of the Dashboard scroll content. Only visible in edit mode. Shows a small thumbnail/label for each hidden widget. Tap to re-add. |

### Modified files

- `src/pages/Dashboard.tsx`:
  - Header: ✏ Edit `IconButton` becomes a "Done" text button when `editMode === true`.
  - Removes the old `ReorderBar` (up/down arrows).
  - Wraps every rendered widget with `<EditableWidget>` instead of bare `Animated.View + MotiView`.
  - Renders `<HiddenWidgetTray>` after the widget grid when `editMode === true`.
  - Tap-outside detection: a `TapGestureHandler` (from `react-native-gesture-handler`) attached to the ScrollView's content background, configured to NOT fire when the tap lands on a widget, the `−` remove button, the tray, or the Done button (their own gesture handlers consume the event first).

## Interactions

| Trigger | Result |
|---|---|
| Long-press on any widget (~500 ms) | Enter `editMode`; immediately begin dragging that widget. |
| Click ✏ Edit in header | Enter `editMode` without an active drag. |
| Drag in edit mode | Dragged widget follows the pointer with `translateX/Y`; live layout reflow for the rest via `LinearTransition`. |
| Drop | Cursor position resolved against measured widget centers → target index in `order[]` computed → `setOrder` triggers re-render → `renderAll()` auto-pairs squares. |
| Tap on background outside widgets (in edit mode) | Exit `editMode`. |
| Click "Done" in header | Exit `editMode`. |
| Tap `−` on a widget | Remove that key from `order`; tray animates the item in. |
| Tap on a tray item | Append that key to the end of `order`; widget animates into the grid. |

## Drop-target resolution

Even with the paired-square layout preserved, the underlying source of truth is the flat `order: WKey[]`. The render layer (`renderAll`) auto-pairs consecutive squares into a `squareRow`.

During a drag:

1. Each rendered widget reports its absolute layout (top, height) via `onLayout`. Positions are stored in a `Map<WKey, { top: number; bottom: number; left: number; right: number }>` kept in a Reanimated `useSharedValue`.
2. The active drag tracks pointer absolute X/Y.
3. On each pointer move, find the widget whose vertical center is closest to the cursor — call it `target`. If the cursor is above `target`'s vertical center, insert the dragged widget before `target` in `order`. Otherwise, insert after.
4. `setOrder` updates and `LinearTransition.springify().damping(20).stiffness(220)` (already configured) handles the smooth shift.

This sidesteps the need for special handling of "drop into a half-row vs full-row" — squares re-pair automatically when the flat order changes.

## Animations

- **Jiggle**: every widget rotates between −0.8° and +0.8° with a 240 ms period. Each widget starts at a random phase so the grid feels organic, not lockstep. Stop when `editMode === false` or when the widget is being dragged.
- **Press feedback**: scale → 0.98 briefly when the long-press is detected, before the drag starts.
- **Drag lift**: scale → 1.05, shadow elevated (`shadowOpacity 0.18, shadowRadius 12`), `zIndex 999` on the dragged widget.
- **Tray slide-in/out**: 80 px slide-up + fade, 220 ms spring.

## Failure modes & edge cases

- **Long-press on a square paired widget while another square is hovered for hover-state** (web): cancel hover when long-press begins so the press-down scale animation is the only visible feedback.
- **All widgets removed**: `order` empty. Render an empty-state hint inside the grid area ("Tap a hidden widget below to add it back"). The tray must remain visible because that's the only way to recover.
- **Drag a widget below the last position**: pointer past the last widget's bottom → insert at the end of `order`.
- **Long-press but no movement, then release**: enters edit mode and stays there (no drag committed). User can then drag, tap −, or tap Done.

## Implementation files (summary)

| Status | Path |
|---|---|
| New | `src/components/dashboard/EditableWidget.tsx` |
| New | `src/components/dashboard/HiddenWidgetTray.tsx` |
| Modified | `src/pages/Dashboard.tsx` |
| Dep added | `react-native-gesture-handler` |
