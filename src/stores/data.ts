import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const defaultSettings = {
  defaultCurrency: 'EUR',
  coffeePrice: 4.50,
  theme: 'light',
  startOfWeek: 1,
  version: '0.1.0',
}

function makeEntry(item: any) {
  return {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function stampUpdate(item: any, patch: any) {
  return { ...item, ...patch, updatedAt: new Date().toISOString() }
}

export const useDataStore = create<any>()(
  persist(
    (set) => ({
      subscriptions: [],
      apps: [],
      events: [],
      tasks: [],
      settings: defaultSettings,

      addSubscription: (item: any) =>
        set((s: any) => ({ subscriptions: [...s.subscriptions, makeEntry(item)] })),
      addApp: (item: any) =>
        set((s: any) => ({ apps: [...s.apps, makeEntry(item)] })),
      addEvent: (item: any) =>
        set((s: any) => ({ events: [...s.events, makeEntry(item)] })),
      addTask: (item: any) =>
        set((s: any) => ({ tasks: [...s.tasks, makeEntry(item)] })),

      updateSubscription: (id: string, patch: any) =>
        set((s: any) => ({
          subscriptions: s.subscriptions.map((i: any) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),
      updateTask: (id: string, patch: any) =>
        set((s: any) => ({
          tasks: s.tasks.map((i: any) =>
            i.id === id ? stampUpdate(i, patch) : i
          ),
        })),

      removeSubscription: (id: string) =>
        set((s: any) => ({ subscriptions: s.subscriptions.filter((i: any) => i.id !== id) })),
      removeTask: (id: string) =>
        set((s: any) => ({ tasks: s.tasks.filter((i: any) => i.id !== id) })),

      updateSettings: (patch: any) =>
        set((s: any) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'track-data',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
