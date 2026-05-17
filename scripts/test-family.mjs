// Test suite for src/utils/family.ts — runs headless with Node (no Expo).
// Usage: node scripts/test-family.mjs

let passed = 0, failed = 0

function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    console.log(`  ✓  ${label}`)
    passed++
  } else {
    console.error(`  ✗  ${label}`)
    console.error(`     expected: ${JSON.stringify(expected)}`)
    console.error(`     actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

// ── Inline implementations (mirrors src/utils/family.ts) ─────────────────
function memberBalances(members, expenses) {
  const bal = {}
  for (const m of members) bal[m.id] = 0

  for (const exp of expenses) {
    const { amount, paidBy, split } = exp
    if (bal[paidBy] !== undefined) bal[paidBy] += amount

    switch (split.mode) {
      case 'equal': {
        const share = amount / split.members.length
        for (const mid of split.members)
          if (bal[mid] !== undefined) bal[mid] -= share
        break
      }
      case 'percent': {
        for (const [mid, pct] of Object.entries(split.shares))
          if (bal[mid] !== undefined) bal[mid] -= amount * (pct / 100)
        break
      }
      case 'exact': {
        for (const [mid, share] of Object.entries(split.shares))
          if (bal[mid] !== undefined) bal[mid] -= share
        break
      }
      case 'single': {
        if (bal[split.member] !== undefined) bal[split.member] -= amount
        break
      }
    }
  }
  for (const id of Object.keys(bal))
    bal[id] = Math.round(bal[id] * 100) / 100
  return bal
}

function simplifyDebts(balances) {
  const creditors = [], debtors = []
  for (const [id, bal] of Object.entries(balances)) {
    const v = Math.round(bal * 100) / 100
    if (v >  0.005) creditors.push({ id, amount:  v })
    if (v < -0.005) debtors.push(  { id, amount: -v })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort(  (a, b) => b.amount - a.amount)

  const transfers = []
  while (creditors.length > 0 && debtors.length > 0) {
    const c = creditors[0], d = debtors[0]
    const amount = Math.round(Math.min(c.amount, d.amount) * 100) / 100
    if (amount > 0.005) transfers.push({ from: d.id, to: c.id, amount })
    c.amount = Math.round((c.amount - amount) * 100) / 100
    d.amount = Math.round((d.amount - amount) * 100) / 100
    if (c.amount < 0.005) creditors.shift()
    if (d.amount < 0.005) debtors.shift()
  }
  return transfers
}

// ── Fixtures ──────────────────────────────────────────────────────────────
const members = [
  { id: 'a', spaceId: 's1' },
  { id: 'b', spaceId: 's1' },
  { id: 'c', spaceId: 's1' },
]

// ── memberBalances tests ──────────────────────────────────────────────────
console.log('\nmemberBalances')

// 1. Equal split — A pays 30, split among A+B+C → A: +30-10=+20, B:-10, C:-10
assert('equal split — 3 members',
  memberBalances(members, [{
    id: 'e1', spaceId: 's1', kind: 'expense',
    amount: 30, paidBy: 'a',
    split: { mode: 'equal', members: ['a', 'b', 'c'] },
  }]),
  { a: 20, b: -10, c: -10 }
)

// 2. Single split — B pays 50 for C only → B:+50-0=+50, C:-50, A:0
assert('single split',
  memberBalances(members, [{
    id: 'e2', spaceId: 's1', kind: 'expense',
    amount: 50, paidBy: 'b',
    split: { mode: 'single', member: 'c' },
  }]),
  { a: 0, b: 50, c: -50 }
)

// 3. Percent split — A pays 100 → A:40%, B:60%
assert('percent split',
  memberBalances(members, [{
    id: 'e3', spaceId: 's1', kind: 'expense',
    amount: 100, paidBy: 'a',
    split: { mode: 'percent', shares: { a: 40, b: 60 } },
  }]),
  { a: 60, b: -60, c: 0 }
)

// 4. Exact split — C pays 90 → A:30, B:60
assert('exact split',
  memberBalances(members, [{
    id: 'e4', spaceId: 's1', kind: 'expense',
    amount: 90, paidBy: 'c',
    split: { mode: 'exact', shares: { a: 30, b: 60 } },
  }]),
  { a: -30, b: -60, c: 90 }
)

// 5. Two expenses: A pays 60, B pays 60, equal 3-way each
// A: +60-20=+20, B: +60-20=+20, C: -20-20=-40
assert('two payers, C bears full debt',
  memberBalances(members, [
    { id: 'e5a', spaceId: 's1', kind: 'expense', amount: 60, paidBy: 'a', split: { mode: 'equal', members: ['a', 'b', 'c'] } },
    { id: 'e5b', spaceId: 's1', kind: 'expense', amount: 60, paidBy: 'b', split: { mode: 'equal', members: ['a', 'b', 'c'] } },
  ]),
  { a: 20, b: 20, c: -40 }
)

// ── simplifyDebts tests ───────────────────────────────────────────────────
console.log('\nsimplifyDebts')

// 6. Simple: A is owed 20, B owes 10, C owes 10 → B→A 10, C→A 10
assert('two debtors pay one creditor',
  simplifyDebts({ a: 20, b: -10, c: -10 }),
  [{ from: 'b', to: 'a', amount: 10 }, { from: 'c', to: 'a', amount: 10 }]
)

// 7. A→B chain: A owes 30, B is owed 15, C is owed 15 → A→B 15, A→C 15
assert('one debtor pays two creditors',
  simplifyDebts({ a: -30, b: 15, c: 15 }),
  [{ from: 'a', to: 'b', amount: 15 }, { from: 'a', to: 'c', amount: 15 }]
)

// 8. A=+50, B=-30, C=-20 → 2 transfers (not 3)
assert('minimises transfer count',
  simplifyDebts({ a: 50, b: -30, c: -20 }),
  [{ from: 'b', to: 'a', amount: 30 }, { from: 'c', to: 'a', amount: 20 }]
)

// 9. All balanced → empty
assert('balanced — no transfers',
  simplifyDebts({ a: 0, b: 0, c: 0 }),
  []
)

// 10. Rounding: 33.33... per person from 100/3 — ensure no infinite loop
const balRounded = memberBalances(
  members,
  [{ id: 'e10', spaceId: 's1', kind: 'expense', amount: 100, paidBy: 'a', split: { mode: 'equal', members: ['a', 'b', 'c'] } }]
)
const transfersRounded = simplifyDebts(balRounded)
assert('floating-point rounding — terminates',
  transfersRounded.reduce((s, t) => s + t.amount, 0) <= 67,
  true
)

// ── Result ────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
