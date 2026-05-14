import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native'
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import {
  format,
  differenceInCalendarDays,
  parseISO,
  subDays,
  eachDayOfInterval,
  getMonth,
} from 'date-fns'
import { useDataStore } from '../stores/data'
import { useToastStore } from '../stores/toasts'
import { totalMonthlySpend, coffees } from '../utils/calculations'
import { Modal } from '../components/ui/Modal'
import { AddTrackForm } from '../components/forms/AddTrackForm'
import { AddTaskForm } from '../components/forms/AddTaskForm'
import { theme, CURRENCY_SYMBOL } from '../theme'

// ── Press-scale wrapper ───────────────────────────────────────────────
function PressCard({
  style,
  onPress,
  children,
}: {
  style?: any
  onPress?: () => void
  children: React.ReactNode
}) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 16, stiffness: 380 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 380 }) }}
      onPress={onPress}
    >
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </Pressable>
  )
}

// ── Ring badge ────────────────────────────────────────────────────────
function RingBadge({ value, max = 20, size = 56 }: { value: number; max?: number; size?: number }) {
  const stroke = 3
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const dash = circ * pct
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <SvgCircle cx={size / 2} cy={size / 2} r={r}
            stroke="rgba(0,0,0,0.7)" strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        )}
      </Svg>
      <Text style={rb.num}>{value}</Text>
    </View>
  )
}
const rb = StyleSheet.create({
  num: { fontSize: 20, fontFamily: 'Roboto_700Bold', color: '#111111', letterSpacing: -0.5 },
})

// ── Activity heatmap ──────────────────────────────────────────────────
const CELL = 9
const GAP = 2
const WEEKS = 26

function buildHeatmap(subs: any[], events: any[]) {
  const today = new Date()
  const start = subDays(today, WEEKS * 7 - 1)
  const days = eachDayOfInterval({ start, end: today })
  const map: Record<string, number> = {}
  for (const s of subs) {
    if (s.nextChargeDate) map[s.nextChargeDate] = (map[s.nextChargeDate] || 0) + 1
  }
  for (const e of events) {
    if (e.date) map[e.date] = (map[e.date] || 0) + 1
  }
  const cols: { date: string; count: number }[][] = []
  let week: { date: string; count: number }[] = []
  for (const d of days) {
    const ds = format(d, 'yyyy-MM-dd')
    week.push({ date: ds, count: map[ds] || 0 })
    if (week.length === 7) { cols.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: '', count: 0 })
    cols.push(week)
  }
  return cols
}

function dotColor(count: number) {
  if (count === 0) return 'rgba(0,0,0,0.07)'
  if (count === 1) return 'rgba(0,0,0,0.28)'
  if (count === 2) return 'rgba(0,0,0,0.55)'
  return '#111111'
}

