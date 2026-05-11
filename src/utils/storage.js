const KEYS = {
  subscriptions: 'track_subscriptions',
  apps:          'track_apps',
  events:        'track_events',
  tasks:         'track_tasks',
  settings:      'track_settings',
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getCollection(type) {
  return load(KEYS[type]) ?? []
}

export function saveCollection(type, items) {
  save(KEYS[type], items)
}

export function getSettings() {
  return load(KEYS.settings) ?? {
    defaultCurrency: 'EUR',
    coffeePrice: 4.50,
    theme: 'light',
    startOfWeek: 1,
    version: '0.1.0',
  }
}

export function saveSettings(settings) {
  save(KEYS.settings, settings)
}

export function exportAll() {
  return {
    version: '0.1.0',
    exportedAt: new Date().toISOString(),
    subscriptions: getCollection('subscriptions'),
    apps:          getCollection('apps'),
    events:        getCollection('events'),
    tasks:         getCollection('tasks'),
    settings:      getSettings(),
  }
}

export function importAll(data) {
  if (data.subscriptions) saveCollection('subscriptions', data.subscriptions)
  if (data.apps)          saveCollection('apps', data.apps)
  if (data.events)        saveCollection('events', data.events)
  if (data.tasks)         saveCollection('tasks', data.tasks)
  if (data.settings)      saveSettings(data.settings)
}
