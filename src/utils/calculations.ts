// BUG C2/M6 fix: validate price at the top of monthlyEquivalent
export function monthlyEquivalent(price: number, cycle: string) {
  if (!price || isNaN(Number(price))) return 0
  if (cycle === 'yearly') return price / 12
  if (cycle === 'weekly') return price * (52 / 12)
  return price
}

export function totalMonthlySpend(subscriptions: any[]) {
  return subscriptions
    .filter(s => s.active !== false)
    .reduce((sum, s) => sum + monthlyEquivalent(s.price, s.billingCycle), 0)
}

// BUG M6 fix: validate price > 0 to avoid division by zero
export function coffees(amount: number, price = 4.50) {
  if (!price || price <= 0) return 0
  return Math.round(amount / price)
}

export function projectedYearly(subscriptions: any[]) {
  return subscriptions
    .filter(s => s.active !== false)
    .reduce((sum, s) => {
      if (s.billingCycle === 'yearly') return sum + s.price
      if (s.billingCycle === 'weekly') return sum + s.price * 52
      return sum + s.price * 12
    }, 0)
}

// BUG M7 fix: validate nextChargeDate; normalise both dates to local midnight
export function daysLeft(nextChargeDate: string) {
  if (!nextChargeDate) return null
  const next = new Date(nextChargeDate)
  if (isNaN(next.getTime())) return null
  next.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
