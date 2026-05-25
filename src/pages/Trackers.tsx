import React, { useState, useMemo } from 'react'
import {
  View, Text, TextInput, FlatList, StyleSheet, Pressable,
} from 'react-native'
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

// ── Constants ─────────────────────────────────────────────────────────────────
type Kind   = 'subscriptions' | 'apps' | 'events' | 'tasks' | 'habits'
type Filter = 'all' | Kind

const ACCENT: Record<Kind, string> = {
  subscriptions: '#0EA5E9',
  apps:          '#6366F1',
  events:        '#F59E0B',
  tasks:         '#22C55E',
  habits:        '#EC4899',
}
const EMOJI: Record<Kind, string> = {
  subscriptions: '💳', apps: '📱', events: '📅', tasks: '✅', habits: '🔥',
}
const BADGE: Record<Kind, string> = {
  subscriptions: 'Sub', apps: 'App', events: 'Event', tasks: 'Task', habits: 'Habit',
}
const FILTERS: { key: Filter; emoji: string; label: string }[] = [
  { key: 'all',           emoji: '',   label: 'All'    },
  { key: 'subscriptions', emoji: '💳', label: 'Subs'   },
  { key: 'apps',          emoji: '📱', label: 'Apps'   },
  { key: 'events',        emoji: '📅', label: 'Events' },
  { key: 'tasks',         emoji: '✅', label: 'Tasks'  },
  { key: 'habits',        emoji: '🔥', label: 'Habits' },
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

// ── ItemRow ───────────────────────────────────────────────────────────────────
function ItemRow({ item, colors, onEdit, onRemove }: {
  item: any; colors: any
  onEdit: () => void; onRemove: () => void
}) {
  const { kind } = item
  const isOverdue = kind === 'subscriptions' && item.nextChargeDate && item.billingCycle
    ? effectiveNextCharge(item.nextChargeDate, item.billingCycle) < new Date().toISOString().split('T')[0]
    : false
  const accent = isOverdue ? (colors.danger ?? '#EF4444') : ACCENT[kind as Kind]
  const sec    = secondaryInfo(item, kind)
  const price  = priceInfo(item, kind)

  return (
    <View style={[ir.row, { borderBottomColor: colors.border }]}>
      <View style={[ir.accentBar, { backgroundColor: accent }]} />
      <View style={[ir.iconWrap, { backgroundColor: accent + '18' }]}>
        <Text style={ir.emoji}>{item.emoji ?? EMOJI[kind as Kind]}</Text>
      </View>
      <View style={ir.info}>
        <View style={ir.nameRow}>
          <Text style={[ir.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <View style={[ir.badge, { backgroundColor: accent + '22' }]}>
            <Text style={[ir.badgeTxt, { color: accent }]}>{BADGE[kind as Kind]}</Text>
          </View>
        </View>
        <View style={ir.metaRow}>
          {sec ? <Text style={[ir.meta, { color: colors.textMuted }]}>{sec}</Text> : null}
          {price ? <Text style={[ir.price, { color: colors.text }]}>{price}</Text> : null}
        </View>
      </View>
      <View style={ir.actions}>
        <Pressable onPress={onEdit} style={[ir.btn, { backgroundColor: colors.surfaceEl }]} hitSlop={8}>
          <Text style={[ir.btnTxt, { color: colors.text }]}>✏️</Text>
        </Pressable>
        <Pressable onPress={onRemove} style={[ir.btn, { backgroundColor: '#EF44441A' }]} hitSlop={8}>
          <Text style={[ir.btnTxt, { color: '#EF4444' }]}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Trackers() {
  const { colors } = useTheme()
  const store = useDataStore()
  const toast = useToastStore()

  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState<Filter>('all')
  const [confirm,  setConfirm]  = useState<{ id: string; name: string; kind: Kind } | null>(null)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editKind, setEditKind] = useState<Kind | null>(null)

  // Merge all items into a flat list with 'kind' tag
  const allItems = useMemo(() => {
    const q = search.toLowerCase()
    // Deduplicate subscriptions by name (active first, so active one wins over historical charges)
    const seenSubs = new Set<string>()
    const uniqueSubs = [...store.subscriptions]
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0) || a.name.localeCompare(b.name))
      .filter(s => { if (seenSubs.has(s.name)) return false; seenSubs.add(s.name); return true })
    return [
      ...uniqueSubs.map(s         => ({ ...s, kind: 'subscriptions' as const })),
      ...store.apps.map(a          => ({ ...a, kind: 'apps'          as const })),
      ...store.events.map(e        => ({ ...e, kind: 'events'        as const })),
      ...store.tasks.map(t         => ({ ...t, kind: 'tasks'         as const })),
      ...(store.habits ?? []).map(h => ({ ...h, kind: 'habits'       as const })),
    ]
      .filter(i => filter === 'all' || i.kind === filter)
      .filter(i => !q || i.name.toLowerCase().includes(q))
  }, [store.subscriptions, store.apps, store.events, store.tasks, store.habits, filter, search])

  function doRemove() {
    if (!confirm) return
    const { id, name, kind } = confirm
    if      (kind === 'subscriptions') store.removeSubscription(id)
    else if (kind === 'apps')          store.removeApp(id)
    else if (kind === 'events')        store.removeEvent(id)
    else if (kind === 'tasks')         store.removeTask(id)
    else if (kind === 'habits')        store.removeHabit(id)
    toast.push(`Removed ${name}`)
    setConfirm(null)
  }

  function doEdit(data: any) {
    if (!editItem || !editKind) return
    const id = editItem.id
    if      (editKind === 'subscriptions') store.updateSubscription(id, data)
    else if (editKind === 'apps')          store.updateApp(id, data)
    else if (editKind === 'events')        store.updateEvent(id, data)
    else if (editKind === 'tasks')         store.updateTask(id, data)
    else if (editKind === 'habits')        store.updateHabit(id, data)
    toast.push('Saved', 'success')
    setEditItem(null)
    setEditKind(null)
  }

  function closeEdit() { setEditItem(null); setEditKind(null) }

  const editTypeLabel = editKind
    ? ({ subscriptions: 'Subscription', apps: 'App', events: 'Event', tasks: 'Task', habits: 'Habit' })[editKind]
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
      </View>

      {/* List */}
      <FlatList
        data={allItems}
        keyExtractor={item => `${item.kind}-${item.id}`}
        contentContainerStyle={t.list}
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
            onEdit={() => { setEditItem(item); setEditKind(item.kind) }}
            onRemove={() => setConfirm({ id: item.id, name: item.name, kind: item.kind })}
          />
        )}
      />

      {/* Confirm remove modal */}
      <Modal open={confirm !== null} title="Remove item?" onClose={() => setConfirm(null)}>
        {confirm && (
          <View>
            <Text style={[t.confirmTxt, { color: colors.text }]}>
              Remove <Text style={{ fontFamily: theme.fontBold }}>{confirm.name}</Text>?{'\n'}
              This will also update the Analytics charts and Calendar.
            </Text>
            <View style={t.confirmBtns}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" size="md" onPress={() => setConfirm(null)} fullWidth />
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
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ir = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: theme.sp4, borderBottomWidth: StyleSheet.hairlineWidth },
  accentBar: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 2, flexShrink: 0 },
  iconWrap:{ width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji:   { fontSize: 18 },
  info:    { flex: 1, gap: 3, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:    { fontSize: theme.textSm, fontFamily: theme.fontMedium, flexShrink: 1 },
  badge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  badgeTxt:{ fontSize: 9, fontFamily: theme.fontBold, letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  meta:    { fontSize: 11, fontFamily: theme.fontRegular },
  price:   { fontSize: 11, fontFamily: theme.fontMonoBold, letterSpacing: -0.2 },
  actions: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  btn:     { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  btnTxt:  { fontSize: 15 },
})

const t = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: theme.sp4, paddingTop: theme.sp4, paddingBottom: theme.sp3, gap: theme.sp3, borderBottomWidth: StyleSheet.hairlineWidth },

  headerTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:      { fontSize: 28, fontFamily: theme.fontBlack, letterSpacing: -1 },
  countPill:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadge: { fontSize: theme.textXs, fontFamily: theme.fontMedium },

  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: theme.sp2, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, paddingVertical: 9, borderWidth: StyleSheet.hairlineWidth },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, fontSize: theme.textSm, fontFamily: theme.fontRegular, padding: 0 },

  filterRow:  { flexDirection: 'row', gap: theme.sp2, flexWrap: 'wrap' },
  filterTab:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  filterLabel:{ fontSize: 12, fontFamily: theme.fontMedium },

  list:  { paddingBottom: 120 },
  empty: { padding: theme.sp8, alignItems: 'center' },
  emptyTxt: { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center' },

  confirmTxt:  { fontSize: theme.textSm, lineHeight: 22, marginBottom: theme.sp5 },
  confirmBtns: { flexDirection: 'row', gap: theme.sp3 },
})
