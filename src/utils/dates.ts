import { addMonths, addWeeks, addYears, format } from 'date-fns'

export function computeNextChargeDate(billingCycle: string) {
  const today = new Date()
  switch (billingCycle) {
    case 'weekly':  return format(addWeeks(today, 1),  'yyyy-MM-dd')
    case 'yearly':  return format(addYears(today, 1),  'yyyy-MM-dd')
    default:        return format(addMonths(today, 1), 'yyyy-MM-dd')
  }
}

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'd MMM yyyy')
}
