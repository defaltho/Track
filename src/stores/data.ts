import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Subscription {
  id: string
  type: 'subscription'
  name: string
  emoji: string
  price: number
  billingCycle: 'monthly' | 'yearly' | 'weekly'
  currency: string
  category: string
  color: string
  active: boolean
  nextChargeDate: string
  startDate?: string
  purchaseDate?: string
  paymentMethod?: string
  account?: string
  note?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  name: string
  emoji: string
  targetValue: number
  unit: string
  entries: { date: string; value: number }[]
  deadline?: string
  category?: string
  color?: string
  note?: string
  tags?: string[]
  account?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Habit {
  id: string
  name: string
  emoji: string
  cadence: 'daily' | 'weekly'
  checkins: string[]
  category?: string
  color?: string
  note?: string
  tags?: string[]
  account?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  name: string
  done: boolean
  dueDate?: string | null
  priority: 'low' | 'medium' | 'high'
  category: string
  note?: string
  amount?: number | null
  currency?: string | null
  account?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface AppEntry {
  id: string
  type: 'app'
  name: string
  emoji: string
  price: number
  billingCycle: 'monthly' | 'yearly' | 'weekly'
  currency: string
  category: string
  color: string
  active: boolean
  nextChargeDate: string
  purchaseDate?: string
  paymentMethod?: string
  account?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface EventEntry {
  id: string
  type: 'event'
  name: string
  emoji: string
  date: string
  currency: string
  category: string
  color: string
  active: boolean
  note?: string
  tags?: string[]
  account?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  category: string
  amount: number
  period: 'monthly' | 'yearly'
}

interface Settings {
  defaultCurrency: string
  coffeePrice: number
  monthlyBudget: number | null
  theme: string
  startOfWeek: number
  version: string
  devMode: boolean
  customCategories: string[]
  customAccounts: string[]
  privacyMode: boolean
  seeded: boolean
}

interface DataStore {
  subscriptions: Subscription[]
  apps: AppEntry[]
  events: EventEntry[]
  tasks: Task[]
  habits: Habit[]
  goals: Goal[]
  budgets: Budget[]
  settings: Settings
  widgetOrder: string[]
  flippedWidgets: string[]

  addSubscription: (item: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void
  addApp: (item: Omit<AppEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  addEvent: (item: Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  addTask: (item: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  addHabit: (item: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void
  addGoal: (item: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void
  addBudget: (item: Omit<Budget, 'id'>) => void

  updateSubscription: (id: string, patch: Partial<Omit<Subscription, 'id' | 'createdAt'>>) => void
  updateApp: (id: string, patch: Partial<Omit<AppEntry, 'id' | 'createdAt'>>) => void
  updateEvent: (id: string, patch: Partial<Omit<EventEntry, 'id' | 'createdAt'>>) => void
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  updateHabit: (id: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void
  updateBudget: (id: string, patch: Partial<Omit<Budget, 'id'>>) => void

  removeSubscription: (id: string) => void
  removeApp: (id: string) => void
  removeEvent: (id: string) => void
  removeTask: (id: string) => void
  removeHabit: (id: string) => void
  removeGoal: (id: string) => void
  removeBudget: (id: string) => void

  toggleHabitCheckin: (id: string, dateISO: string) => void
  logGoalEntry: (id: string, entry: { date: string; value: number }) => void

  updateSettings: (patch: Partial<Settings>) => void
  setWidgetLayout: (order: string[], flipped: string[]) => void
  clearAll: () => void
  importData: (data: Partial<{ subscriptions: Subscription[]; apps: AppEntry[]; events: EventEntry[]; tasks: Task[]; habits: Habit[]; goals: Goal[] }>) => void
}

const defaultSettings: Settings = {
  defaultCurrency: 'EUR',
  coffeePrice: 4.50,
  monthlyBudget: null,
  theme: 'auto',
  startOfWeek: 1,
  version: '0.1.0',
  devMode: false,
  customCategories: [],
  customAccounts: [],
  privacyMode: false,
  seeded: false,
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Simple UUID v4 fallback using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function makeEntry<T extends object>(item: T) {
  return {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function stampUpdate<T extends object>(item: T, patch: object): T {
  return { ...item, ...patch, updatedAt: new Date().toISOString() } as T
}

export const useDataStore = create<DataStore>()(
  persist(
    (set) => ({
      subscriptions: [],
      apps: [],
      events: [],
      tasks: [],
      habits: [],
      goals: [],
      budgets: [],
      settings: defaultSettings,
      widgetOrder: [],
      flippedWidgets: [],

      addSubscription: (item) =>
        set((s) => ({ subscriptions: [...s.subscriptions, makeEntry(item) as Subscription] })),
      addApp: (item) =>
        set((s) => ({ apps: [...s.apps, makeEntry(item) as AppEntry] })),
      addEvent: (item) =>
        set((s) => ({ events: [...s.events, makeEntry(item) as EventEntry] })),
      addTask: (item) =>
        set((s) => ({ tasks: [...s.tasks, makeEntry(item) as Task] })),
      addHabit: (item) =>
        set((s) => ({ habits: [...s.habits, makeEntry(item) as Habit] })),
      addGoal: (item) =>
        set((s) => ({ goals: [...s.goals, makeEntry(item) as Goal] })),
      addBudget: (item) =>
        set((s) => ({ budgets: [...s.budgets, { ...item, id: generateId() }] })),

      updateSubscription: (id, patch) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      updateApp: (id, patch) =>
        set((s) => ({
          apps: s.apps.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      updateEvent: (id, patch) =>
        set((s) => ({
          events: s.events.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? stampUpdate(g, patch) : g
          ),
        })),
      updateBudget: (id, patch) =>
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? { ...b, ...patch } : b
          ),
        })),

      toggleHabitCheckin: (id, dateISO) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const exists = h.checkins.includes(dateISO)
            const nextCheckins = exists
              ? h.checkins.filter((d) => d !== dateISO)
              : [...h.checkins, dateISO].sort()
            return stampUpdate(h, { checkins: nextCheckins })
          }),
        })),

      removeSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.filter((i) => i.id !== id) })),
      removeApp: (id) =>
        set((s) => ({ apps: s.apps.filter((i) => i.id !== id) })),
      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((i) => i.id !== id) })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((i) => i.id !== id) })),
      removeHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((i) => i.id !== id) })),
      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      removeBudget: (id) =>
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      logGoalEntry: (id, entry) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id) return g
            return stampUpdate(g, { entries: [...g.entries, entry] })
          }),
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setWidgetLayout: (order, flipped) =>
        set(() => ({ widgetOrder: order, flippedWidgets: flipped })),

      clearAll: () =>
        set(() => ({ subscriptions: [], apps: [], events: [], tasks: [], habits: [], goals: [] })),

      importData: (data) =>
        set((s) => ({
          subscriptions: data.subscriptions ?? s.subscriptions,
          apps: data.apps ?? s.apps,
          events: data.events ?? s.events,
          tasks: data.tasks ?? s.tasks,
          habits: data.habits ?? s.habits,
          goals: data.goals ?? s.goals,
        })),
    }),
    {
      name: 'track-data',
      storage: createJSONStorage(() => AsyncStorage),
      version: 7,
      migrate: (persisted: any, fromVersion: number) => {
        let s = persisted as any
        if (fromVersion < 1) {
          s = { ...s, habits: s.habits ?? [] }
        }
        if (fromVersion < 2) {
          s = {
            ...s,
            settings: {
              ...defaultSettings,
              ...s.settings,
              customCategories: s.settings?.customCategories ?? [],
              customAccounts:   s.settings?.customAccounts   ?? [],
              startOfWeek:      s.settings?.startOfWeek      ?? 1,
            },
          }
        }
        if (fromVersion < 3) {
          s = { ...s, goals: s.goals ?? [] }
        }
        if (fromVersion < 4) {
          s = {
            ...s,
            events: (s.events ?? []).map((e: any) => ({ tags: [], account: '', ...e })),
            habits: (s.habits ?? []).map((h: any) => ({ account: '', ...h })),
            goals:  (s.goals  ?? []).map((g: any) => ({ account: '', ...g })),
          }
        }
        if (fromVersion < 5) {
          s = {
            ...s,
            budgets: s.budgets ?? [],
            settings: { ...defaultSettings, ...s.settings, privacyMode: s.settings?.privacyMode ?? false },
          }
        }
        if (fromVersion < 6) {
          s = {
            ...s,
            settings: { ...s.settings, seeded: (s.subscriptions?.length ?? 0) > 0 },
          }
        }
        if (fromVersion < 7) {
          const HIST_SUB_NAMES = new Set([
            'Netflix', 'HBO Max', 'Disney+', 'Spotify', 'Apple Music', 'Xbox Game Pass',
            'iCloud+', 'Google One', 'GitHub Pro', 'Notion', 'Linear', 'NYT',
            'Strava Premium', 'Headspace', 'Duolingo Super', 'Vodafone Fiber',
          ])
          const HIST_EVT_NAMES = new Set([
            'Coffee with Ana', 'Gym session', 'Dentist check-up', 'Movie night', 'Run',
            'Dinner out', 'Concert', 'Doctor visit', 'Birthday party', 'Yoga class',
            'Concert tickets', 'Family lunch', 'Team standup', 'Client call', 'Date night',
            'Football match', 'Beach day', 'Bookstore', 'Cooking class', 'Hiking trip',
            'Art exhibition', 'Therapy',
          ])
          const today = new Date().toISOString().split('T')[0]
          s = {
            ...s,
            subscriptions: (s.subscriptions ?? []).map((sub: any) => {
              if (!sub.active && sub.nextChargeDate < today && HIST_SUB_NAMES.has(sub.name) && !sub.note) {
                return { ...sub, note: 'Historical charge' }
              }
              return sub
            }),
            events: (s.events ?? []).map((evt: any) => {
              if (evt.date < today && HIST_EVT_NAMES.has(evt.name) && evt.note === undefined) {
                return { ...evt, note: 'Historical event' }
              }
              return evt
            }),
          }
        }
        return s
      },
    }
  )
)
