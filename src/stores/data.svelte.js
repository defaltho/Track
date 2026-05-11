import { getCollection, saveCollection, getSettings, saveSettings } from '../utils/storage.js'

function createCollection(type) {
  let items = $state(getCollection(type))

  function add(item) {
    const entry = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    items = [...items, entry]
    saveCollection(type, items)
    return entry
  }

  function update(id, patch) {
    items = items.map(i =>
      i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i
    )
    saveCollection(type, items)
  }

  function remove(id) {
    items = items.filter(i => i.id !== id)
    saveCollection(type, items)
  }

  function reload() {
    items = getCollection(type)
  }

  return {
    get items() { return items },
    add,
    update,
    remove,
    reload,
  }
}

export const subscriptions = createCollection('subscriptions')
export const apps          = createCollection('apps')
export const events        = createCollection('events')
export const tasks         = createCollection('tasks')

let _settings = $state(getSettings())
export const settings = {
  get value() { return _settings },
  update(patch) {
    _settings = { ..._settings, ...patch }
    saveSettings(_settings)
  },
}
