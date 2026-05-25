import { addMonths, addWeeks, addYears, format, isBefore, parseISO } from 'date-fns'

// BUG L4 fix: added explicit default with console warning for unknown cycles
export function computeNextChargeDate(billingCycle: string) {
  const today = new Date()
  switch (billingCycle) {
    case 'weekly':  return format(addWeeks(today, 1),  'yyyy-MM-dd')
    case 'yearly':  return format(addYears(today, 1),  'yyyy-MM-dd')
    case 'monthly': return format(addMonths(today, 1), 'yyyy-MM-dd')
    default:
      console.warn('[dates] Unknown billingCycle:', billingCycle, '— defaulting to monthly')
      return format(addMonths(today, 1), 'yyyy-MM-dd')
  }
}

export function effectiveNextCharge(nextChargeDate: string, billingCycle: string): string {
  let date = parseISO(nextChargeDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  while (isBefore(date, today)) {
    if (billingCycle === 'weekly')       date = addWeeks(date, 1)
    else if (billingCycle === 'yearly')  date = addYears(date, 1)
    else                                 date = addMonths(date, 1)
  }
  return format(date, 'yyyy-MM-dd')
}

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

// BUG M9 fix: try/catch and isNaN guard
// BUG L3 fix: use parseISO for YYYY-MM-DD strings instead of new Date()
export function formatDate(dateStr: string) {
  try {
    const date = parseISO(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return format(date, 'd MMM yyyy')
  } catch {
    return dateStr
  }
}
