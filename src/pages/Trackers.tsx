import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, FlatList, StyleSheet, Pressable,
} from 'react-native'
import { format, parseISO } from 'date-fns'
import { useTheme } from '../context/ThemeContext'
import { useDataStore } from '../stores/data'
import { useToastStore } from '../stores/toasts'
import { theme, CURRENCY_SYMBOL } from '../theme'
import { effectiveNextCharge } from '../utils/dates'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { AddTrackForm } from '../components/forms/AddTrackForm'
import { AddHabitForm } from '../components/forms/AddHabitForm'
import { AddTaskForm } from '../components/forms/AddTaskForm'
import { AddGoalForm } from '../components/forms/AddGoalForm'
import { todayStr } from '../utils/dates'
import { mask as maskVal } from '../utils/format'

// ── Constants ─────────────────────────────────────────────────────────────────
type Kind   = 'subscriptions' | 'apps' | 'events' | 'tasks' | 'habits' | 'goals'
type Filter = 'all' | Kind

const ACCENT: Record<Kind, string> = {
  subscriptions: '#0EA5E9',
  apps:          '#6366F1',
  events:        '#F59E0B',
  tasks:         '#22C55E',
  habits:        '#EC4899',
  goals:         '#8B5CF6',
}
const EMOJI: Record<Kind, string> = {
  subscriptions: '💳', apps: '📱', events: '📅', tasks: '✅', habits: '🔥', goals: '🎯',
}
const BADGE: Record<Kind, string> = {
  subscriptions: 'Sub', apps: 'App', events: 'Event', tasks: 'Task', habits: 'Habit', goals: 'Goal',
}
const FILTERS: { key: Filter; emoji: string; label: string }[] = [
  { key: 'all',           emoji: '',   label: 'All'    },
  { key: 'subscriptions', emoji: '💳', label: 'Subs'   },
  { key: 'apps',          emoji: '📱', label: 'Apps'   },
  { key: 'events',        emoji: '📅', label: 'Events' },
  { key: 'tasks',         emoji: '✅', label: 'Tasks'  },
  { key: 'habits',        emoji: '🔥', label: 'Habits' },
  { key: 'goals',         emoji: '🎯', label: 'Goals'  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function secondaryInfo(item: any, kind: Kind): string {
  if (kind === 'subscriptions') {
    if (!item.nextChargeDate) return item.billingCycle ?? ''
    const eff = item.billingCycle
      ? effectiveNextCharge(item.nextChargeDate, item.billingCycle)
      : item.nextChargeDate
    const overdue = eff < new Date().toISOString().split('T')[0]
    return overdue ? '⚠ Overdue' : `Next: ${eff}`
  }
  if (kind === 'apps')          return item.purchaseDate ?? ''
  if (kind === 'events')        return item.date ?? ''
  if (kind === 'tasks')         return item.done ? '✓ Done' : (item.dueDate ? `Due: ${item.dueDate}` : '')
  if (kind === 'habits')        return item.cadence ?? ''
  if (kind === 'goals') {
    const current = item.entries?.length > 0 ? item.entries[item.entries.length - 1].value : 0
    const pct = item.targetValue > 0 ? Math.round((current / item.targetValue) * 100) : 0
    const unit = item.unit ? ` ${item.unit}` : ''
    return `${current} / ${item.targetValue}${unit} · ${pct}%`
  }
  return ''
}

function priceInfo(item: any, kind: Kind): string {
  if ((kind === 'subscriptions' || kind === 'apps') && item.price != null) {
    const sym = CURRENCY_SYMBOL[item.currency as string] ?? item.currency ?? ''
    const cycle = kind === 'subscriptions' && item.billingCycle ? `/${item.billingCycle.slice(0, 2)}` : ''
    return `${sym}${Number(item.price).toFixed(2)}${cycle}`
  }
  return ''
}

function itemDate(item: any, kind: Kind): string | null {
  const safe = (v: any) => (v && typeof v === 'string' && v !== 'undefined' ? v : null)
  if (kind === 'subscriptions' || kind === 'apps') return safe(item.nextChargeDate) ?? safe(item.createdAt)
  if (kind === 'events') return safe(item.date)
  if (kind === 'tasks') return safe(item.dueDate)
  if (kind === 'habits') {
    const c = item.checkins
    return (c?.length > 0 ? safe(c[c.length - 1]) : null) ?? safe(item.createdAt)
  }
  if (kind === 'goals') return safe(item.deadline)
  return null
}

// ── ColHeader ─────────────────────────────────────────────────────────────────
function ColHeader({ colors }: { colors: any }) {
  return (
    <View style={[ch.row, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
      {/* Date offset: dateCol(36) + gap(8) + dot(8) + gap(8) + icon(30) + gap(8) = 98px */}
      <Text style={[ch.col, { color: colors.textFaint, width: 98 }]}>Date</Text>
      <Text style={[ch.col, { color: colors.textFaint, flex: 1 }]}>Item</Text>
      <Text style={[ch.col, { color: colors.textFaint, width: 88 }]}>Category</Text>
      <Text style={[ch.colRight, { color: colors.textFaint, width: 76 }]}>Amount</Text>
    </View>
  )
}
const ch = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.sp4, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  col:      { fontSize: 10, fontFamily: theme.fontMedium, textTransform: 'uppercase', letterSpacing: 0.7 },
  colRight: { fontSize: 10, fontFamily: theme.fontMedium, textTransform: 'uppercase', letterSpacing: 0.7, textAlign: 'right' },
})

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({ item, colors, onEdit, onRemove, onLog, onMenu, isPrivate }: {
  item: any; colors: any; isPrivate?: boolean
  onEdit: () => void; onRemove: () => void; onLog?: () => void; onMenu: () => void
}) {
  const { kind } = item
  const isOverdue = kind === 'subscriptions' && item.nextChargeDate && item.billingCycle
    ? effectiveNextCharge(item.nextChargeDate, item.billingCycle) < new Date().toISOString().split('T')[0]
    : false

  const sec   = secondaryInfo(item, kind)
  const price = maskVal(priceInfo(item, kind), isPrivate ?? false)

  const ds = itemDate(item, kind)
  let dayNum = '—', monthAbbr = ''
  if (ds) {
    try {
      const d = parseISO(ds)
      dayNum    = format(d, 'd')
      monthAbbr = format(d, 'MMM').toLowerCase()
    } catch {}
  }

  const kindColor = ACCENT[kind as Kind]
  const dateColor = isOverdue ? colors.danger : colors.text

  return (
    <View
      style={[
        ir.row,
        { backgroundColor: isOverdue ? colors.danger + '10' : colors.surface },
      ]}
    >
      {/* Date column */}
      <View style={ir.dateCol}>
        <Text style={[ir.dateDay, { color: dateColor }]}>{dayNum}</Text>
        <Text style={[ir.dateMo, { color: colors.textMuted }]}>{monthAbbr}</Text>
      </View>

      {/* Kind dot */}
      <View style={[ir.kindDot, { backgroundColor: kindColor + '22' }]}>
        <View style={[ir.kindDotInner, { backgroundColor: kindColor }]} />
      </View>

      {/* Emoji icon — neutral */}
      <View style={[ir.iconWrap, { backgroundColor: colors.surfaceEl }]}>
        <Text style={ir.emoji}>{item.emoji ?? EMOJI[kind as Kind]}</Text>
      </View>

      {/* Info */}
      <View style={ir.info}>
        <Text style={[ir.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[ir.meta, { color: colors.textFaint }]} numberOfLines={1}>
          {BADGE[kind as Kind]}{sec ? `  ·  ${sec}` : ''}
        </Text>
      </View>

      {/* Category column */}
      <Text style={[ir.catCol, { color: colors.textMuted }]} numberOfLines={1}>
        {(item.category as string | undefined) || '—'}
      </Text>

      {/* Amount */}
      <View style={ir.amountCol}>
        {price ? (
          <Text style={[ir.price, { color: isOverdue ? colors.danger : colors.text }]} numberOfLines={1}>
            {price}
          </Text>
        ) : null}
      </View>

      {/* ··· menu */}
      <Pressable onPress={onMenu} hitSlop={8} style={ir.dotsBtn}>
        <Text style={[ir.dotsText, { color: colors.textFaint }]}>···</Text>
      </Pressable>
    </View>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Trackers() {
  const { colors } = useTheme()
  const store = useDataStore()
  const toast = useToastStore()
  const isPrivate = store.settings.privacyMode ?? false

  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState<Filter>('all')
  const [activeTag,     setActiveTag]     = useState<string | null>(null)
  const [activeAccount, setActiveAccount] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; kind: Kind } | null>(null)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editKind, setEditKind] = useState<Kind | null>(null)
  const [logGoal,     setLogGoal]     = useState<any | null>(null)
  const [logValue,    setLogValue]    = useState('')
  const [showAddGoal,  setShowAddGoal]  = useState(false)
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [menuItem,     setMenuItem]   = useState<any | null>(null)
  const [showImport,   setShowImport] = useState(false)
  const [importText,   setImportText] = useState('')
  const [importError,  setImportError] = useState('')

  // Collect unique tags and accounts from the whole store for filter chips
  const allTags = useMemo(() => {
    const s = new Set<string>()
    const all = [...store.subscriptions, ...store.apps, ...store.events, ...store.tasks, ...(store.habits ?? []), ...(store.goals ?? [])]
    all.forEach(i => (i as any).tags?.forEach((t: string) => s.add(t)))
    return [...s].sort()
  }, [store.subscriptions, store.apps, store.events, store.tasks, store.habits, store.goals])

  const allAccountChips = useMemo(() => {
    const s = new Set<string>()
    const all = [...store.subscriptions, ...store.apps, ...store.events, ...store.tasks, ...(store.habits ?? []), ...(store.goals ?? [])]
    all.forEach(i => { const a = (i as any).account; if (a) s.add(a) })
    return [...s].sort()
  }, [store.subscriptions, store.apps, store.events, store.tasks, store.habits, store.goals])

  // Merge all items into a flat list with 'kind' tag
  const allItems = useMemo(() => {
    const q = search.toLowerCase()
    // Exclude auto-generated historical data — these are analytics-only records,
    // not real items the user should manage.
    const realSubs = store.subscriptions.filter(
      (s: any) => s.note !== 'Historical charge'
    )
    const realEvents = store.events.filter(
      (e: any) => e.note !== 'Historical event'
    )
    return [
      ...realSubs.map(s          => ({ ...s, kind: 'subscriptions' as const })),
      ...store.apps.map(a          => ({ ...a, kind: 'apps'          as const })),
      ...realEvents.map(e          => ({ ...e, kind: 'events'        as const })),
      ...store.tasks.map(t         => ({ ...t, kind: 'tasks'         as const })),
      ...(store.habits ?? []).map(h => ({ ...h, kind: 'habits'       as const })),
      ...(store.goals  ?? []).map(g => ({ ...g, kind: 'goals'        as const })),
    ]
      .filter(i => filter === 'all' || i.kind === filter)
      .filter(i => !q || i.name.toLowerCase().includes(q))
      .filter(i => !activeTag || (i as any).tags?.includes(activeTag))
      .filter(i => !activeAccount || (i as any).account === activeAccount)
  }, [store.subscriptions, store.apps, store.events, store.tasks, store.habits, store.goals, filter, search, activeTag, activeAccount])

  function handleImport() {
    try {
      const data = JSON.parse(importText)
      store.importData(data)
      setShowImport(false)
      setImportText('')
      setImportError('')
      toast.push('Data imported', 'success')
    } catch {
      setImportError('Invalid JSON — check the format.')
    }
  }

  function doRemove() {
    if (!deleteTarget) return
    const { id, name, kind } = deleteTarget
    if      (kind === 'subscriptions') store.removeSubscription(id)
    else if (kind === 'apps')          store.removeApp(id)
    else if (kind === 'events')        store.removeEvent(id)
    else if (kind === 'tasks')         store.removeTask(id)
    else if (kind === 'habits')        store.removeHabit(id)
    else if (kind === 'goals')         store.removeGoal(id)
    toast.push(`Removed ${name}`)
    setDeleteTarget(null)
  }

  function doEdit(data: any) {
    if (!editItem || !editKind) return
    const id = editItem.id
    if      (editKind === 'subscriptions') store.updateSubscription(id, data)
    else if (editKind === 'apps')          store.updateApp(id, data)
    else if (editKind === 'events')        store.updateEvent(id, data)
    else if (editKind === 'tasks')         store.updateTask(id, data)
    else if (editKind === 'habits')        store.updateHabit(id, data)
    else if (editKind === 'goals')         store.updateGoal(id, data)
    toast.push('Saved', 'success')
    setEditItem(null)
    setEditKind(null)
  }

  function closeEdit() { setEditItem(null); setEditKind(null) }

  function doAddGoal(data: any)  { store.addGoal(data);  toast.push('Goal added', 'success');  setShowAddGoal(false) }
  function doAddHabit(data: any) { store.addHabit(data); toast.push('Habit added', 'success'); setShowAddHabit(false) }

  const editTypeLabel = editKind
    ? ({ subscriptions: 'Subscription', apps: 'App', events: 'Event', tasks: 'Task', habits: 'Habit', goals: 'Goal' })[editKind]
    : ''

  return (
    <View style={[t.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[t.header, { borderBottomColor: colors.border }]}>
        <View style={t.headerTop}>
          <Text style={[t.title, { color: colors.text }]}>My Items</Text>
          <View style={[t.countPill, { backgroundColor: colors.surfaceEl }]}>
            <Text style={[t.countBadge, { color: colors.textMuted }]}>{allItems.length} items</Text>
          </View>
          <View style={{ flex: 1 }} />
          {(filter === 'goals' || filter === 'habits') && (
            <Pressable
              onPress={() => filter === 'goals' ? setShowAddGoal(true) : setShowAddHabit(true)}
              style={[t.addBtn, { backgroundColor: ACCENT[filter] + '22' }]}
              hitSlop={8}
            >
              <Text style={[t.addBtnTxt, { color: ACCENT[filter] }]}>+ New</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => { setShowImport(true); setImportText(''); setImportError('') }}
            style={[t.importBtn, { backgroundColor: colors.surfaceEl, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Text style={[t.importBtnTxt, { color: colors.text }]}>↑ Import</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[t.searchWrap, { backgroundColor: colors.surfaceEl, borderColor: colors.border }]}>
          <Text style={[t.searchIcon, { color: colors.textFaint }]}>🔍</Text>
          <TextInput
            style={[t.searchInput, { color: colors.text }]}
            placeholder="Search…"
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Filter tabs */}
        <View style={t.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key
            const accent = f.key !== 'all' ? ACCENT[f.key as Kind] : colors.accent
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  t.filterTab,
                  { backgroundColor: active ? accent + '22' : colors.surfaceEl,
                    borderColor:      active ? accent       : 'transparent' },
                ]}
              >
                <Text style={[t.filterLabel, { color: active ? accent : colors.textMuted }]}>
                  {f.emoji ? `${f.emoji} ${f.label}` : f.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <View style={t.chipsWrap}>
            <Text style={[t.chipsLabel, { color: colors.textFaint }]}>Tags</Text>
            <View style={t.filterRow}>
              {allTags.map(tag => {
                const active = activeTag === tag
                return (
                  <Pressable
                    key={tag}
                    onPress={() => setActiveTag(active ? null : tag)}
                    style={[t.filterTab, { backgroundColor: active ? colors.accent + '22' : colors.surfaceEl, borderColor: active ? colors.accent : 'transparent' }]}
                  >
                    <Text style={[t.filterLabel, { color: active ? colors.accent : colors.textMuted }]}>#{tag}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* Account chips */}
        {allAccountChips.length > 0 && (
          <View style={t.chipsWrap}>
            <Text style={[t.chipsLabel, { color: colors.textFaint }]}>Account</Text>
            <View style={t.filterRow}>
              {allAccountChips.map(acc => {
                const active = activeAccount === acc
                return (
                  <Pressable
                    key={acc}
                    onPress={() => setActiveAccount(active ? null : acc)}
                    style={[t.filterTab, { backgroundColor: active ? colors.accent + '22' : colors.surfaceEl, borderColor: active ? colors.accent : 'transparent' }]}
                  >
                    <Text style={[t.filterLabel, { color: active ? colors.accent : colors.textMuted }]}>{acc}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}
      </View>

      {/* List */}
      <FlatList
        data={allItems}
        keyExtractor={item => `${item.kind}-${item.id}`}
        contentContainerStyle={[t.list, { backgroundColor: colors.bg }]}
        style={{ backgroundColor: colors.bg }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={t.empty}>
            <Text style={[t.emptyTxt, { color: colors.textFaint }]}>
              {search ? `No items matching "${search}"` : 'Nothing here yet.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            colors={colors}
            isPrivate={isPrivate}
            onEdit={() => { setEditItem(item); setEditKind(item.kind) }}
            onRemove={() => setDeleteTarget({ id: item.id, name: item.name, kind: item.kind })}
            onLog={item.kind === 'goals' ? () => { setLogGoal(item); setLogValue('') } : undefined}
            onMenu={() => setMenuItem(item)}
          />
        )}
      />

      {/* ··· Action menu modal */}
      <Modal open={menuItem !== null} title="" onClose={() => setMenuItem(null)}>
        {menuItem && (
          <View style={[am.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[am.header, { borderBottomColor: colors.border }]}>
              <Text style={[am.headerTxt, { color: colors.textMuted }]}>Actions</Text>
            </View>

            {/* Edit */}
            <Pressable
              style={({ pressed }) => [am.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surfaceEl }]}
              onPress={() => { setEditItem(menuItem); setEditKind(menuItem.kind); setMenuItem(null) }}
            >
              <Text style={[am.label, { color: colors.text }]}>Edit</Text>
            </Pressable>

            {/* Kind-specific actions */}
            {(menuItem.kind === 'subscriptions' || menuItem.kind === 'apps') && (
              <Pressable
                style={({ pressed }) => [am.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surfaceEl }]}
                onPress={() => {
                  if (menuItem.kind === 'subscriptions') store.updateSubscription(menuItem.id, { active: !menuItem.active })
                  else store.updateApp(menuItem.id, { active: !menuItem.active })
                  toast.push(menuItem.active ? 'Marked inactive' : 'Marked active', 'success')
                  setMenuItem(null)
                }}
              >
                <Text style={[am.label, { color: colors.text }]}>{menuItem.active !== false ? 'Mark as inactive' : 'Mark as active'}</Text>
              </Pressable>
            )}
            {menuItem.kind === 'tasks' && (
              <Pressable
                style={({ pressed }) => [am.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surfaceEl }]}
                onPress={() => { store.updateTask(menuItem.id, { done: !menuItem.done }); toast.push(menuItem.done ? 'Marked pending' : 'Marked done', 'success'); setMenuItem(null) }}
              >
                <Text style={[am.label, { color: colors.text }]}>{menuItem.done ? 'Mark as pending' : 'Mark as done'}</Text>
              </Pressable>
            )}
            {menuItem.kind === 'habits' && (
              <Pressable
                style={({ pressed }) => [am.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surfaceEl }]}
                onPress={() => { store.toggleHabitCheckin(menuItem.id, new Date().toISOString().split('T')[0]); toast.push('Check-in toggled', 'success'); setMenuItem(null) }}
              >
                <Text style={[am.label, { color: colors.text }]}>Check in today</Text>
              </Pressable>
            )}
            {menuItem.kind === 'goals' && (
              <Pressable
                style={({ pressed }) => [am.row, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.surfaceEl }]}
                onPress={() => { setLogGoal(menuItem); setLogValue(''); setMenuItem(null) }}
              >
                <Text style={[am.label, { color: colors.text }]}>Log progress</Text>
              </Pressable>
            )}

            {/* Delete */}
            <Pressable
              style={({ pressed }) => [am.row, pressed && { backgroundColor: colors.surfaceEl }]}
              onPress={() => { setDeleteTarget({ id: menuItem.id, name: menuItem.name, kind: menuItem.kind }); setMenuItem(null) }}
            >
              <Text style={[am.label, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* Import modal */}
      <Modal open={showImport} title="Import Data" onClose={() => setShowImport(false)}>
        <View style={{ gap: theme.sp3 }}>
          <Text style={{ fontSize: theme.textXs, color: colors.textMuted, fontFamily: theme.fontRegular }}>
            Paste exported JSON (subscriptions, apps, events, tasks)
          </Text>
          <TextInput
            style={[t.importInput, { backgroundColor: colors.surfaceEl, borderColor: importError ? colors.danger : colors.border, color: colors.text }]}
            multiline
            numberOfLines={6}
            value={importText}
            onChangeText={v => { setImportText(v); setImportError('') }}
            placeholder="Paste JSON here…"
            placeholderTextColor={colors.textFaint}
          />
          {importError ? <Text style={{ fontSize: theme.textXs, color: colors.danger, fontFamily: theme.fontMedium }}>{importError}</Text> : null}
          <View style={{ flexDirection: 'row', gap: theme.sp3 }}>
            <Button label="Cancel" variant="secondary" size="md" onPress={() => setShowImport(false)} />
            <View style={{ flex: 1 }}>
              <Button label="Import" variant="primary" size="md" onPress={handleImport} fullWidth />
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm remove modal */}
      <Modal open={deleteTarget !== null} title="Remove item?" onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <View>
            <Text style={[t.confirmTxt, { color: colors.text }]}>
              Remove <Text style={{ fontFamily: theme.fontBold }}>{deleteTarget.name}</Text>?{'\n'}
              This will also update the Analytics charts and Calendar.
            </Text>
            <View style={t.confirmBtns}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" size="md" onPress={() => setDeleteTarget(null)} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Remove" variant="danger" size="md" onPress={doRemove} fullWidth />
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* Edit modals */}
      {editItem && (editKind === 'subscriptions' || editKind === 'apps' || editKind === 'events') && (
        <Modal open title={`Edit ${editTypeLabel}`} onClose={closeEdit}>
          <AddTrackForm
            initialValue={{
              ...editItem,
              type: editKind === 'subscriptions' ? 'subscription' : editKind === 'apps' ? 'app' : 'event',
            }}
            submitLabel="Save"
            onSubmit={doEdit}
            onCancel={closeEdit}
          />
        </Modal>
      )}
      {editItem && editKind === 'tasks' && (
        <Modal open title="Edit Task" onClose={closeEdit}>
          <AddTaskForm initialValue={editItem} submitLabel="Save" onSubmit={doEdit} onCancel={closeEdit} />
        </Modal>
      )}
      {editItem && editKind === 'habits' && (
        <Modal open title="Edit Habit" onClose={closeEdit}>
          <AddHabitForm initialValue={editItem} submitLabel="Save" onSubmit={doEdit} onCancel={closeEdit} />
        </Modal>
      )}
      {editItem && editKind === 'goals' && (
        <Modal open title="Edit Goal" onClose={closeEdit}>
          <AddGoalForm initialValue={editItem} submitLabel="Save" onSubmit={doEdit} onCancel={closeEdit} />
        </Modal>
      )}

      {/* Add new Goal / Habit */}
      <Modal open={showAddGoal} title="New Goal" onClose={() => setShowAddGoal(false)}>
        <AddGoalForm onSubmit={doAddGoal} onCancel={() => setShowAddGoal(false)} />
      </Modal>
      <Modal open={showAddHabit} title="New Habit" onClose={() => setShowAddHabit(false)}>
        <AddHabitForm onSubmit={doAddHabit} onCancel={() => setShowAddHabit(false)} />
      </Modal>

      {/* Log goal entry */}
      <Modal open={logGoal !== null} title={logGoal ? `Log · ${logGoal.name}` : 'Log'} onClose={() => setLogGoal(null)}>
        {logGoal && (
          <View style={{ gap: theme.sp4 }}>
            <Text style={{ color: '#8B5CF6', fontSize: 12, fontFamily: theme.fontMedium }}>
              Current: {logGoal.entries?.length > 0 ? logGoal.entries[logGoal.entries.length - 1].value : 0}
              {logGoal.unit ? ` ${logGoal.unit}` : ''} · Target: {logGoal.targetValue}{logGoal.unit ? ` ${logGoal.unit}` : ''}
            </Text>
            <TextInput
              style={[{ paddingHorizontal: theme.sp4, paddingVertical: theme.sp3, borderWidth: 1, borderRadius: theme.radiusLg, fontSize: theme.textSm, fontFamily: theme.fontRegular }, { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }]}
              value={logValue}
              onChangeText={setLogValue}
              placeholder={logGoal.unit ? `New value in ${logGoal.unit}` : 'New value'}
              keyboardType="numeric"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: theme.sp3 }}>
              <Button label="Cancel" variant="secondary" size="md" onPress={() => setLogGoal(null)} />
              <View style={{ flex: 1 }}>
                <Button label="Save" variant="primary" size="md" fullWidth onPress={() => {
                  const v = parseFloat(logValue)
                  if (!isNaN(v)) {
                    store.logGoalEntry(logGoal.id, { date: todayStr(), value: v })
                    toast.push('Progress logged', 'success')
                    setLogGoal(null)
                  }
                }} />
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ir = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: theme.sp4, borderRadius: theme.radiusMd, marginHorizontal: theme.sp4, marginVertical: 3 },
  dateCol:     { width: 36, alignItems: 'center', flexShrink: 0 },
  dateDay:     { fontSize: 15, fontFamily: theme.fontMonoBold, letterSpacing: -0.5, lineHeight: 18 },
  dateMo:      { fontSize: 9, fontFamily: theme.fontMono, letterSpacing: 0.2 },
  kindDot:     { width: 8, height: 8, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kindDotInner:{ width: 4, height: 4, borderRadius: 2 },
  iconWrap:    { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji:       { fontSize: 15 },
  info:        { flex: 1, gap: 2, minWidth: 0 },
  name:        { fontSize: theme.textSm, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
  meta:        { fontSize: 10, fontFamily: theme.fontRegular },
  catCol:      { width: 88, fontSize: 11, fontFamily: theme.fontRegular, flexShrink: 0 },
  amountCol:   { width: 76, alignItems: 'flex-end', flexShrink: 0 },
  price:       { fontSize: 12, fontFamily: theme.fontMonoBold, letterSpacing: -0.3 },
  dotsBtn:     { paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  dotsText:    { fontSize: 16, letterSpacing: 1, lineHeight: 20 },
})

const t = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: theme.sp4, paddingTop: theme.sp4, paddingBottom: theme.sp3, gap: theme.sp3, borderBottomWidth: StyleSheet.hairlineWidth },

  headerTop:  { flexDirection: 'row', alignItems: 'center', gap: theme.sp2 },
  title:      { fontSize: 28, fontFamily: theme.fontBlack, letterSpacing: -1 },
  countPill:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadge: { fontSize: theme.textXs, fontFamily: theme.fontMedium },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: theme.sp2, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, paddingVertical: 9, borderWidth: StyleSheet.hairlineWidth },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, fontSize: theme.textSm, fontFamily: theme.fontRegular, padding: 0 },

  filterRow:  { flexDirection: 'row', gap: theme.sp2, flexWrap: 'wrap' },
  filterTab:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  filterLabel:{ fontSize: 12, fontFamily: theme.fontMedium },
  chipsWrap:  { gap: theme.sp2 },
  chipsLabel: { fontSize: 10, fontFamily: theme.fontBold, textTransform: 'uppercase', letterSpacing: 0.4 },

  list:  { paddingTop: theme.sp3, paddingBottom: 120 },
  empty: { padding: theme.sp8, alignItems: 'center' },
  emptyTxt: { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center' },

  confirmTxt:  { fontSize: theme.textSm, lineHeight: 22, marginBottom: theme.sp5 },
  confirmBtns: { flexDirection: 'row', gap: theme.sp3 },

  addBtn:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  addBtnTxt:  { fontSize: theme.textXs, fontFamily: theme.fontBold, letterSpacing: 0.3 },
  importBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radiusMd, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 5 },
  importBtnTxt:{ fontSize: theme.textXs, fontFamily: theme.fontBold, letterSpacing: 0.3 },
  importInput:{ borderWidth: 1, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, paddingVertical: theme.sp3, fontSize: theme.textSm, fontFamily: theme.fontRegular, minHeight: 120, textAlignVertical: 'top' },
})

const am = StyleSheet.create({
  sheet:     { borderRadius: theme.radiusLg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header:    { paddingHorizontal: theme.sp4, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTxt: { fontSize: 11, fontFamily: theme.fontBold, textTransform: 'uppercase', letterSpacing: 0.8 },
  row:       { paddingHorizontal: theme.sp4, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  label:     { fontSize: theme.textBase, fontFamily: theme.fontMedium },
})
