import { daysLeft } from './calculations'

export interface ScoreBreakdown {
  total:         number  // 0–100
  budgetPts:     number  // 0–40
  subsPts:       number  // 0–30
  tasksPts:      number  // 0–30
  label:         string
  labelColor:    'success' | 'warning' | 'danger' | 'text'
}

export function computeScore(
  subscriptions: any[],
  tasks:         any[],
  monthlyBudget: number | null,
  monthlySpend:  number,
): ScoreBreakdown {
  // Budget (0–40 pts)
  let budgetPts = 40
  if (monthlyBudget && monthlyBudget > 0) {
    const r = monthlySpend / monthlyBudget
    budgetPts = r >= 1.2 ? 0 : r >= 1.0 ? 10 : r >= 0.85 ? 25 : r >= 0.7 ? 35 : 40
  }

  // Subscriptions (0–30 pts): penalise count and overdue
  const active  = subscriptions.filter(s => s.active !== false)
  const overdue = active.filter(s => (daysLeft(s.nextChargeDate) ?? 0) < 0).length
  let subsPts   = active.length <= 3 ? 30 : active.length <= 8 ? 25 : active.length <= 15 ? 18 : 10
  subsPts       = Math.max(0, subsPts - overdue * 5)

  // Tasks (0–30 pts): penalise overdue tasks
  const overdueTasks = tasks.filter(
    t => !t.done && t.dueDate && (daysLeft(t.dueDate) ?? 0) < 0
  ).length
  const tasksPts = overdueTasks === 0 ? 30 : overdueTasks <= 2 ? 20 : overdueTasks <= 5 ? 10 : 2

  const total = Math.min(100, budgetPts + subsPts + tasksPts)
  const label =
    total >= 85 ? 'Excelente' :
    total >= 70 ? 'Bom'       :
    total >= 50 ? 'Razoável'  :
    total >= 30 ? 'Fraco'     : 'Crítico'
  const labelColor: ScoreBreakdown['labelColor'] =
    total >= 70 ? 'success' :
    total >= 50 ? 'warning' :
    total >= 30 ? 'danger'  : 'danger'

  return { total, budgetPts, subsPts, tasksPts, label, labelColor }
}
