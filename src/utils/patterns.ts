import { buildMonthlyBars } from './chart'

export interface CategoryAnomaly {
  category:     string
  currentMonth: number
  avg3Month:    number
  deltaPct:     number   // positive = above average
  isAnomaly:    boolean  // deltaPct > 20
}

export function detectAnomalies(
  subscriptions: any[],
  minMonthly = 0.5,
): CategoryAnomaly[] {
  const active = subscriptions.filter(s => s.active !== false)
  const cats   = [...new Set(active.map(s => s.category).filter(Boolean))] as string[]

  return cats
    .map((cat): CategoryAnomaly => {
      const items = subscriptions.filter(s => s.category === cat)
      // 3 months back + current (monthsAhead=0)
      const bars  = buildMonthlyBars(items, 3, 0)
      const curr  = bars[bars.length - 1]?.value ?? 0
      const past  = bars.slice(0, bars.length - 1)
      const avg   = past.length ? past.reduce((s, b) => s + b.value, 0) / past.length : curr
      const delta = avg > 0.01 ? ((curr - avg) / avg) * 100 : 0
      return {
        category:     cat,
        currentMonth: Math.round(curr * 100) / 100,
        avg3Month:    Math.round(avg  * 100) / 100,
        deltaPct:     Math.round(delta * 10) / 10,
        isAnomaly:    delta > 20,
      }
    })
    .filter(r => r.currentMonth >= minMonthly || r.avg3Month >= minMonthly)
    .sort((a, b) => b.deltaPct - a.deltaPct)
}
