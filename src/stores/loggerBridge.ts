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
    origError(...args)
  }

  console.warn = (...args: unknown[]) => {
    try {
      const { message, context } = stringify(args)
      logger.warn(message, context)
    } catch { /* never let the bridge itself crash */ }
    origWarn(...args)
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
