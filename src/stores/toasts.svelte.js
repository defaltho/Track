let items = $state([])

export const toasts = {
  get items() { return items },
  push(message, type = 'info', duration = 2400) {
    const id = crypto.randomUUID()
    items = [...items, { id, message, type }]
    setTimeout(() => {
      items = items.filter(t => t.id !== id)
    }, duration)
  },
  dismiss(id) {
    items = items.filter(t => t.id !== id)
  },
}
