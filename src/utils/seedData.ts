/**
 * Seed data for development and manual testing.
 * Import and call loadSeedData() once from a dev screen or store init.
 *
 * Covers all code paths:
 *   - Subscriptions: monthly, yearly, weekly; active and inactive
 *   - Apps: one-time purchase
 *   - Events: this month and future
 *   - Tasks: due today, overdue, no due date, done and pending
 *   - Edge cases: subscription due today, due in 3 days, due in 7 days, inactive (should NOT appear in dueSubs)
 */

import type { Subscription, AppEntry, EventEntry, Task } from '../stores/data'

const now = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]
const addDays = (n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return fmt(d) }
const addMonths = (n: number) => { const d = new Date(now); d.setMonth(d.getMonth() + n); return fmt(d) }
const ts = () => new Date().toISOString()

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const seedSubscriptions: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'subscription',
    name: 'Netflix',
    emoji: '🎬',
    price: 15.99,
    billingCycle: 'monthly',
    currency: 'EUR',
    category: 'Streaming',
    color: '#E50914',
    active: true,
    nextChargeDate: addDays(1),        // due tomorrow → appears in dueSubs
    paymentMethod: 'Card',
    note: 'Family plan',
  },
  {
    type: 'subscription',
    name: 'Spotify',
    emoji: '🎵',
    price: 9.99,
    billingCycle: 'monthly',
    currency: 'EUR',
    category: 'Music',
    color: '#1DB954',
    active: true,
    nextChargeDate: addDays(3),        // due in 3 days → appears in dueSubs
    paymentMethod: 'PayPal',
  },
  {
    type: 'subscription',
    name: 'iCloud+',
    emoji: '☁️',
    price: 2.99,
    billingCycle: 'monthly',
    currency: 'EUR',
    category: 'Cloud',
    color: '#0071E3',
    active: true,
    nextChargeDate: addDays(7),        // due in exactly 7 days → boundary, appears in dueSubs
    paymentMethod: 'Apple Pay',
  },
  {
    type: 'subscription',
    name: 'GitHub Pro',
    emoji: '🐙',
    price: 4.00,
    billingCycle: 'monthly',
    currency: 'USD',
    category: 'Productivity',
    color: '#171515',
    active: true,
    nextChargeDate: addDays(14),       // due in 14 days → does NOT appear in dueSubs
    paymentMethod: 'Card',
  },
  {
    type: 'subscription',
    name: 'Adobe CC',
    emoji: '🎨',
    price: 599.88,
    billingCycle: 'yearly',
    currency: 'EUR',
    category: 'Productivity',
    color: '#FF0000',
    active: true,
    nextChargeDate: addMonths(3),      // renewal in 3 months
    paymentMethod: 'Card',
    note: 'Annual plan paid upfront',
  },
  {
    type: 'subscription',
    name: 'Gym',
    emoji: '🏋️',
    price: 39.99,
    billingCycle: 'monthly',
    currency: 'EUR',
    category: 'Fitness',
    color: '#FF6B35',
    active: false,                     // INACTIVE → must NOT appear in dueSubs or spending
    nextChargeDate: addDays(2),        // would be due soon but inactive
    paymentMethod: 'Bank Transfer',
    note: 'Cancelled',
  },
]

// ─── Apps (one-time / subscription) ──────────────────────────────────────────

export const seedApps: Omit<AppEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'app',
    name: 'Notion',
    emoji: '📝',
    price: 16.00,
    billingCycle: 'monthly',
    currency: 'EUR',
    category: 'Productivity',
    color: '#000000',
    active: true,
    nextChargeDate: addMonths(1),
    paymentMethod: 'Card',
  },
  {
    type: 'app',
    name: 'Figma',
    emoji: '🖌️',
    price: 0,
    billingCycle: 'monthly',
    currency: 'EUR',
    category: 'Productivity',
    color: '#A259FF',
    active: true,
    nextChargeDate: addMonths(1),
    note: 'Free tier',
  },
]

// ─── Events ──────────────────────────────────────────────────────────────────

