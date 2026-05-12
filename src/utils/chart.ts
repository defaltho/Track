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
  if (points.length === 0) {
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
  const area = `${line} L${width} ${height} L0 ${height} Z`
  return { line, area, last: coords[coords.length - 1] }
}

export const RANGE_DAYS: Record<string, number> = {
  '1W': 7,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'Max': 365 * 3,
}
