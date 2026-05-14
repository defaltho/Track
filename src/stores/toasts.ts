import { create } from 'zustand'

// BUG L5 fix: cap the toast queue to prevent unbounded growth
const MAX_TOASTS = 5

interface Toast {
  id: string
  message: string
  type: string
  // BUG M10 fix: store the timer ref alongside the toast so dismiss can clear it
  timer: ReturnType<typeof setTimeout>
}

interface ToastStore {
  items: Omit<Toast, 'timer'>[]
  push: (message: string, type?: string, duration?: number) => void
  dismiss: (id: string) => void
}

// Internal map to hold timer references by toast id
const timers = new Map<string, ReturnType<typeof setTimeout>>()

export const useToastStore = create<ToastStore>((set, get) => ({
  items: [],

  push(message, type = 'info', duration = 2400) {
    // BUG L5 fix: do not add if already at MAX_TOASTS
    if (get().items.length >= MAX_TOASTS) return

    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

    set(s => ({ items: [...s.items, { id, message, type }] }))

    // BUG M10 fix: store the timer reference so dismiss can clear it
    const timer = setTimeout(() => {
      timers.delete(id)
      set(s => ({ items: s.items.filter(t => t.id !== id) }))
    }, duration)
    timers.set(id, timer)
  },

  dismiss(id) {
    // BUG M10 fix: clear the pending auto-dismiss timer before removing
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    set(s => ({ items: s.items.filter(t => t.id !== id) }))
  },
}))
