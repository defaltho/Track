import { monthlyEquivalent } from './calculations'

// Smooth Catmull-Rom-ish curve through a list of points. Shared
// between the full Analytics chart and the compact dashboard widget
// so they always read as the same visual family.
export function curvePath (pts: { x: number; y: number }[], t = 0.3): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export function buildSpendingTimeline(subscriptions: any[], rangeDays = 365) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - rangeDays)

  const buckets = Math.min(rangeDays, 60)
  const step = rangeDays / buckets
  const points: { t: Date; value: number }[] = []

  for (let i = 0; i <= buckets; i++) {
    const t = new Date(start)
    t.setDate(t.getDate() + Math.round(step * i))
    const active = subscriptions.filter(s => {
      if (s.active === false) return false
      const created = s.createdAt ? new Date(s.createdAt) : start
      return created <= t
    })
    const monthly = active.reduce(
      (sum, s) => sum + monthlyEquivalent(s.price, s.billingCycle),
      0
    )
    points.push({ t, value: monthly })
  }
  return points
}

export function pointsToPath(points: { t: Date; value: number }[], width = 300, height = 100) {
  // BUG M8 fix: treat length === 1 the same as length === 0
  if (points.length <= 1) {
    return { line: '', area: '', last: { x: 0, y: height / 2 } }
  }
  const max = Math.max(...points.map(p => p.value), 1)
  const stepX = width / (points.length - 1 || 1)
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - (p.value / max) * (height - 8) - 4,
  }))

  const line = coords
    .map((c, i) => (i === 0 ? `M${c.x} ${c.y}` : `L${c.x.toFixed(1)} ${c.y.toFixed(1)}`))
    .join(' ')
  // BUG L2 fix: close area with the last coord's x instead of hardcoded width
  const lastX = coords[coords.length - 1].x
  const area = `${line} L${lastX} ${height} L0 ${height} Z`
  return { line, area, last: coords[coords.length - 1] }
}

export const RANGE_DAYS: Record<string, number> = {
  '1W': 7,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'Max': 365 * 3,
}

export const RANGE_CONFIG: Record<string, { back: number; ahead: number }> = {
  '1W':  { back: 1,  ahead: 1 },
  '3M':  { back: 2,  ahead: 2 },
  '6M':  { back: 4,  ahead: 2 },
  '1Y':  { back: 8,  ahead: 3 },
  'Max': { back: 11, ahead: 3 },
}

// ── buildMonthlyBars ──────────────────────────────────────────────────
// Returns a series of monthly bars for the line/area chart in Analytics.
//
// Rules (keep in sync with `scripts/test-chart.mjs`):
//   1. Active subs contribute their **amortized monthly equivalent** to
//      every bar. A €600/yr sub adds €50 every month, not €600 on the
//      renewal month — a single spike makes the rest of the chart
//      invisible (BUG: prior version did this).
//   2. Inactive subs are treated as **historical one-off charges**:
//      they contribute their full price to the single bar whose
//      (year, month) equals their `nextChargeDate`. Anywhere else they
//      contribute zero. This is what lets the past months show actual
//      paid charges from the historical seed pool.
//   3. Weekly billing uses `52/12` (≈ 4.33) so a 30-day month and a
//      31-day month yield the same monthly equivalent (the previous
//      `Math.floor(daysInMonth/7)` rounded down to 4 every month).
//   4. Missing / non-numeric prices are treated as zero so a malformed
//      record can't poison the whole chart.

export function buildMonthlyBars(
  subscriptions: any[],
  monthsBack = 5,
  monthsAhead = 3,
  monthOffset = 0,
): { label: string; value: number; isCurrent: boolean; isFuture: boolean }[] {
  const today = new Date()
  const result: { label: string; value: number; isCurrent: boolean; isFuture: boolean }[] = []

  for (let m = -monthsBack; m <= monthsAhead; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() + m - monthOffset, 1)
    const barYear  = d.getFullYear()
    const barMonth = d.getMonth()
    let total = 0

    for (const sub of subscriptions) {
      const cycle = (sub.billingCycle ?? 'monthly') as string
      const price = parseFloat(sub.price)
      if (!isFinite(price) || price <= 0) continue

      if (sub.active === false) {
        // Historical one-off charge — contributes only to its exact (year, month).
        if (!sub.nextChargeDate) continue
        const cd = new Date(sub.nextChargeDate)
        if (isNaN(cd.getTime())) continue
        if (cd.getFullYear() === barYear && cd.getMonth() === barMonth) {
          total += price
        }
      } else {
        // Active sub — amortize the ongoing cost across every bar.
        total += monthlyEquivalent(price, cycle)
      }
    }

    result.push({
      label: d.toLocaleString('en', { month: 'short' }),
      value: total,
      isCurrent: monthOffset === 0 && m === 0,
      isFuture: monthOffset === 0 && m > 0,
    })
  }
  return result
}
