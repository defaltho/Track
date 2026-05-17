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

test('drops dragged widget into the slot of the nearest non-dragged widget', () => {
  const order = ['a', 'b', 'c', 'd']
  const layouts = new Map([
    ['a', { top:   0, height: 100 }],
    ['b', { top: 110, height: 100 }],
    ['c', { top: 220, height: 100 }],
    ['d', { top: 330, height: 100 }],
  ])
  assert.equal(computeDropIndex(layouts, 270, 'a', order), 2)
})

test('cursor above the first non-dragged widget snaps to top', () => {
  const order = ['a', 'b', 'c']
  const layouts = new Map([
    ['a', { top:   0, height: 100 }],
    ['b', { top: 110, height: 100 }],
    ['c', { top: 220, height: 100 }],
  ])
  assert.equal(computeDropIndex(layouts, 10, 'c', order), 0)
})

test('cursor past the last non-dragged widget snaps to end', () => {
  const order = ['a', 'b', 'c']
  const layouts = new Map([
    ['a', { top:   0, height: 100 }],
    ['b', { top: 110, height: 100 }],
    ['c', { top: 220, height: 100 }],
  ])
  assert.equal(computeDropIndex(layouts, 9999, 'a', order), 2)
})

test('returns original index when no other layouts are known', () => {
  const order = ['a', 'b']
  const layouts = new Map([['a', { top: 0, height: 100 }]])
  assert.equal(computeDropIndex(layouts, 200, 'a', order), 0)
})
