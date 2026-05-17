import type { Member, SharedExpense } from '../stores/familyData'
export type { Member, SharedExpense }

// Compute net balance per member in a space.
// Positive = others owe them; negative = they owe others.
export function memberBalances(
  members: Member[],
  expenses: SharedExpense[]
): Record<string, number> {
  const bal: Record<string, number> = {}
  for (const m of members) bal[m.id] = 0

  for (const exp of expenses) {
    const { amount, paidBy, split } = exp

    if (bal[paidBy] !== undefined) bal[paidBy] += amount

    switch (split.mode) {
      case 'equal': {
        const share = amount / split.members.length
        for (const mid of split.members) {
          if (bal[mid] !== undefined) bal[mid] -= share
        }
        break
      }
      case 'percent': {
        for (const [mid, pct] of Object.entries(split.shares)) {
          if (bal[mid] !== undefined) bal[mid] -= amount * (pct / 100)
        }
        break
      }
      case 'exact': {
        for (const [mid, share] of Object.entries(split.shares)) {
          if (bal[mid] !== undefined) bal[mid] -= share
        }
        break
      }
      case 'single': {
        if (bal[split.member] !== undefined) bal[split.member] -= amount
        break
      }
    }
  }

  // Round to cents to avoid floating-point drift
  for (const id of Object.keys(bal)) {
    bal[id] = Math.round(bal[id] * 100) / 100
  }

  return bal
}

// Reduce pairwise debts to the minimum number of transfers.
// Greedy: pair largest creditor with largest debtor until both zero.
export function simplifyDebts(
  balances: Record<string, number>
): Array<{ from: string; to: string; amount: number }> {
  const creditors: { id: string; amount: number }[] = []
  const debtors:   { id: string; amount: number }[] = []

  for (const [id, bal] of Object.entries(balances)) {
    const v = Math.round(bal * 100) / 100
    if (v >  0.005) creditors.push({ id, amount:  v })
    if (v < -0.005) debtors.push(  { id, amount: -v })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort(  (a, b) => b.amount - a.amount)

  const transfers: { from: string; to: string; amount: number }[] = []

  while (creditors.length > 0 && debtors.length > 0) {
    const c = creditors[0]
    const d = debtors[0]
    const amount = Math.round(Math.min(c.amount, d.amount) * 100) / 100

    if (amount > 0.005) transfers.push({ from: d.id, to: c.id, amount })

    c.amount = Math.round((c.amount - amount) * 100) / 100
    d.amount = Math.round((d.amount - amount) * 100) / 100

    if (c.amount < 0.005) creditors.shift()
    if (d.amount < 0.005) debtors.shift()
  }

  return transfers
}