function ActivityHeatmap({ subs, events }: { subs: any[]; events: any[] }) {
  const cols = useMemo(() => buildHeatmap(subs, events), [subs, events])
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let last = -1
    cols.forEach((week, ci) => {
      if (!week[0]?.date) return
      const m = getMonth(parseISO(week[0].date))
      if (m !== last) {
        labels.push({ col: ci, label: format(parseISO(week[0].date), 'MMM') })
        last = m
      }
    })
    return labels
  }, [cols])
  const totalW = cols.length * (CELL + GAP) - GAP
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={{ height: 16, width: totalW, marginBottom: 5 }}>
          {monthLabels.map((ml, i) => (
            <Text key={i} style={[hm.monthLabel, { position: 'absolute', left: ml.col * (CELL + GAP) }]}>
              {ml.label}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {cols.map((week, ci) => (
            <View key={ci} style={{ gap: GAP }}>
              {week.map((cell, ri) => (
                <View key={ri} style={[hm.cell, { backgroundColor: dotColor(cell.count) }]} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
const hm = StyleSheet.create({
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  monthLabel: { fontSize: 9, fontFamily: 'Roboto_400Regular', color: 'rgba(0,0,0,0.35)', letterSpacing: 0.3 },
})

// ── Subscription row ──────────────────────────────────────────────────
function SubRow({
  sub,
  symbol,
  diff,
  onRemove,
  delay,
}: {
  sub: any
  symbol: string
  diff: number
  onRemove: () => void
  delay: number
}) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const dueLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff}d`
  const dueColor = diff === 0 ? theme.danger : diff <= 2 ? theme.warning : theme.textMuted

  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 16, stiffness: 380 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 380 }) }}
        onLongPress={onRemove}
        delayLongPress={500}
        accessibilityRole="button"
      >
        <Animated.View style={[sr.row, animStyle]}>
          <View style={sr.badge}>
            <Text style={sr.emoji}>{sub.emoji ?? '💳'}</Text>
          </View>
          <View style={sr.body}>
            <Text style={sr.name} numberOfLines={1}>{sub.name}</Text>
            <View style={sr.metaRow}>
              <View style={[sr.duePill, { backgroundColor: diff === 0 ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[sr.dueText, { color: dueColor }]}>{dueLabel}</Text>
              </View>
              <Text style={sr.category}>{sub.category ?? ''}</Text>
            </View>
          </View>
          <View style={sr.right}>
            <Text style={sr.price}>{symbol}{sub.price}</Text>
            <Text style={sr.cycle}>{sub.billingCycle ?? 'mo'}</Text>
          </View>
          <TouchableOpacity style={sr.removeBtn} onPress={onRemove} hitSlop={8}>
            <View style={sr.removeLine} />
            <View style={[sr.removeLine, { transform: [{ rotate: '90deg' }], position: 'absolute' }]} />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sp3,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  body: { flex: 1, minWidth: 0, gap: 5 },
  name: { fontSize: theme.textBase, fontFamily: theme.fontBold, color: theme.text, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dueText: { fontSize: 10, fontFamily: theme.fontBold, letterSpacing: 0.2 },
  category: { fontSize: 10, fontFamily: theme.fontRegular, color: theme.textFaint },
  right: { alignItems: 'flex-end', gap: 3 },
  price: { fontSize: theme.textBase, fontFamily: theme.fontBlack, color: theme.text, letterSpacing: -0.5 },
  cycle: { fontSize: 10, fontFamily: theme.fontRegular, color: theme.textMuted },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLine: { width: 12, height: 1.5, backgroundColor: theme.textMuted, borderRadius: 1 },
})

// ── Task row ──────────────────────────────────────────────────────────
function TaskRow({ task, delay, onToggle, onRemove }: {
  task: any; delay: number; onToggle: () => void; onRemove: () => void
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)}
      style={sr.row}
    >
      <TouchableOpacity
        style={[tr.checkbox, task.done && tr.checkboxDone]}
        onPress={onToggle}
        accessibilityRole="checkbox"
      >
        {task.done && (
          <Animated.Text entering={ZoomIn.springify().damping(12).stiffness(300)} style={tr.checkmark}>
            ✓
          </Animated.Text>
        )}
      </TouchableOpacity>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[sr.name, task.done && tr.done]}>{task.name}</Text>
        {task.note ? <Text style={sr.category}>{task.note}</Text> : null}
      </View>
      <TouchableOpacity style={sr.removeBtn} onPress={onRemove}>
        <View style={sr.removeLine} />
        <View style={[sr.removeLine, { transform: [{ rotate: '90deg' }], position: 'absolute' }]} />
      </TouchableOpacity>
    </Animated.View>
  )
}
const tr = StyleSheet.create({
  checkbox: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 1.5, borderColor: theme.borderStrong,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: theme.accent, borderColor: theme.accent },
  checkmark: { fontSize: 12, color: theme.accentFg, fontFamily: theme.fontBold },
  done: { color: theme.textMuted, textDecorationLine: 'line-through' },
})

// ── Adjust icon ───────────────────────────────────────────────────────
function AdjustIcon() {
  return (
    <View style={adj.wrap}>
      <View style={adj.bar} />
      <View style={[adj.bar, adj.barMid]} />
      <View style={adj.bar} />
    </View>
  )
}
const adj = StyleSheet.create({
  wrap: { gap: 3, alignItems: 'center', justifyContent: 'center' },
  bar: { width: 14, height: 1.5, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 1 },
  barMid: { width: 10 },
})

// ── Entering helpers ──────────────────────────────────────────────────
const fadeDown = (delay = 0) =>
  FadeInDown.delay(delay).springify().damping(20).stiffness(210)
const fadeUp = (delay = 0) =>
  FadeInUp.delay(delay).springify().damping(20).stiffness(210)

// ── Dashboard ─────────────────────────────────────────────────────────
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
        if (s.active === false || !s.nextChargeDate) return false
        const diff = differenceInCalendarDays(parseISO(s.nextChargeDate), now)
        return diff >= 0 && diff <= 7
      }),
    [store.subscriptions]
  )
  const activeSubs = useMemo(
    () => store.subscriptions.filter((s: any) => s.active !== false),
    [store.subscriptions]
  )

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

  const hasItems = dueSubs.length > 0 || todayTasks.length > 0

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <Animated.View entering={fadeDown(0)} style={s.header}>
        <Text style={s.pageTitle}>Track</Text>
        <View style={s.headerBtns}>
          <PressCard style={s.iconBtn} onPress={() => setShowAddTask(true)}>
            <View style={s.iconBtnLine} />
            <View style={[s.iconBtnLine, { width: 10 }]} />
            <View style={s.iconBtnLine} />
          </PressCard>
          <PressCard style={s.iconBtn} onPress={() => setShowAddTrack(true)}>
            <Text style={s.iconBtnPlus}>+</Text>
          </PressCard>
        </View>
      </Animated.View>

      {/* ── 2-col KPI cards ── */}
      <Animated.View entering={fadeDown(55)} style={s.row2}>

        <PressCard style={[s.card, s.kpiCard]}>
          <View style={s.kpiTopRow}>
            <RingBadge value={activeSubs.length} max={Math.max(activeSubs.length + 4, 10)} />
            <View style={s.adjustBtn}><AdjustIcon /></View>
          </View>
          <View style={s.kpiBottom}>
            <Text style={s.kpiName}>Active</Text>
            <Text style={s.kpiSub}>subscriptions</Text>
          </View>
        </PressCard>

        <PressCard style={[s.card, s.kpiCard]}>
          <View style={s.kpiTopRow}>
            <View style={s.spendBlock}>
              <Text style={s.spendMain}>{monthly.toFixed(0)}</Text>
              <Text style={s.spendUnit}>{symbol}</Text>
            </View>
            <View style={s.adjustBtn}><AdjustIcon /></View>
          </View>
          <View style={s.kpiBottom}>
            <Text style={s.kpiName}>Monthly</Text>
            <Text style={s.kpiSub}>spend</Text>
          </View>
        </PressCard>

      </Animated.View>

      {/* ── Heatmap ── */}
      <Animated.View entering={fadeDown(110)} style={s.card}>
        <ActivityHeatmap subs={store.subscriptions} events={store.events} />
      </Animated.View>

      {/* ── Due this week ── */}
      <Animated.View entering={fadeDown(165)} style={s.card}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Due this week</Text>
          <PressCard style={s.addPill} onPress={() => setShowAddTrack(true)}>
            <Text style={s.addPillText}>+ Add</Text>
          </PressCard>
        </View>

        {!hasItems && (
          <Text style={s.empty}>Nothing due in the next 7 days</Text>
        )}

        {dueSubs.map((sub: any, idx: number) => {
          const diff = differenceInCalendarDays(parseISO(sub.nextChargeDate), now)
          return (
            <SubRow
              key={sub.id}
              sub={sub}
              symbol={symbol}
              diff={diff}
              delay={200 + idx * 40}
              onRemove={() => setConfirm({ kind: 'sub', id: sub.id, name: sub.name })}
            />
          )
        })}

        {todayTasks.map((task: any, idx: number) => (
          <TaskRow
            key={task.id}
            task={task}
            delay={300 + idx * 40}
            onToggle={() => store.updateTask(task.id, { done: !task.done })}
            onRemove={() => setConfirm({ kind: 'task', id: task.id, name: task.name })}
          />
        ))}
      </Animated.View>

      {/* ── Stats row ── */}
      <Animated.View entering={fadeUp(220)} style={s.row2}>

        <PressCard style={[s.card, s.statCard]}>
          <Text style={s.statNum}>{coffeeCount}</Text>
          <Text style={s.statLabel}>coffees / mo</Text>
          <Text style={s.statSub}>at {symbol}{store.settings.coffeePrice?.toFixed(2)}</Text>
        </PressCard>

        <PressCard style={[s.card, s.statCard]}>
          <Animated.Text
            entering={ZoomIn.delay(280).springify().damping(12).stiffness(260)}
            style={s.statNum}
          >
            {monthEvents.length}
          </Animated.Text>
          <Text style={s.statLabel}>events</Text>
          <Text style={s.statSub}>{format(now, 'MMMM')}</Text>
        </PressCard>

      </Animated.View>

      {/* ── Modals ── */}
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
              Remove <Text style={{ fontFamily: theme.fontBold }}>{confirm.name}</Text>? This cannot be undone.
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

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 110 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: theme.sp2,
    marginBottom: theme.sp2,
  },
  pageTitle: {
    fontSize: 34,
    fontFamily: theme.fontBlack,
    color: theme.text,
    letterSpacing: -1,
  },
  headerBtns: { flexDirection: 'row', gap: theme.sp2 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconBtnLine: { width: 14, height: 1.5, backgroundColor: theme.text, borderRadius: 1 },
  iconBtnPlus: { fontSize: 22, fontFamily: theme.fontLight, color: theme.text, lineHeight: 26 },

  card: { backgroundColor: theme.surface, borderRadius: theme.radiusXl, padding: theme.sp5 },
  row2: { flexDirection: 'row', gap: theme.sp3 },

  kpiCard: { flex: 1, justifyContent: 'space-between', minHeight: 140 },
  kpiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiBottom: { marginTop: theme.sp3 },
  kpiName: { fontSize: theme.textBase, fontFamily: theme.fontBold, color: theme.text, letterSpacing: -0.3 },
  kpiSub: { fontSize: theme.textXs, fontFamily: theme.fontRegular, color: theme.textMuted, marginTop: 2 },

  spendBlock: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  spendMain: { fontSize: 40, fontFamily: theme.fontBlack, color: theme.text, letterSpacing: -2, lineHeight: 44 },
  spendUnit: { fontSize: 18, fontFamily: theme.fontBold, color: theme.textMuted, marginBottom: 4 },

  adjustBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: theme.sp4,
  },
  sectionTitle: { fontSize: theme.textBase, fontFamily: theme.fontBold, color: theme.text, letterSpacing: -0.3 },
  addPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.surfaceEl,
  },
  addPillText: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: theme.textMuted },
  empty: { fontSize: theme.textSm, fontFamily: theme.fontRegular, color: theme.textFaint, paddingVertical: theme.sp3 },

  statCard: { flex: 1, gap: 4 },
  statNum: { fontSize: 32, fontFamily: theme.fontBlack, color: theme.text, letterSpacing: -1.5 },
  statLabel: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: theme.text },
  statSub: { fontSize: theme.textXs, fontFamily: theme.fontRegular, color: theme.textMuted },

  confirmText: { fontSize: theme.textSm, marginBottom: theme.sp5, color: theme.text, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: theme.sp3 },
  btnSecondary: {
    flex: 1, paddingVertical: theme.sp3, borderRadius: theme.radiusMd,
    backgroundColor: theme.surfaceEl, alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: theme.textMuted },
  btnDanger: {
    flex: 1, paddingVertical: theme.sp3, borderRadius: theme.radiusMd,
    backgroundColor: theme.danger, alignItems: 'center',
  },
  btnDangerText: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: '#fff' },
})
