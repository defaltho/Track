import { addDays, addMonths, addWeeks, addYears, parseISO, format } from 'date-fns'

export interface ForecastDay {
  date:       string
  charges:    { name: string; amount: number; emoji: string }[]
  total:      number
  cumulative: number
}

export interface ChargeItem {
  name:           string
  emoji:          string
  price:          number
  billingCycle:   string
  nextChargeDate: string
  active:         boolean
}

export function buildForecast(items: ChargeItem[], days = 30): ForecastDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const map = new Map<string, { name: string; amount: number; emoji: string }[]>()

  for (const item of items) {
    if (!item.active || !item.nextChargeDate) continue
    const parsed = parseISO(item.nextChargeDate)
    let d = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    const end = addDays(today, days)

    // Advance past-due dates to the next upcoming occurrence
    while (d < today) {
      if (item.billingCycle === 'monthly') d = addMonths(d, 1)
      else if (item.billingCycle === 'weekly') d = addWeeks(d, 1)
      else if (item.billingCycle === 'yearly') d = addYears(d, 1)
      else break
    }

    while (d <= end) {
      const key = format(d, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ name: item.name, amount: item.price, emoji: item.emoji })

      if (item.billingCycle === 'monthly')     d = addMonths(d, 1)
      else if (item.billingCycle === 'weekly') d = addWeeks(d, 1)
      else break // yearly / one-off: only once in window
    }
  }

  let cumulative = 0
  return Array.from({ length: days }, (_, i) => {
    const d       = addDays(today, i)
    const key     = format(d, 'yyyy-MM-dd')
    const charges = map.get(key) ?? []
    const total   = Math.round(charges.reduce((s, c) => s + c.amount, 0) * 100) / 100
    cumulative    = Math.round((cumulative + total) * 100) / 100
    return { date: key, charges, total, cumulative }
  })
}

export function forecastTotal(forecast: ForecastDay[]): number {
  return forecast[forecast.length - 1]?.cumulative ?? 0
}

export function nextUpcoming(forecast: ForecastDay[]): ForecastDay | null {
  return forecast.find(d => d.charges.length > 0) ?? null
}
