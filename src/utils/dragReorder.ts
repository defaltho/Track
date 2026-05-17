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