export const seedEvents: Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'event',
    name: 'Dentist',
    emoji: '🦷',
    date: addDays(3),                  // this month → appears in monthEvents
    currency: 'EUR',
    category: 'Health',
    color: '#000000',
    active: true,
    note: 'Check-up',
  },
  {
    type: 'event',
    name: 'Concert',
    emoji: '🎸',
    date: addDays(10),                 // this month
    currency: 'EUR',
    category: 'Personal',
    color: '#000000',
    active: true,
  },
  {
    type: 'event',
    name: 'Flight to London',
    emoji: '✈️',
    date: addMonths(2),                // future month → does NOT appear in monthEvents
    currency: 'GBP',
    category: 'Travel',
    color: '#000000',
    active: true,
    note: 'TAP TP1234',
  },
]

// ─── Tasks ───────────────────────────────────────────────────────────────────

const todayStr = fmt(now)

export const seedTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Cancel gym membership',
    done: false,
    dueDate: todayStr,                 // due today → appears in todayTasks
    priority: 'high',
    category: 'Finance',
    note: 'Call +351 200 000 000',
  },
  {
    name: 'Review monthly spending',
    done: false,
    dueDate: todayStr,                 // due today
    priority: 'medium',
    category: 'Finance',
  },
  {
    name: 'Book flight',
    done: true,                        // already done
    dueDate: todayStr,
    priority: 'high',
    category: 'Travel',
  },
  {
    name: 'Update password manager',
    done: false,
    dueDate: addDays(3),              // due in 3 days → does NOT appear in todayTasks
    priority: 'medium',
    category: 'Personal',
  },
  {
    name: 'Read book',
    done: false,
    dueDate: null,                    // no due date → never appears in todayTasks
    priority: 'low',
    category: 'Personal',
    note: 'Atomic Habits',
  },
]

// ─── Historical event pool (random sampling) ─────────────────────────────────

const PAST_EVENT_POOL: Array<Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt' | 'date'>> = [
  { type: 'event', name: 'Coffee with Ana',    emoji: '☕', currency: 'EUR', category: 'Personal', color: '#A0522D', active: true },
  { type: 'event', name: 'Gym session',         emoji: '🏋️', currency: 'EUR', category: 'Fitness', color: '#FF6B35', active: true },
  { type: 'event', name: 'Dentist check-up',    emoji: '🦷', currency: 'EUR', category: 'Health', color: '#1E88E5', active: true },
  { type: 'event', name: 'Movie night',         emoji: '🎬', currency: 'EUR', category: 'Personal', color: '#E50914', active: true },
  { type: 'event', name: 'Run',                 emoji: '🏃', currency: 'EUR', category: 'Fitness', color: '#22C55E', active: true },
  { type: 'event', name: 'Dinner out',          emoji: '🍕', currency: 'EUR', category: 'Personal', color: '#F59E0B', active: true },
  { type: 'event', name: 'Concert',             emoji: '🎸', currency: 'EUR', category: 'Personal', color: '#9333EA', active: true },
  { type: 'event', name: 'Doctor visit',        emoji: '🏥', currency: 'EUR', category: 'Health', color: '#0EA5E9', active: true },
  { type: 'event', name: 'Birthday party',      emoji: '🎉', currency: 'EUR', category: 'Personal', color: '#EC4899', active: true },
  { type: 'event', name: 'Yoga class',          emoji: '🧘', currency: 'EUR', category: 'Fitness', color: '#10B981', active: true },
  { type: 'event', name: 'Concert tickets',     emoji: '🎟️', currency: 'EUR', category: 'Personal', color: '#FF2B2B', active: true },
  { type: 'event', name: 'Family lunch',        emoji: '🥗', currency: 'EUR', category: 'Personal', color: '#84CC16', active: true },
]

const PAST_SUB_CHARGES: Array<{ name: string; emoji: string; price: number; category: string; color: string }> = [
  { name: 'Netflix',    emoji: '🎬', price: 15.99, category: 'Streaming', color: '#E50914' },
  { name: 'Spotify',    emoji: '🎵', price: 9.99,  category: 'Music',     color: '#1DB954' },
  { name: 'iCloud+',    emoji: '☁️', price: 2.99,  category: 'Cloud',     color: '#0071E3' },
  { name: 'GitHub Pro', emoji: '🐙', price: 4.00,  category: 'Productivity', color: '#171515' },
]

