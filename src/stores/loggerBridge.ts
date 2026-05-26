import { Platform } from 'react-native'
import { logger } from './logger'

// One-time bridge that mirrors console.error / console.warn into the in-app
// logger store, plus catches uncaught errors via the global handler when
// available (React Native). Idempotent — calling it more than once is a no-op.
let installed = false

function stringify(args: unknown[]): { message: string; context?: string } {
  const parts = args.map(a => {
    if (a instanceof Error) return a.stack || a.message
    if (typeof a === 'string') return a
    try { return JSON.stringify(a) } catch { return String(a) }
  })
  const [first, ...rest] = parts
  return {
    message: first ?? '(empty)',
    context: rest.length > 0 ? rest.join(' ') : undefined,
  }
}

export function setupLoggerBridge(): void {
  if (installed) return
  installed = true

  const origError = console.error.bind(console)
  const origWarn  = console.warn.bind(console)

  console.error = (...args: unknown[]) => {
    try {
      const { message, context } = stringify(args)
      logger.error(message, context)
    } catch { /* never let the bridge itself crash */ }
    if (Platform.OS !== 'web') origError(...args)
  }

  console.warn = (...args: unknown[]) => {
    try {
      const { message, context } = stringify(args)
      logger.warn(message, context)
    } catch { /* never let the bridge itself crash */ }
    if (Platform.OS !== 'web') origWarn(...args)
  }

  // Web-only: intercept window errors to route to ErrorLog instead of the
  // Metro dev overlay. Capture phase + stopImmediatePropagation ensures our
  // handler runs before Metro's bubble-phase listener, suppressing the badge.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      try {
        const err = event.error
        logger.error(
          err?.message ?? event.message ?? 'Unknown error',
          err?.stack ?? `at ${event.filename}:${event.lineno}:${event.colno}`,
        )
      } catch { /* never crash */ }
      event.preventDefault()
      event.stopImmediatePropagation()
    }, true)

    window.addEventListener('unhandledrejection', (event) => {
      try {
        const err = event.reason
        logger.error(err?.message ?? String(err), err?.stack)
      } catch { /* never crash */ }
      event.preventDefault()
    })
  }

  // React Native global error handler (no-op on web)
  const g: any = globalThis as any
  if (g.ErrorUtils && typeof g.ErrorUtils.setGlobalHandler === 'function') {
    const prevHandler = g.ErrorUtils.getGlobalHandler?.()
    g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try {
        const msg = error?.message || String(error)
        const ctx = (isFatal ? '[FATAL] ' : '') + (error?.stack || '')
        logger.error(msg, ctx || undefined)
      } catch { /* never crash */ }
      if (typeof prevHandler === 'function') prevHandler(error, isFatal)
    })
  }
}
