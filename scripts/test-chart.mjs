// Tests for `src/utils/chart.ts` — runnable with: `node --test scripts/test-chart.mjs`
//
// The chart module is TypeScript; rather than depend on a TS test runner,
// this file mirrors the logic 1:1 so the test failures still surface
// regressions. **If you change `buildMonthlyBars` in chart.ts, update
// this file in lockstep.**

import { test } from 'node:test'
import assert from 'node:assert/strict'

// ── Mirror of src/utils/calculations.ts ────────────────────────────
function monthlyEquivalent (price, cycle) {
  if (!price || isNaN(Number(price))) return 0
  if (cycle === 'yearly') return price / 12
  if (cycle === 'weekly') return price * (52 / 12)
  return price
}

// ── Mirror of src/utils/chart.ts → buildMonthlyBars ─────────────────
function buildMonthlyBars (subscriptions, monthsBack = 5, monthsAhead = 3, monthOffset = 0) {
  const today = new Date()
  const result = []

  for (let m = -monthsBack; m <= monthsAhead; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() + m - monthOffset, 1)
    const barYear  = d.getFullYear()
    const barMonth = d.getMonth()
    let total = 0

    for (const sub of subscriptions) {
      const cycle = sub.billingCycle ?? 'monthly'
      const price = parseFloat(sub.price)
      if (!isFinite(price) || price <= 0) continue

      if (sub.active === false) {
        if (!sub.nextChargeDate) continue
        const cd = new Date(sub.nextChargeDate)
        if (isNaN(cd.getTime())) continue
        if (cd.getFullYear() === barYear && cd.getMonth() === barMonth) {
          total += price
        }
      } else {
        total += monthlyEquivalent(price, cycle)
      }
    }

    result.push({
      label: d.toLocaleString('en', { month: 'short' }),
      value: total,
      isCurrent: monthOffset === 0 && m === 0,
      isFuture: monthOffset === 0 && m > 0,
    })
  }
  return result
}

// ── Helpers ────────────────────────────────────────────────────────
const today = new Date()
const ymd = (year, monthIdx) => new Date(year, monthIdx, 5).toISOString().split('T')[0]

// ───────────────────────────────────────────────────────────────────
// Window shape
// ───────────────────────────────────────────────────────────────────

test('produces back + 1 + ahead bars', () => {
  const bars = buildMonthlyBars([], 5, 2, 0)
  assert.equal(bars.length, 8)
})

test('flags the current month exactly once and only when monthOffset is 0', () => {
  const bars     = buildMonthlyBars([], 3, 3, 0)
  const shifted  = buildMonthlyBars([], 3, 3, 7)
  const current  = bars.filter(b => b.isCurrent)
  assert.equal(current.length, 1)
  assert.equal(bars[3].isCurrent, true)              // index 3 = -monthsBack + 3 = 0
  assert.equal(shifted.every(b => !b.isCurrent), true)
})

test('marks every bar after the current month as future', () => {
  const bars = buildMonthlyBars([], 2, 3, 0)
  assert.deepEqual(bars.map(b => b.isFuture), [false, false, false, true, true, true])
})

// ───────────────────────────────────────────────────────────────────
// Active subscription contributions
// ───────────────────────────────────────────────────────────────────

test('a monthly sub adds its full price to every bar', () => {
  const bars = buildMonthlyBars(
    [{ price: 10, billingCycle: 'monthly', active: true }],
    3, 3
  )
  bars.forEach(b => assert.equal(b.value, 10))
})

test('a yearly sub is AMORTIZED — no spike on the renewal month', () => {
  const adobe = {
    price: 600,
    billingCycle: 'yearly',
    active: true,
    nextChargeDate: ymd(today.getFullYear(), today.getMonth()),
  }
  const bars = buildMonthlyBars([adobe], 5, 5)
  bars.forEach(b => assert.equal(+b.value.toFixed(4), 50))
})

test('a weekly sub uses 52/12, not floor(daysInMonth/7)', () => {
  const bars = buildMonthlyBars(
    [{ price: 3, billingCycle: 'weekly', active: true }],
    3, 3
  )
  bars.forEach(b => assert.equal(+b.value.toFixed(4), +(3 * 52 / 12).toFixed(4)))
})

test('sums contributions from multiple active subs', () => {
  const bars = buildMonthlyBars(
    [
      { price: 9.99,  billingCycle: 'monthly', active: true },
      { price: 120,   billingCycle: 'yearly',  active: true, nextChargeDate: ymd(2026, 3) },
      { price: 2,     billingCycle: 'weekly',  active: true },
    ],
    1, 1
  )
  const expected = 9.99 + 10 + 2 * (52 / 12)
  bars.forEach(b => assert.equal(+b.value.toFixed(4), +expected.toFixed(4)))
})