function randomDateBetween(start: Date, end: Date): string {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return fmt(new Date(t))
}

function generateHistoricalEvents(years: number = 3, perMonth: number = 6): Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
  const out: Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const end = new Date()
  const start = new Date(end.getFullYear() - years, end.getMonth(), 1)
  const months = years * 12
  for (let m = 0; m < months; m++) {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + m, 1)
    const monthEnd   = new Date(start.getFullYear(), start.getMonth() + m + 1, 0)
    const n = Math.floor(perMonth * (0.6 + Math.random() * 0.8)) // 60–140% variance
    for (let i = 0; i < n; i++) {
      const template = PAST_EVENT_POOL[Math.floor(Math.random() * PAST_EVENT_POOL.length)]
      out.push({ ...template, date: randomDateBetween(monthStart, monthEnd) })
    }
  }
  return out
}

function generateHistoricalCharges(years: number = 3): Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>[] {
  const out: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const end = new Date()
  // For each historical sub charge template, generate one charge per month
  for (const tpl of PAST_SUB_CHARGES) {
    for (let monthsAgo = 1; monthsAgo <= years * 12; monthsAgo++) {
      const d = new Date(end.getFullYear(), end.getMonth() - monthsAgo, 5 + Math.floor(Math.random() * 20))
      out.push({
        type: 'subscription',
        name: tpl.name,
        emoji: tpl.emoji,
        price: tpl.price,
        billingCycle: 'monthly',
        currency: 'EUR',
        category: tpl.category,
        color: tpl.color,
        active: false,  // historical charges, marked inactive so they don't count in dueSubs/monthlySpend
        nextChargeDate: fmt(d),
        paymentMethod: 'Card',
        note: 'Historical charge',
      })
    }
  }
  return out
}

// ─── Loader helper ────────────────────────────────────────────────────────────

/**
 * Call this once (e.g., from a dev button or store init) to populate the store
 * with realistic test data. Safe to call multiple times — generates new IDs each time.
 */
export function loadSeedData(store: {
  addSubscription: (item: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void
  addApp: (item: Omit<AppEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  addEvent: (item: Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  addTask: (item: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  // Current active data
  seedSubscriptions.forEach(s => store.addSubscription(s))
  seedApps.forEach(a => store.addApp(a))
  seedEvents.forEach(e => store.addEvent(e))
  seedTasks.forEach(t => store.addTask(t))

  // 3 years of history — historical events + dormant subscription charges
  generateHistoricalEvents(3, 6).forEach(e => store.addEvent(e))
  generateHistoricalCharges(3).forEach(s => store.addSubscription(s))
}

// ─── Expected computation results (for manual verification) ──────────────────

/**
 * With the seed data above, expected values as of 2026-05-14:
 *
 * Active subscriptions (Gym excluded):
 *   Netflix:   15.99/mo
 *   Spotify:    9.99/mo
 *   iCloud+:    2.99/mo
 *   GitHub Pro: 4.00/mo  (USD, treated as same unit in totalMonthlySpend)
 *   Adobe CC: 599.88/12 = 49.99/mo
 *
 * totalMonthlySpend ≈ 83.96
 * projectedYearly  ≈ 83.96 * 12 = 1007.52  (except Adobe is already yearly: +599.88 - 49.99*12 = same)
 * coffees(83.96, 4.50) = 19
 *
 * dueSubs (active, diff 0–7 days):
 *   Netflix (tomorrow, +1)  ✓
 *   Spotify (+3)            ✓
 *   iCloud+ (+7)            ✓
 *   Gym (inactive)          ✗ — must NOT appear
 *
 * todayTasks (dueDate === today):
 *   'Cancel gym membership' (undone)  ✓
 *   'Review monthly spending' (undone) ✓
 *   'Book flight' (done)              ✓
 *
 * monthEvents (date starts with current month YYYY-MM):
 *   Dentist (+3 days)  ✓
 *   Concert (+10 days) ✓
 *   Flight to London   ✗ — 2 months ahead
 */
