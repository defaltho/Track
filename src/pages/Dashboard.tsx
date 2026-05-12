import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { useDataStore } from '../stores/data'
import { useToastStore } from '../stores/toasts'
import { totalMonthlySpend, coffees } from '../utils/calculations'
import { buildSpendingTimeline, pointsToPath, RANGE_DAYS } from '../utils/chart'
import { Modal } from '../components/ui/Modal'
import { AddTrackForm } from '../components/forms/AddTrackForm'
import { AddTaskForm } from '../components/forms/AddTaskForm'
import { theme, CURRENCY_SYMBOL } from '../theme'

export function Dashboard() {
  const store = useDataStore()
  const toast = useToastStore()

  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const month = format(now, 'yyyy-MM')

  const currency = store.settings.defaultCurrency ?? 'EUR'
  const symbol = CURRENCY_SYMBOL[currency] ?? ''

  const monthly = useMemo(() => totalMonthlySpend(store.subscriptions), [store.subscriptions])
  const coffeeCount = useMemo(() => coffees(monthly), [monthly])
  const monthEvents = useMemo(
    () => store.events.filter((e: any) => e.date?.startsWith(month)),
    [store.events, month]
  )
  const todayTasks = useMemo(
    () => store.tasks.filter((t: any) => t.dueDate === today),
    [store.tasks, today]
  )
  const dueSubs = useMemo(
    () =>
      store.subscriptions.filter((s: any) => {
        const diff = differenceInCalendarDays(parseISO(s.nextChargeDate), now)
        return diff >= 0 && diff <= 7
      }),
    [store.subscriptions]
  )
  const hasToday = dueSubs.length > 0 || todayTasks.length > 0

  const [timeRange, setTimeRange] = useState('1Y')
  const timeline = useMemo(
    () => buildSpendingTimeline(store.subscriptions, RANGE_DAYS[timeRange]),
    [store.subscriptions, timeRange]
  )
  const path = useMemo(() => pointsToPath(timeline, 300, 80), [timeline])

  const [showAddTrack, setShowAddTrack] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [confirm, setConfirm] = useState<{ kind: string; id: string; name: string } | null>(null)

  function handleAddTrack(data: any) {
    if (data.type === 'subscription') { store.addSubscription(data); toast.push('Subscription added', 'success') }
    else if (data.type === 'app') { store.addApp(data); toast.push('App added', 'success') }
    else if (data.type === 'event') { store.addEvent(data); toast.push('Event added', 'success') }
    setShowAddTrack(false)
  }

  function handleAddTask(data: any) {
    store.addTask(data)
    toast.push('Task added', 'success')
    setShowAddTask(false)
  }

  function confirmRemove() {
    if (!confirm) return
    if (confirm.kind === 'sub') { store.removeSubscription(confirm.id); toast.push(`Removed ${confirm.name}`) }
    else { store.removeTask(confirm.id); toast.push(`Removed ${confirm.name}`) }
    setConfirm(null)
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Row 1 */}
      <View style={s.row2}>
        <View style={s.card}>
          <Text style={s.dateTop}>
            <Text style={{ fontWeight: '800' }}>{format(now, 'EEE')}</Text>
            {'  '}
            <Text style={{ color: theme.textMuted }}>{format(now, 'MMM')}</Text>
          </Text>
          <Text style={s.dateHero}>{format(now, 'd')}</Text>
        </View>

        <View style={[s.card, s.eventsCard]}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{monthEvents.length}</Text>
          </View>
          <Text style={s.cardLabel}>Events</Text>
          <View style={s.dotGrid}>
            {Array(31).fill(null).map((_, i) => (
              <View key={i} style={[s.dot, i < monthEvents.length && s.dotFilled]} />
            ))}
          </View>
        </View>
      </View>

      {/* Today */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Today, {format(now, 'EEEE')}</Text>

        {!hasToday && <Text style={s.empty}>Nothing due today</Text>}

        {dueSubs.map((sub: any) => (
          <View key={sub.id} style={s.listItem}>
            <View style={s.bullet} />
            <View style={s.itemBody}>
              <Text style={s.itemName}>{sub.emoji ?? '💳'} {sub.name}</Text>
              <Text style={s.itemMeta}>{symbol}{sub.price} · {format(parseISO(sub.nextChargeDate), 'd MMM')}</Text>
            </View>
            <TouchableOpacity style={s.rowAction} onPress={() => setConfirm({ kind: 'sub', id: sub.id, name: sub.name })}>
              <Text style={s.rowActionText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {todayTasks.map((task: any) => (
          <View key={task.id} style={s.listItem}>
            <TouchableOpacity
              style={[s.checkbox, task.done && s.checkboxChecked]}
              onPress={() => store.updateTask(task.id, { done: !task.done })}
            >
              {task.done && <Text style={s.checkmark}>✓</Text>}
            </TouchableOpacity>
            <View style={s.itemBody}>
              <Text style={[s.itemName, task.done && s.itemNameDone]}>{task.name}</Text>
              {task.note ? <Text style={s.itemMeta}>{task.note}</Text> : null}
            </View>
            <TouchableOpacity style={s.rowAction} onPress={() => setConfirm({ kind: 'task', id: task.id, name: task.name })}>
              <Text style={s.rowActionText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={s.todayFooter}>
          <TouchableOpacity style={s.btnCircleLg} onPress={() => setShowAddTrack(true)}>
            <Text style={s.btnCircleText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spending */}
      <View style={s.card}>
        <View style={s.spendingTop}>
          <View>
            <Text style={s.spendingAmount}>{symbol}{monthly.toFixed(0)}</Text>
            <Text style={s.spendingSub}>Per Month = {coffeeCount} coffees</Text>
          </View>
          <Text style={s.cardLabel}>Your Subscriptions</Text>
        </View>

        <Svg width="100%" height={80} viewBox="0 0 300 80" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="g-dashboard" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#000" stopOpacity={0.14} />
              <Stop offset="100%" stopColor="#000" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {store.subscriptions.length > 0 ? (
            <>
              <Path d={path.area} fill="url(#g-dashboard)" />
              <Path d={path.line} fill="none" stroke="#000" strokeWidth={1.5} strokeLinejoin="round" />
              <Circle cx={path.last.x} cy={path.last.y} r={3} fill="#000" />
            </>
          ) : (
            <SvgText x={150} y={44} textAnchor="middle" fontSize={11} fill="#888">
              No subscriptions yet
            </SvgText>
          )}
        </Svg>

        <View style={s.filters}>
          {Object.keys(RANGE_DAYS).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, timeRange === f && s.filterPillActive]}
              onPress={() => setTimeRange(f)}
            >
              <Text style={[s.filterPillText, timeRange === f && s.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick actions */}
      <View style={s.row2}>
        <TouchableOpacity style={[s.card, s.actionCard]} onPress={() => setShowAddTrack(true)}>
          <Text style={s.actionIcon}>＋</Text>
          <Text style={s.actionLabel}>Add Track</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.card, s.actionCard]} onPress={() => setShowAddTask(true)}>
          <Text style={s.actionIcon}>✓</Text>
          <Text style={s.actionLabel}>Add Task</Text>
        </TouchableOpacity>
      </View>

      <Modal open={showAddTrack} title="Add Track" onClose={() => setShowAddTrack(false)}>
        <AddTrackForm onSubmit={handleAddTrack} onCancel={() => setShowAddTrack(false)} />
      </Modal>

      <Modal open={showAddTask} title="Add Task" onClose={() => setShowAddTask(false)}>
        <AddTaskForm onSubmit={handleAddTask} onCancel={() => setShowAddTask(false)} />
      </Modal>

      <Modal open={confirm !== null} title="Remove?" onClose={() => setConfirm(null)}>
        {confirm && (
          <View>
            <Text style={s.confirmText}>Remove <Text style={{ fontWeight: '700' }}>{confirm.name}</Text>? This cannot be undone.</Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.btnSecondary} onPress={() => setConfirm(null)}>
                <Text style={s.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnDanger} onPress={confirmRemove}>
                <Text style={s.btnDangerText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.sp4, gap: theme.sp4, paddingBottom: theme.sp8 },

  row2: { flexDirection: 'row', gap: theme.sp4 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    ...theme.shadow,
  },

  dateTop: { fontSize: theme.textBase },
  dateHero: { fontSize: theme.textHero, fontWeight: '800', lineHeight: theme.textHero },

  eventsCard: { flex: 1, minHeight: 140 },
  badge: {
    position: 'absolute',
    top: theme.sp4,
    right: theme.sp4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: theme.textXs, fontWeight: '700', color: theme.accentFg },
  cardLabel: { fontSize: theme.textBase, fontWeight: '700', marginBottom: theme.sp3, color: theme.text },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.border },
  dotFilled: { backgroundColor: theme.accent },

  sectionTitle: { fontSize: theme.textSm, fontWeight: '700', marginBottom: theme.sp4, color: theme.text },
  listItem: { flexDirection: 'row', gap: theme.sp3, marginBottom: theme.sp3, alignItems: 'flex-start' },
  itemBody: { flex: 1, minWidth: 0 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent, marginTop: 6 },
  itemName: { fontSize: theme.textSm, fontWeight: '600', color: theme.text },
  itemNameDone: { color: theme.textMuted, textDecorationLine: 'line-through' },
  itemMeta: { fontSize: theme.textXs, color: theme.textMuted, marginTop: 2 },
  empty: { fontSize: theme.textSm, color: theme.textMuted, paddingVertical: theme.sp4 },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkmark: { fontSize: 12, color: theme.accentFg },
  rowAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionText: { fontSize: 16, color: theme.textMuted },
  todayFooter: { alignItems: 'flex-end', marginTop: theme.sp5 },
  btnCircleLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCircleText: { fontSize: 22, fontWeight: '300', color: theme.accentFg },

  spendingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.sp4 },
  spendingAmount: { fontSize: theme.textXl, fontWeight: '800', color: theme.text },
  spendingSub: { fontSize: theme.textXs, color: theme.textMuted, marginTop: 2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2, marginTop: theme.sp4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: theme.bg,
  },
  filterPillActive: { backgroundColor: theme.accent },
  filterPillText: { fontSize: theme.textXs, fontWeight: '600', color: theme.text },
  filterPillTextActive: { color: theme.accentFg },

  actionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 140, gap: theme.sp3 },
  actionIcon: { fontSize: 36, color: theme.textMuted },
  actionLabel: { fontSize: theme.textSm, fontWeight: '600', color: theme.text },

  confirmText: { fontSize: theme.textSm, marginBottom: theme.sp5, color: theme.text },
  confirmActions: { flexDirection: 'row', gap: theme.sp3 },
  btnSecondary: {
    flex: 1,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bg,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontWeight: '600', color: theme.textMuted },
  btnDanger: {
    flex: 1,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    backgroundColor: '#b14a3a',
    alignItems: 'center',
  },
  btnDangerText: { fontSize: theme.textSm, fontWeight: '700', color: '#fff' },
})