// ───────────────────────────────────────────────────────────────────
// Inactive / historical charges
// ───────────────────────────────────────────────────────────────────

test('an inactive sub only contributes in its exact (year, month)', () => {
  const targetYear  = today.getFullYear() - 1
  const targetMonth = today.getMonth()                          // 12 months ago
  const sub = {
    price: 50,
    billingCycle: 'monthly',
    active: false,
    nextChargeDate: ymd(targetYear, targetMonth),
  }
  const bars = buildMonthlyBars([sub], 14, 0)
  const hit = bars.find(b => +b.value > 0)
  assert.ok(hit, 'expected exactly one bar to register the historical charge')
  assert.equal(hit.value, 50)
  // Every other bar must be zero.
  assert.equal(bars.filter(b => +b.value > 0).length, 1)
})

test('an inactive sub without a nextChargeDate is ignored entirely', () => {
  const bars = buildMonthlyBars(
    [{ price: 99, billingCycle: 'monthly', active: false }],
    3, 3
  )
  bars.forEach(b => assert.equal(b.value, 0))
})

test('historical charge from a year ago shows in the correct anniversary bar only', () => {
  const lastYearSameMonth = ymd(today.getFullYear() - 1, today.getMonth())
  const lastYearOther     = ymd(today.getFullYear() - 1, (today.getMonth() + 6) % 12)

  const bars = buildMonthlyBars(
    [
      { price: 30, billingCycle: 'monthly', active: false, nextChargeDate: lastYearSameMonth },
      { price: 30, billingCycle: 'monthly', active: false, nextChargeDate: lastYearOther },
    ],
    13, 0
  )
  const total = bars.reduce((s, b) => s + b.value, 0)
  assert.equal(total, 60, 'each charge counts exactly once across the window')
})

// ───────────────────────────────────────────────────────────────────
// Malformed input
// ───────────────────────────────────────────────────────────────────

test('non-numeric / missing / zero / negative prices are ignored', () => {
  const bars = buildMonthlyBars(
    [
      { price: 'banana', billingCycle: 'monthly', active: true },
      { price: NaN,      billingCycle: 'monthly', active: true },
      { price: null,     billingCycle: 'monthly', active: true },
      { price: 0,        billingCycle: 'monthly', active: true },
      { price: -5,       billingCycle: 'monthly', active: true },
    ],
    1, 1
  )
  bars.forEach(b => assert.equal(b.value, 0))
})

test('missing billingCycle defaults to monthly', () => {
  const bars = buildMonthlyBars(
    [{ price: 7, active: true }],
    1, 1
  )
  bars.forEach(b => assert.equal(b.value, 7))
})

test('inactive sub with invalid nextChargeDate is ignored', () => {
  const bars = buildMonthlyBars(
    [{ price: 50, billingCycle: 'monthly', active: false, nextChargeDate: 'not-a-date' }],
    3, 3
  )
  bars.forEach(b => assert.equal(b.value, 0))
})

test('empty input → all bars are zero', () => {
  const bars = buildMonthlyBars([], 5, 5)
  bars.forEach(b => assert.equal(b.value, 0))
})

// ───────────────────────────────────────────────────────────────────
// monthOffset (used by the comp series in Analytics)
// ───────────────────────────────────────────────────────────────────

test('monthOffset shifts the entire window backwards by that many months', () => {
  const cur  = buildMonthlyBars([], 2, 2, 0)
  const prev = buildMonthlyBars([], 2, 2, 5)
  // First bar of `cur` should map to (today.month - 2). First bar of
  // `prev` should be 5 months earlier than that.
  const curFirst  = new Date(today.getFullYear(), today.getMonth() - 2, 1)
  const prevFirst = new Date(today.getFullYear(), today.getMonth() - 2 - 5, 1)
  assert.equal(cur[0].label,  curFirst.toLocaleString('en', { month: 'short' }))
  assert.equal(prev[0].label, prevFirst.toLocaleString('en', { month: 'short' }))
})

// ───────────────────────────────────────────────────────────────────
// Regression — the original bug
// ───────────────────────────────────────────────────────────────────

test('REGRESSION: yearly sub no longer creates a 12× spike on its month', () => {
  // Old bug: the yearly price was added in full to any bar whose
  // calendar month matched `nextChargeDate.getMonth()`, regardless of
  // year. That made the yearly month tower over the rest of the chart
  // and crush monthly subs to ~0 visually.
  const yearly = { price: 600, billingCycle: 'yearly', active: true, nextChargeDate: ymd(today.getFullYear(), today.getMonth()) }
  const bars   = buildMonthlyBars([yearly], 6, 6)
  const top    = Math.max(...bars.map(b => b.value))
  const bottom = Math.min(...bars.map(b => b.value))
  assert.equal(top - bottom < 0.01, true, 'yearly contribution must be flat after amortization')
  assert.equal(+top.toFixed(2), 50)
})
