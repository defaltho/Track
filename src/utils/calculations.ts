export function monthlyEquivalent(price: number, cycle: string) {
  if (cycle === 'yearly') return price / 12
  if (cycle === 'weekly') return price * (52 / 12)
  return price
}

export function totalMonthlySpend(subscriptions: any[]) {
  return subscriptions
    .filter(s => s.active !== false)
    .reduce((sum, s) => sum + monthlyEquivalent(s.price, s.billingCycle), 0)
}

export function coffees(amount: number, price = 4.50) {
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

export function daysLeft(nextChargeDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = new Date(nextChargeDate)
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
