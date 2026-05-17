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
  // ── Streaming ────────────────────────────────────────────────────────
  { type: 'subscription', name: 'Netflix',         emoji: '🎬', price: 15.99, billingCycle: 'monthly', currency: 'EUR', category: 'Streaming',    color: '#E50914', active: true, nextChargeDate: addDays(1),   paymentMethod: 'Card',     note: 'Family plan' },
  { type: 'subscription', name: 'HBO Max',         emoji: '🎞️', price: 9.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Streaming',    color: '#9333EA', active: true, nextChargeDate: addDays(5),   paymentMethod: 'Card' },
  { type: 'subscription', name: 'Disney+',         emoji: '🏰', price: 8.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Streaming',    color: '#113CCF', active: true, nextChargeDate: addDays(12),  paymentMethod: 'PayPal' },

  // ── Music ────────────────────────────────────────────────────────────
  { type: 'subscription', name: 'Spotify',         emoji: '🎵', price: 9.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Music',        color: '#1DB954', active: true, nextChargeDate: addDays(3),   paymentMethod: 'PayPal' },
  { type: 'subscription', name: 'Apple Music',     emoji: '🎧', price: 5.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Music',        color: '#FA243C', active: true, nextChargeDate: addDays(8),   paymentMethod: 'Apple Pay', note: 'Student plan' },

  // ── Gaming ───────────────────────────────────────────────────────────
  { type: 'subscription', name: 'PlayStation Plus', emoji: '🎮', price: 71.99, billingCycle: 'yearly',  currency: 'EUR', category: 'Gaming',       color: '#003791', active: true, nextChargeDate: addMonths(4), paymentMethod: 'Card' },
  { type: 'subscription', name: 'Xbox Game Pass',  emoji: '🕹️', price: 12.99, billingCycle: 'monthly', currency: 'EUR', category: 'Gaming',       color: '#107C10', active: true, nextChargeDate: addDays(11),  paymentMethod: 'Card' },

  // ── Cloud ────────────────────────────────────────────────────────────
  { type: 'subscription', name: 'iCloud+',         emoji: '☁️', price: 2.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Cloud',        color: '#0071E3', active: true, nextChargeDate: addDays(7),   paymentMethod: 'Apple Pay' },
  { type: 'subscription', name: 'Google One',      emoji: '📦', price: 2.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Cloud',        color: '#4285F4', active: true, nextChargeDate: addDays(19),  paymentMethod: 'Card',     note: '200 GB plan' },

  // ── Productivity ─────────────────────────────────────────────────────
  { type: 'subscription', name: 'GitHub Pro',      emoji: '🐙', price: 4.00,  billingCycle: 'monthly', currency: 'USD', category: 'Productivity', color: '#171515', active: true, nextChargeDate: addDays(14),  paymentMethod: 'Card' },
  { type: 'subscription', name: 'Notion',          emoji: '📝', price: 10.00, billingCycle: 'monthly', currency: 'EUR', category: 'Productivity', color: '#000000', active: true, nextChargeDate: addDays(27),  paymentMethod: 'Card' },
  { type: 'subscription', name: 'Adobe CC',        emoji: '🎨', price: 599.88, billingCycle: 'yearly', currency: 'EUR', category: 'Productivity', color: '#FF0000', active: true, nextChargeDate: addMonths(3), paymentMethod: 'Card',     note: 'Annual plan paid upfront' },
  { type: 'subscription', name: 'Linear',          emoji: '📐', price: 8.00,  billingCycle: 'monthly', currency: 'USD', category: 'Productivity', color: '#5E6AD2', active: true, nextChargeDate: addDays(6),   paymentMethod: 'Card' },

  // ── News / Reading ───────────────────────────────────────────────────
  { type: 'subscription', name: 'NYT',             emoji: '📰', price: 4.00,  billingCycle: 'monthly', currency: 'EUR', category: 'News',         color: '#000000', active: true, nextChargeDate: addDays(9),   paymentMethod: 'PayPal' },

  // ── Fitness / Wellness ───────────────────────────────────────────────
  { type: 'subscription', name: 'Strava Premium',  emoji: '🏃', price: 5.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Fitness',      color: '#FC4C02', active: true, nextChargeDate: addDays(13),  paymentMethod: 'Card' },
  { type: 'subscription', name: 'Headspace',       emoji: '🧘', price: 12.99, billingCycle: 'monthly', currency: 'EUR', category: 'Fitness',      color: '#F47A1F', active: true, nextChargeDate: addDays(17),  paymentMethod: 'Card' },

  // ── Education ────────────────────────────────────────────────────────
  { type: 'subscription', name: 'Duolingo Super',  emoji: '🦉', price: 6.99,  billingCycle: 'monthly', currency: 'EUR', category: 'Education',    color: '#58CC02', active: true, nextChargeDate: addDays(20),  paymentMethod: 'PayPal' },

  // ── Other / Utilities ────────────────────────────────────────────────
  { type: 'subscription', name: 'Vodafone Fiber',  emoji: '📡', price: 39.99, billingCycle: 'monthly', currency: 'EUR', category: 'Other',        color: '#E60000', active: true, nextChargeDate: addDays(10),  paymentMethod: 'Bank Transfer', note: '500 Mbps' },

  // ── Inactive (must NOT appear in dueSubs or monthly spend) ───────────
  { type: 'subscription', name: 'Gym',             emoji: '🏋️', price: 39.99, billingCycle: 'monthly', currency: 'EUR', category: 'Fitness',      color: '#FF6B35', active: false, nextChargeDate: addDays(2),  paymentMethod: 'Bank Transfer', note: 'Cancelled' },
]

// ─── Apps (paid tools / free tiers) ──────────────────────────────────────────

export const seedApps: Omit<AppEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'app', name: 'ChatGPT Plus',     emoji: '🤖', price: 20.00, billingCycle: 'monthly', currency: 'USD', category: 'Productivity', color: '#10A37F', active: true, nextChargeDate: addDays(15), paymentMethod: 'Card' },
  { type: 'app', name: '1Password Family', emoji: '🔐', price: 4.99,  billingCycle: 'monthly', currency: 'USD', category: 'Productivity', color: '#0572EC', active: true, nextChargeDate: addDays(23), paymentMethod: 'Card',     note: 'Up to 5 members' },
  { type: 'app', name: 'Raycast Pro',      emoji: '⚡', price: 8.00,  billingCycle: 'monthly', currency: 'USD', category: 'Productivity', color: '#FF6363', active: true, nextChargeDate: addDays(26), paymentMethod: 'PayPal' },
  { type: 'app', name: 'Figma',            emoji: '🖌️', price: 0,     billingCycle: 'monthly', currency: 'EUR', category: 'Productivity', color: '#A259FF', active: true, nextChargeDate: addMonths(1), note: 'Free tier' },
  { type: 'app', name: 'ProtonMail Plus',  emoji: '✉️', price: 4.00,  billingCycle: 'monthly', currency: 'EUR', category: 'Productivity', color: '#6D4AFF', active: true, nextChargeDate: addDays(29), paymentMethod: 'Card' },
]

// ─── Events ──────────────────────────────────────────────────────────────────

export const seedEvents: Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── This week ────────────────────────────────────────────────────────
  { type: 'event', name: 'Job interview',      emoji: '💼', date: addDays(1),  currency: 'EUR', category: 'Work',     color: '#1E40AF', active: true, note: 'Senior frontend role' },
  { type: 'event', name: 'Dentist',            emoji: '🦷', date: addDays(3),  currency: 'EUR', category: 'Health',   color: '#1E88E5', active: true, note: 'Check-up' },
  { type: 'event', name: 'Family lunch',       emoji: '🥗', date: addDays(5),  currency: 'EUR', category: 'Personal', color: '#84CC16', active: true },

  // ── Later this month ─────────────────────────────────────────────────
  { type: 'event', name: 'Work conference',    emoji: '🧑‍💻', date: addDays(8), currency: 'EUR', category: 'Work',     color: '#0EA5E9', active: true, note: 'React Conf' },
  { type: 'event', name: 'Concert',            emoji: '🎸', date: addDays(10), currency: 'EUR', category: 'Personal', color: '#9333EA', active: true, note: 'Tame Impala' },
  { type: 'event', name: 'Birthday party',     emoji: '🎉', date: addDays(14), currency: 'EUR', category: 'Personal', color: '#EC4899', active: true, note: "Sara's 30th" },
  { type: 'event', name: 'Movie premiere',     emoji: '🍿', date: addDays(18), currency: 'EUR', category: 'Personal', color: '#F59E0B', active: true },
  { type: 'event', name: 'Doctor visit',       emoji: '🏥', date: addDays(22), currency: 'EUR', category: 'Health',   color: '#0EA5E9', active: true, note: 'Annual blood test' },
  { type: 'event', name: 'Anniversary dinner', emoji: '🥂', date: addDays(28), currency: 'EUR', category: 'Personal', color: '#DC2626', active: true },

  // ── Next month and beyond ────────────────────────────────────────────
  { type: 'event', name: 'Vacation start',     emoji: '🌴', date: addDays(45), currency: 'EUR', category: 'Travel',   color: '#22C55E', active: true, note: 'Algarve · 10 days' },
  { type: 'event', name: 'Flight to London',   emoji: '✈️', date: addMonths(2), currency: 'GBP', category: 'Travel',  color: '#1E40AF', active: true, note: 'TAP TP1234' },
]

// ─── Tasks ───────────────────────────────────────────────────────────────────

const todayStr = fmt(now)

export const seedTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── Due today ────────────────────────────────────────────────────────
  { name: 'Cancel gym membership',     done: false, dueDate: todayStr,   priority: 'high',   category: 'Finance',  note: 'Call +351 200 000 000' },
  { name: 'Review monthly spending',   done: false, dueDate: todayStr,   priority: 'medium', category: 'Finance' },
  { name: 'Call mom',                  done: false, dueDate: todayStr,   priority: 'low',    category: 'Personal' },
  { name: 'Schedule dentist',          done: true,  dueDate: todayStr,   priority: 'low',    category: 'Health' },
  { name: 'Book flight',               done: true,  dueDate: todayStr,   priority: 'high',   category: 'Travel' },

  // ── This week ────────────────────────────────────────────────────────
  { name: 'Pay rent',                  done: false, dueDate: addDays(1), priority: 'high',   category: 'Finance' },
  { name: 'Submit expense report',     done: false, dueDate: addDays(2), priority: 'medium', category: 'Work' },
  { name: 'Update password manager',   done: false, dueDate: addDays(3), priority: 'medium', category: 'Personal' },
  { name: 'Buy birthday gift',         done: false, dueDate: addDays(4), priority: 'medium', category: 'Personal', note: "Sara's 30th" },
  { name: 'Renew car insurance',       done: false, dueDate: addDays(5), priority: 'high',   category: 'Finance' },

  // ── Later ────────────────────────────────────────────────────────────
  { name: 'Plan vacation',             done: false, dueDate: addDays(10), priority: 'low',   category: 'Travel',   note: 'Pick dates + book hotel' },
  { name: 'Tax return',                done: false, dueDate: addDays(45), priority: 'high',  category: 'Finance' },

  // ── No due date / done ───────────────────────────────────────────────
  { name: 'Read book',                 done: false, dueDate: null,        priority: 'low',   category: 'Personal', note: 'Atomic Habits' },
  { name: 'Refactor data layer',       done: false, dueDate: null,        priority: 'medium',category: 'Work' },
  { name: 'Clean inbox',               done: true,  dueDate: null,        priority: 'low',   category: 'Work' },
]

// ─── Historical event pool (random sampling) ─────────────────────────────────

const PAST_EVENT_POOL: Array<Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt' | 'date'>> = [
  { type: 'event', name: 'Coffee with Ana',    emoji: '☕', currency: 'EUR', category: 'Personal', color: '#A0522D', active: true },
  { type: 'event', name: 'Gym session',        emoji: '🏋️', currency: 'EUR', category: 'Fitness',  color: '#FF6B35', active: true },
  { type: 'event', name: 'Dentist check-up',   emoji: '🦷', currency: 'EUR', category: 'Health',   color: '#1E88E5', active: true },
  { type: 'event', name: 'Movie night',        emoji: '🎬', currency: 'EUR', category: 'Personal', color: '#E50914', active: true },
  { type: 'event', name: 'Run',                emoji: '🏃', currency: 'EUR', category: 'Fitness',  color: '#22C55E', active: true },
  { type: 'event', name: 'Dinner out',         emoji: '🍕', currency: 'EUR', category: 'Personal', color: '#F59E0B', active: true },
  { type: 'event', name: 'Concert',            emoji: '🎸', currency: 'EUR', category: 'Personal', color: '#9333EA', active: true },
  { type: 'event', name: 'Doctor visit',       emoji: '🏥', currency: 'EUR', category: 'Health',   color: '#0EA5E9', active: true },
  { type: 'event', name: 'Birthday party',     emoji: '🎉', currency: 'EUR', category: 'Personal', color: '#EC4899', active: true },
  { type: 'event', name: 'Yoga class',         emoji: '🧘', currency: 'EUR', category: 'Fitness',  color: '#10B981', active: true },
  { type: 'event', name: 'Concert tickets',    emoji: '🎟️', currency: 'EUR', category: 'Personal', color: '#FF2B2B', active: true },
  { type: 'event', name: 'Family lunch',       emoji: '🥗', currency: 'EUR', category: 'Personal', color: '#84CC16', active: true },
  { type: 'event', name: 'Team standup',       emoji: '🧑‍💻', currency: 'EUR', category: 'Work',    color: '#0EA5E9', active: true },
  { type: 'event', name: 'Client call',        emoji: '📞', currency: 'EUR', category: 'Work',     color: '#1E40AF', active: true },
  { type: 'event', name: 'Date night',         emoji: '🌹', currency: 'EUR', category: 'Personal', color: '#DC2626', active: true },
  { type: 'event', name: 'Football match',     emoji: '⚽', currency: 'EUR', category: 'Personal', color: '#16A34A', active: true },
  { type: 'event', name: 'Beach day',          emoji: '🏖️', currency: 'EUR', category: 'Travel',   color: '#F59E0B', active: true },
  { type: 'event', name: 'Bookstore',          emoji: '📚', currency: 'EUR', category: 'Personal', color: '#7C3AED', active: true },
  { type: 'event', name: 'Cooking class',      emoji: '👨‍🍳', currency: 'EUR', category: 'Personal', color: '#F97316', active: true },
  { type: 'event', name: 'Hiking trip',        emoji: '🥾', currency: 'EUR', category: 'Travel',   color: '#15803D', active: true },
  { type: 'event', name: 'Art exhibition',     emoji: '🎨', currency: 'EUR', category: 'Personal', color: '#A855F7', active: true },
  { type: 'event', name: 'Therapy',            emoji: '💬', currency: 'EUR', category: 'Health',   color: '#0EA5E9', active: true },
]

const PAST_SUB_CHARGES: Array<{ name: string; emoji: string; price: number; category: string; color: string }> = [
  { name: 'Netflix',         emoji: '🎬', price: 15.99, category: 'Streaming',    color: '#E50914' },
  { name: 'HBO Max',         emoji: '🎞️', price: 9.99,  category: 'Streaming',    color: '#9333EA' },
  { name: 'Disney+',         emoji: '🏰', price: 8.99,  category: 'Streaming',    color: '#113CCF' },
  { name: 'Spotify',         emoji: '🎵', price: 9.99,  category: 'Music',        color: '#1DB954' },
  { name: 'Apple Music',     emoji: '🎧', price: 5.99,  category: 'Music',        color: '#FA243C' },
  { name: 'Xbox Game Pass',  emoji: '🕹️', price: 12.99, category: 'Gaming',       color: '#107C10' },
  { name: 'iCloud+',         emoji: '☁️', price: 2.99,  category: 'Cloud',        color: '#0071E3' },
  { name: 'Google One',      emoji: '📦', price: 2.99,  category: 'Cloud',        color: '#4285F4' },
  { name: 'GitHub Pro',      emoji: '🐙', price: 4.00,  category: 'Productivity', color: '#171515' },
  { name: 'Notion',          emoji: '📝', price: 10.00, category: 'Productivity', color: '#000000' },
  { name: 'Linear',          emoji: '📐', price: 8.00,  category: 'Productivity', color: '#5E6AD2' },
  { name: 'NYT',             emoji: '📰', price: 4.00,  category: 'News',         color: '#000000' },
  { name: 'Strava Premium',  emoji: '🏃', price: 5.99,  category: 'Fitness',      color: '#FC4C02' },
  { name: 'Headspace',       emoji: '🧘', price: 12.99, category: 'Fitness',      color: '#F47A1F' },
  { name: 'Duolingo Super',  emoji: '🦉', price: 6.99,  category: 'Education',    color: '#58CC02' },
  { name: 'Vodafone Fiber',  emoji: '📡', price: 39.99, category: 'Other',        color: '#E60000' },
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

// ─── Coverage notes ──────────────────────────────────────────────────────────

/**
 * Seed coverage targets:
 *
 *   Subscriptions: 18 active + 1 inactive (Gym) across 9 categories
 *     · Streaming   (3)  · Music       (2)  · Gaming      (2)
 *     · Cloud       (2)  · Productivity(4)  · News        (1)
 *     · Fitness     (2)  · Education   (1)  · Other       (1)
 *
 *   Apps: 5 (ChatGPT, 1Password, Raycast, Figma free, ProtonMail)
 *
 *   Events: 11 spread across this week / month / next-2-months,
 *           across Health, Personal, Work, Travel.
 *
 *   Tasks: 15 — 5 due today (mix of done/undone),
 *               5 this week, 2 later, 3 with no due date.
 *
 *   dueSubs (active, charge in 0–7 days): Netflix, HBO Max, Spotify,
 *       Linear, iCloud+, Apple Music. Gym is filtered (inactive).
 *
 *   Historical: 3 years of randomized past events (~6/month) + monthly
 *   historical charges for every PAST_SUB_CHARGES template — gives the
 *   year-in-dots heatmap and the line-trend chart plenty to plot.
 */
