import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: string
}

interface ToastStore {
  items: Toast[]
  push: (message: string, type?: string, duration?: number) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push(message, type = 'info', duration = 2400) {
    const id = crypto.randomUUID()
    set(s => ({ items: [...s.items, { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ items: s.items.filter(t => t.id !== id) }))
    }, duration)
  },
  dismiss(id) {
    set(s => ({ items: s.items.filter(t => t.id !== id) }))
  },
}))
