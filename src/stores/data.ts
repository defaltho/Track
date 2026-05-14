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
  purchaseDate?: string
  paymentMethod?: string
  note?: string
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
  createdAt: string
  updatedAt: string
}

interface Settings {
  defaultCurrency: string
  coffeePrice: number
  theme: string
  startOfWeek: number
  version: string
}

interface DataStore {
  subscriptions: Subscription[]
  apps: AppEntry[]
  events: EventEntry[]
  tasks: Task[]
  settings: Settings

  addSubscription: (item: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void
  addApp: (item: Omit<AppEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  addEvent: (item: Omit<EventEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  addTask: (item: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void

  updateSubscription: (id: string, patch: Partial<Omit<Subscription, 'id' | 'createdAt'>>) => void
  updateApp: (id: string, patch: Partial<Omit<AppEntry, 'id' | 'createdAt'>>) => void
  updateEvent: (id: string, patch: Partial<Omit<EventEntry, 'id' | 'createdAt'>>) => void
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void

  removeSubscription: (id: string) => void
  removeApp: (id: string) => void
  removeEvent: (id: string) => void
  removeTask: (id: string) => void

  updateSettings: (patch: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  defaultCurrency: 'EUR',
  coffeePrice: 4.50,
  theme: 'light',
  startOfWeek: 1,
  version: '0.1.0',
}

// BUG M4 fix: fallback UUID generator when crypto.randomUUID is unavailable
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
      settings: defaultSettings,

      addSubscription: (item) =>
        set((s) => ({ subscriptions: [...s.subscriptions, makeEntry(item) as Subscription] })),
      addApp: (item) =>
        set((s) => ({ apps: [...s.apps, makeEntry(item) as AppEntry] })),
      addEvent: (item) =>
        set((s) => ({ events: [...s.events, makeEntry(item) as EventEntry] })),
      addTask: (item) =>
        set((s) => ({ tasks: [...s.tasks, makeEntry(item) as Task] })),

      updateSubscription: (id, patch) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      // BUG M5 fix: added updateApp
      updateApp: (id, patch) =>
        set((s) => ({
          apps: s.apps.map((i) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      // BUG M5 fix: added updateEvent
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

      removeSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.filter((i) => i.id !== id) })),
      // BUG M5 fix: added removeApp
      removeApp: (id) =>
        set((s) => ({ apps: s.apps.filter((i) => i.id !== id) })),
      // BUG M5 fix: added removeEvent
      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((i) => i.id !== id) })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((i) => i.id !== id) })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'track-data',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
