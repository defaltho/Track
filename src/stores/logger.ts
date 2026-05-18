import { create } from 'zustand'

export type LogLevel = 'error' | 'warn' | 'info'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  context?: string
}

interface LoggerStore {
  entries: LogEntry[]
  log: (level: LogLevel, message: string, context?: string) => void
  clear: () => void
}

const MAX_ENTRIES = 100

export const useLoggerStore = create<LoggerStore>((set, get) => ({
  entries: [],

  log(level, message, context) {
    const id = Math.random().toString(36).slice(2)
    const timestamp = new Date().toISOString()
    const entry: LogEntry = { id, timestamp, level, message, ...(context ? { context } : {}) }
    set(s => ({
      entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
    }))
  },

  clear() {
    set({ entries: [] })
  },
}))

export const logger = {
  error: (message: string, context?: string) => useLoggerStore.getState().log('error', message, context),
  warn:  (message: string, context?: string) => useLoggerStore.getState().log('warn',  message, context),
  info:  (message: string, context?: string) => useLoggerStore.getState().log('info',  message, context),
}
