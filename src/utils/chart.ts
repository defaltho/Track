import { monthlyEquivalent } from './calculations'

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
    const monthIdx = d.getMonth()
    const daysInMonth = new Date(d.getFullYear(), monthIdx + 1, 0).getDate()
    let total = 0

    for (const sub of subscriptions) {
      if (sub.active === false) continue
      const cycle = (sub.billingCycle ?? 'monthly') as string
      const price = parseFloat(sub.price) || 0

      if (cycle === 'weekly') {
        total += price * Math.floor(daysInMonth / 7)
      } else if (cycle === 'monthly') {
        total += price
      } else if (cycle === 'yearly') {
        const chargeMonth = sub.nextChargeDate ? new Date(sub.nextChargeDate).getMonth() : -1
        total += chargeMonth === monthIdx ? price : 0
      } else {
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
