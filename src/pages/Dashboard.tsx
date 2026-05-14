import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg'
import { format, differenceInCalendarDays, parseISO, getDaysInMonth } from 'date-fns'
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
        if (s.active === false) return false
        if (!s.nextChargeDate) return false
        const diff = differenceInCalendarDays(parseISO(s.nextChargeDate), now)
        return diff >= 0 && diff <= 7
      }),
    [store.subscriptions]
  )
  const hasToday = dueSubs.length > 0 || todayTasks.length > 0
  const activeSubs = useMemo(
    () => store.subscriptions.filter((s: any) => s.active !== false),
    [store.subscriptions]
  )

  const [timeRange, setTimeRange] = useState('3M')
  const timeline = useMemo(
    () => buildSpendingTimeline(store.subscriptions, RANGE_DAYS[timeRange]),
    [store.subscriptions, timeRange]
  )
  const path = useMemo(() => pointsToPath(timeline, 300, 72), [timeline])

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
    else if (confirm.kind === 'task') { store.removeTask(confirm.id); toast.push(`Removed ${confirm.name}`) }
    setConfirm(null)
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero spending card (inverted) ── */}
      <Animated.View entering={FadeInDown.delay(0).duration(500).springify()} style={s.heroCard}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroLabel}>Monthly spend</Text>
            <Text style={s.heroAmount}>
              {symbol}{monthly.toFixed(0)}
              <Text style={s.heroCents}>.{(monthly % 1).toFixed(2).slice(2)}</Text>
            </Text>
            <Text style={s.heroSub}>{activeSubs.length} active · {coffeeCount} coffees</Text>
          </View>
          <View style={s.heroMeta}>
            <Text style={s.heroDateDay}>{format(now, 'd')}</Text>
            <Text style={s.heroDateLabel}>{format(now, 'EEE, MMM')}</Text>
          </View>
        </View>

        {/* Sparkline */}
        <View style={s.chartWrap}>
          <Svg width="100%" height={72} viewBox="0 0 300 72" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {activeSubs.length > 0 ? (
              <>
                <Path d={path.area} fill="url(#hero-grad)" />
                <Path d={path.line} fill="none" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
                <Circle cx={path.last.x} cy={path.last.y} r={3.5} fill="#ffffff" />
              </>
            ) : (
              <SvgText x={150} y={40} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.35)">
                Add a subscription to see trends
              </SvgText>
            )}
          </Svg>
        </View>

        {/* Range filters */}
        <View style={s.heroFilters}>
          {Object.keys(RANGE_DAYS).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.heroFilter, timeRange === f && s.heroFilterActive]}
              onPress={() => setTimeRange(f)}
              accessibilityRole="button"
            >
              <Text style={[s.heroFilterText, timeRange === f && s.heroFilterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── Date + Events row ── */}
      <Animated.View entering={FadeInDown.delay(120).duration(500).springify()} style={s.row2}>
        <View style={[s.card, s.dateCard]}>
          <Text style={s.dateWeekday}>{format(now, 'EEEE')}</Text>
          <Text style={s.dateNum}>{format(now, 'd')}</Text>
          <Text style={s.dateMonth}>{format(now, 'MMMM yyyy')}</Text>
        </View>

        <View style={[s.card, s.eventsCard]}>
          <View style={s.eventsTop}>
            <Text style={s.cardLabel}>Events</Text>
            <Animated.View entering={ZoomIn.delay(200).duration(400)} style={s.badge}>
              <Text style={s.badgeText}>{monthEvents.length}</Text>
            </Animated.View>
          </View>
          <View style={s.dotGrid}>
            {Array(getDaysInMonth(now)).fill(null).map((_, i) => (
              <View key={i} style={[s.dot, i < monthEvents.length && s.dotFilled]} />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ── Today ── */}
      <Animated.View entering={FadeInDown.delay(220).duration(500).springify()} style={s.card}>
        <View style={s.todayHeader}>
          <Text style={s.sectionTitle}>Due this week</Text>
          <TouchableOpacity
            style={s.btnAdd}
            onPress={() => setShowAddTrack(true)}
            accessibilityRole="button"
            accessibilityLabel="Add subscription or event"
          >
            <Text style={s.btnAddText}>＋</Text>
          </TouchableOpacity>
        </View>

        {!hasToday && (
          <Text style={s.empty}>Nothing due in the next 7 days</Text>
        )}

        {dueSubs.map((sub: any) => {
          const diff = differenceInCalendarDays(parseISO(sub.nextChargeDate), now)
          return (
            <View key={sub.id} style={s.listItem}>
              <View style={s.emojiWrap}>
                <Text style={s.itemEmoji}>{sub.emoji ?? '💳'}</Text>
              </View>
              <View style={s.itemBody}>
                <Text style={s.itemName}>{sub.name}</Text>
                <Text style={s.itemMeta}>
                  {symbol}{sub.price} · {diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff}d`}
                </Text>
              </View>
              <TouchableOpacity
                style={s.rowAction}
                onPress={() => setConfirm({ kind: 'sub', id: sub.id, name: sub.name })}
                accessibilityLabel={`Remove ${sub.name}`}
                accessibilityRole="button"
              >
                <Text style={s.rowActionText}>×</Text>
              </TouchableOpacity>
            </View>
          )
        })}

        {todayTasks.map((task: any, idx: number) => (
          <Animated.View key={task.id} entering={FadeInDown.delay(320 + idx * 60).duration(400)} style={s.listItem}>
            <TouchableOpacity
              style={[s.checkbox, task.done && s.checkboxChecked]}
              onPress={() => store.updateTask(task.id, { done: !task.done })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: task.done }}
            >
              {task.done && (
                <Animated.Text entering={ZoomIn.duration(200)} style={s.checkmark}>✓</Animated.Text>
              )}
            </TouchableOpacity>
            <View style={s.itemBody}>
              <Text style={[s.itemName, task.done && s.itemNameDone]}>{task.name}</Text>
              {task.note ? <Text style={s.itemMeta}>{task.note}</Text> : null}
            </View>
            <TouchableOpacity
              style={s.rowAction}
              onPress={() => setConfirm({ kind: 'task', id: task.id, name: task.name })}
              accessibilityLabel={`Remove ${task.name}`}
              accessibilityRole="button"
            >
              <Text style={s.rowActionText}>×</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>

      {/* ── Quick actions ── */}
      <Animated.View entering={FadeInDown.delay(320).duration(500).springify()} style={s.row2}>
        <TouchableOpacity
          style={[s.card, s.actionCard]}
          onPress={() => setShowAddTrack(true)}
          accessibilityRole="button"
        >
          <Text style={s.actionIcon}>＋</Text>
          <Text style={s.actionLabel}>Track</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.card, s.actionCard]}
          onPress={() => setShowAddTask(true)}
          accessibilityRole="button"
        >
          <Text style={s.actionIcon}>✓</Text>
          <Text style={s.actionLabel}>Task</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal open={showAddTrack} title="Add Track" onClose={() => setShowAddTrack(false)}>
        <AddTrackForm onSubmit={handleAddTrack} onCancel={() => setShowAddTrack(false)} />
      </Modal>
      <Modal open={showAddTask} title="Add Task" onClose={() => setShowAddTask(false)}>
        <AddTaskForm onSubmit={handleAddTask} onCancel={() => setShowAddTask(false)} />
      </Modal>
      <Modal open={confirm !== null} title="Remove?" onClose={() => setConfirm(null)}>
        {confirm && (
          <View>
            <Text style={s.confirmText}>
              Remove <Text style={{ fontWeight: '700' }}>{confirm.name}</Text>? This cannot be undone.
            </Text>
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
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 110 },

  row2: { flexDirection: 'row', gap: theme.sp3 },

  // ── Hero card (inverted) ──
  heroCard: {
    backgroundColor: theme.accent,
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    ...theme.shadowMd,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.sp4,
  },
  heroLabel: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.sp1,
  },
  heroAmount: {
    fontSize: 52,
    fontFamily: theme.fontBlack,
    color: theme.accentFg,
    lineHeight: 52,
    letterSpacing: -2,
  },
  heroCents: {
    fontSize: 24,
    fontFamily: theme.fontMedium,
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: theme.textXs,
    fontFamily: theme.fontRegular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: theme.sp1,
  },
  heroMeta: { alignItems: 'flex-end' },
  heroDateDay: {
    fontSize: 40,
    fontFamily: theme.fontBlack,
    color: theme.accentFg,
    lineHeight: 40,
    letterSpacing: -1,
  },
  heroDateLabel: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  chartWrap: { marginHorizontal: -theme.sp5, marginBottom: theme.sp3 },
  heroFilters: { flexDirection: 'row', gap: theme.sp2 },
  heroFilter: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroFilterActive: { backgroundColor: theme.accentFg },
  heroFilterText: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: 'rgba(255,255,255,0.5)' },
  heroFilterTextActive: { color: theme.accent },

  // ── Cards ──
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    ...theme.shadow,
  },
  cardLabel: { fontSize: theme.textSm, fontWeight: '700', color: theme.text },

  dateCard: { width: 110, justifyContent: 'space-between' },
  dateWeekday: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateNum: { fontSize: 48, fontFamily: theme.fontBlack, color: theme.text, lineHeight: 52, letterSpacing: -2, marginVertical: theme.sp1 },
  dateMonth: { fontSize: theme.textXs, fontFamily: theme.fontMedium, color: theme.textMuted },

  eventsCard: { flex: 1 },
  eventsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.sp3 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: theme.textXs, fontWeight: '700', color: theme.accentFg },
  dotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.border },
  dotFilled: { backgroundColor: theme.accent },

  // ── Today section ──
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.sp4 },
  sectionTitle: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: theme.text },
  btnAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAddText: { fontSize: 18, fontWeight: '300', color: theme.accentFg, lineHeight: 22 },

  listItem: { flexDirection: 'row', gap: theme.sp3, marginBottom: theme.sp3, alignItems: 'center' },
  itemBody: { flex: 1, minWidth: 0 },
  emojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 18 },
  itemName: { fontSize: theme.textSm, fontFamily: theme.fontMedium, color: theme.text },
  itemNameDone: { color: theme.textMuted, textDecorationLine: 'line-through' },
  itemMeta: { fontSize: theme.textXs, color: theme.textMuted, marginTop: 2 },
  empty: { fontSize: theme.textSm, color: theme.textFaint, paddingVertical: theme.sp3 },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkmark: { fontSize: 11, color: theme.accentFg, fontWeight: '700' },
  rowAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionText: { fontSize: 16, color: theme.textMuted, lineHeight: 20 },

  // ── Action cards ──
  actionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 100, gap: theme.sp2 },
  actionIcon: { fontSize: 28, color: theme.textMuted },
  actionLabel: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Confirm modal ──
  confirmText: { fontSize: theme.textSm, marginBottom: theme.sp5, color: theme.text, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: theme.sp3 },
  btnSecondary: {
    flex: 1,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontWeight: '600', color: theme.textMuted },
  btnDanger: {
    flex: 1,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.danger,
    alignItems: 'center',
  },
  btnDangerText: { fontSize: theme.textSm, fontWeight: '700', color: '#fff' },
})
