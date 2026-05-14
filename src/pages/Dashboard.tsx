import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native'
import { MotiView } from 'moti'
import Animated, {
  FadeInRight,
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
import { useTheme } from '../context/ThemeContext'
import { totalMonthlySpend, coffees } from '../utils/calculations'
import { Modal } from '../components/ui/Modal'
import { DotGrid } from '../components/ui/DotGrid'
import { AddTrackForm } from '../components/forms/AddTrackForm'
import { AddTaskForm } from '../components/forms/AddTaskForm'
import { theme, CURRENCY_SYMBOL, Colors } from '../theme'

// ── Press-scale wrapper ────────────────────────────────────────────────
function PressCard({ style, onPress, children }: { style?: any; onPress?: () => void; children: React.ReactNode }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
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

// ── Ring badge ─────────────────────────────────────────────────────────
function RingBadge({ value, max = 20, size = 56, colors }: { value: number; max?: number; size?: number; colors: Colors }) {
  const stroke = 3
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const dash = circ * pct
  const isDark = colors.bg !== '#F2F1EE'
  const trackColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const fillColor = colors.accent

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={fillColor} strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        )}
      </Svg>
      <Text style={{ fontSize: 20, fontFamily: theme.fontMonoBold, color: colors.text, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  )
}

// ── Activity heatmap ───────────────────────────────────────────────────
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

function ActivityHeatmap({ subs, events, colors }: { subs: any[]; events: any[]; colors: Colors }) {
  const isDark = colors.bg !== '#F2F1EE'
  const cols = useMemo(() => buildHeatmap(subs, events), [subs, events])
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let last = -1
    cols.forEach((week, ci) => {
      if (!week[0]?.date) return
      const m = getMonth(parseISO(week[0].date))
      if (m !== last) { labels.push({ col: ci, label: format(parseISO(week[0].date), 'MMM') }); last = m }
    })
    return labels
  }, [cols])
  const totalW = cols.length * (CELL + GAP) - GAP

  function dotColor(count: number) {
    if (isDark) {
      if (count === 0) return 'rgba(255,255,255,0.07)'
      if (count === 1) return 'rgba(255,255,255,0.28)'
      if (count === 2) return colors.accentRed + '88'
      return colors.accentRed
    }
    if (count === 0) return 'rgba(0,0,0,0.07)'
    if (count === 1) return 'rgba(0,0,0,0.28)'
    if (count === 2) return 'rgba(0,0,0,0.55)'
    return '#111111'
  }

  const monthLabelColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)'

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={{ height: 16, width: totalW, marginBottom: 5 }}>
          {monthLabels.map((ml, i) => (
            <Text key={i} style={[hm.monthLabel, { position: 'absolute', left: ml.col * (CELL + GAP), color: monthLabelColor }]}>
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
  monthLabel: { fontSize: 9, fontFamily: theme.fontMono, letterSpacing: 0.3 },
})

// ── Subscription row ───────────────────────────────────────────────────
function SubRow({ sub, symbol, diff, onRemove, delay, colors }: { sub: any; symbol: string; diff: number; onRemove: () => void; delay: number; colors: Colors }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const dueLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff}d`
  const dueColor = diff === 0 ? colors.accentRed : diff <= 2 ? colors.warning : colors.textMuted
  const dueBg = diff === 0 ? colors.accentRed + '18' : colors.surfaceEl

  return (
    <Animated.View entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 16, stiffness: 380 }) }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 380 }) }}
        onLongPress={onRemove}
        delayLongPress={500}
        accessibilityRole="button"
      >
        <Animated.View style={[sr.row, { borderBottomColor: colors.border }, animStyle]}>
          <View style={[sr.badge, { backgroundColor: colors.surfaceEl }]}>
            <Text style={sr.emoji}>{sub.emoji ?? '💳'}</Text>
          </View>
          <View style={sr.body}>
            <Text style={[sr.name, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
            <View style={sr.metaRow}>
              <View style={[sr.duePill, { backgroundColor: dueBg }]}>
                <Text style={[sr.dueText, { color: dueColor }]}>{dueLabel}</Text>
              </View>
              <Text style={[sr.category, { color: colors.textFaint }]}>{sub.category ?? ''}</Text>
            </View>
          </View>
          <View style={sr.right}>
            <Text style={[sr.price, { color: colors.text }]}>{symbol}{sub.price}</Text>
            <Text style={[sr.cycle, { color: colors.textMuted }]}>{sub.billingCycle ?? 'mo'}</Text>
          </View>
          <TouchableOpacity style={[sr.removeBtn, { backgroundColor: colors.surfaceEl }]} onPress={onRemove} hitSlop={8}>
            <View style={[sr.removeLine, { backgroundColor: colors.textMuted }]} />
            <View style={[sr.removeLine, { backgroundColor: colors.textMuted, transform: [{ rotate: '90deg' }], position: 'absolute' }]} />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, paddingVertical: 14, borderBottomWidth: 1 },
  badge: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  body: { flex: 1, minWidth: 0, gap: 5 },
  name: { fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  dueText: { fontSize: 10, fontFamily: theme.fontBold, letterSpacing: 0.2 },
  category: { fontSize: 10, fontFamily: theme.fontRegular },
  right: { alignItems: 'flex-end', gap: 3 },
  price: { fontSize: theme.textBase, fontFamily: theme.fontMonoBold, letterSpacing: -0.5 },
  cycle: { fontSize: 10, fontFamily: theme.fontMono },
  removeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  removeLine: { width: 12, height: 1.5, borderRadius: 1 },
})

// ── Task row ───────────────────────────────────────────────────────────
function TaskRow({ task, delay, onToggle, onRemove, colors }: { task: any; delay: number; onToggle: () => void; onRemove: () => void; colors: Colors }) {
  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)}
      style={[sr.row, { borderBottomColor: colors.border }]}
    >
      <TouchableOpacity
        style={[tr.checkbox, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceEl }, task.done && { backgroundColor: colors.accent, borderColor: colors.accent }]}
        onPress={onToggle}
        accessibilityRole="checkbox"
      >
        {task.done && (
          <Animated.Text entering={ZoomIn.springify().damping(12).stiffness(300)} style={[tr.checkmark, { color: colors.accentFg }]}>
            ✓
          </Animated.Text>
        )}
      </TouchableOpacity>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[sr.name, { color: colors.text }, task.done && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>{task.name}</Text>
        {task.note ? <Text style={[sr.category, { color: colors.textFaint }]}>{task.note}</Text> : null}
      </View>
      <TouchableOpacity style={[sr.removeBtn, { backgroundColor: colors.surfaceEl }]} onPress={onRemove}>
        <View style={[sr.removeLine, { backgroundColor: colors.textMuted }]} />
        <View style={[sr.removeLine, { backgroundColor: colors.textMuted, transform: [{ rotate: '90deg' }], position: 'absolute' }]} />
      </TouchableOpacity>
    </Animated.View>
  )
}
const tr = StyleSheet.create({
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkmark: { fontSize: 12, fontFamily: theme.fontBold },
})

// ── Dashboard ──────────────────────────────────────────────────────────
export function Dashboard() {
  const { colors, themeKey } = useTheme()
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
  const isNothing = themeKey === 'nothing'
  const dotColor = isNothing ? colors.accentRed : colors.text

  return (
    <ScrollView style={[s.page, { backgroundColor: colors.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        style={s.header}
      >
        <Text style={[s.pageTitle, { color: colors.text }]}>
          {isNothing ? '⬡ Track' : 'Track'}
        </Text>
        <View style={s.headerBtns}>
          <PressCard style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={() => setShowAddTask(true)}>
            <View style={{ width: 14, height: 1.5, backgroundColor: colors.text, borderRadius: 1 }} />
            <View style={{ width: 10, height: 1.5, backgroundColor: colors.text, borderRadius: 1 }} />
            <View style={{ width: 14, height: 1.5, backgroundColor: colors.text, borderRadius: 1 }} />
          </PressCard>
          <PressCard style={[s.iconBtn, { backgroundColor: colors.surface }]} onPress={() => setShowAddTrack(true)}>
            <Text style={[s.iconBtnPlus, { color: colors.text }]}>+</Text>
          </PressCard>
        </View>
      </MotiView>

      {/* ── 2-col KPI cards ── */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 60 }}
        style={s.row2}
      >
        <PressCard style={[s.card, s.kpiCard, { backgroundColor: colors.surface }]}>
          {isNothing && <DotGrid color={dotColor} opacity={0.08} />}
          <View style={s.kpiTopRow}>
            <RingBadge value={activeSubs.length} max={Math.max(activeSubs.length + 4, 10)} colors={colors} />
            <View style={[s.adjustBtn, { backgroundColor: colors.surfaceEl }]}>
              <View style={{ gap: 3, alignItems: 'center' }}>
                {[14, 10, 14].map((w, i) => (
                  <View key={i} style={{ width: w, height: 1.5, backgroundColor: colors.text + '55', borderRadius: 1 }} />
                ))}
              </View>
            </View>
          </View>
          <View style={s.kpiBottom}>
            <Text style={[s.kpiName, { color: colors.text }]}>Active</Text>
            <Text style={[s.kpiSub, { color: colors.textMuted }]}>subscriptions</Text>
          </View>
        </PressCard>

        <PressCard style={[s.card, s.kpiCard, { backgroundColor: colors.surface }]}>
          {isNothing && <DotGrid color={dotColor} opacity={0.08} />}
          <View style={s.kpiTopRow}>
            <View style={s.spendBlock}>
              <Text style={[s.spendMain, { color: colors.text }]}>{monthly.toFixed(0)}</Text>
              <Text style={[s.spendUnit, { color: colors.textMuted }]}>{symbol}</Text>
            </View>
            <View style={[s.adjustBtn, { backgroundColor: colors.surfaceEl }]}>
              <View style={{ gap: 3, alignItems: 'center' }}>
                {[14, 10, 14].map((w, i) => (
                  <View key={i} style={{ width: w, height: 1.5, backgroundColor: colors.text + '55', borderRadius: 1 }} />
                ))}
              </View>
            </View>
          </View>
          <View style={s.kpiBottom}>
            <Text style={[s.kpiName, { color: colors.text }]}>Monthly</Text>
            <Text style={[s.kpiSub, { color: colors.textMuted }]}>spend</Text>
          </View>
        </PressCard>
      </MotiView>

      {/* ── Heatmap ── */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 120 }}
        style={[s.card, { backgroundColor: colors.surface }]}
      >
        <ActivityHeatmap subs={store.subscriptions} events={store.events} colors={colors} />
      </MotiView>

      {/* ── Due this week ── */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 180 }}
        style={[s.card, { backgroundColor: colors.surface }]}
      >
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Due this week</Text>
          <PressCard style={[s.addPill, { backgroundColor: colors.surfaceEl }]} onPress={() => setShowAddTrack(true)}>
            <Text style={[s.addPillText, { color: colors.textMuted }]}>+ Add</Text>
          </PressCard>
        </View>

        {!hasItems && (
          <Text style={[s.empty, { color: colors.textFaint }]}>Nothing due in the next 7 days</Text>
        )}

        {dueSubs.map((sub: any, idx: number) => {
          const diff = differenceInCalendarDays(parseISO(sub.nextChargeDate), now)
          return (
            <SubRow key={sub.id} sub={sub} symbol={symbol} diff={diff} delay={200 + idx * 40} colors={colors}
              onRemove={() => setConfirm({ kind: 'sub', id: sub.id, name: sub.name })} />
          )
        })}

        {todayTasks.map((task: any, idx: number) => (
          <TaskRow key={task.id} task={task} delay={300 + idx * 40} colors={colors}
            onToggle={() => store.updateTask(task.id, { done: !task.done })}
            onRemove={() => setConfirm({ kind: 'task', id: task.id, name: task.name })} />
        ))}
      </MotiView>

      {/* ── Stats row ── */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 240 }}
        style={s.row2}
      >
        <PressCard style={[s.card, s.statCard, { backgroundColor: colors.surface }]}>
          {isNothing && <DotGrid color={dotColor} opacity={0.07} />}
          <Text style={[s.statNum, { color: colors.text }]}>{coffeeCount}</Text>
          <Text style={[s.statLabel, { color: colors.text }]}>coffees / mo</Text>
          <Text style={[s.statSub, { color: colors.textMuted }]}>at {symbol}{store.settings.coffeePrice?.toFixed(2)}</Text>
        </PressCard>

        <PressCard style={[s.card, s.statCard, { backgroundColor: colors.surface }]}>
          {isNothing && <DotGrid color={dotColor} opacity={0.07} />}
          <Animated.Text
            entering={ZoomIn.delay(280).springify().damping(12).stiffness(260)}
            style={[s.statNum, { color: colors.text }]}
          >
            {monthEvents.length}
          </Animated.Text>
          <Text style={[s.statLabel, { color: colors.text }]}>events</Text>
          <Text style={[s.statSub, { color: colors.textMuted }]}>{format(now, 'MMMM')}</Text>
        </PressCard>
      </MotiView>

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
            <Text style={[s.confirmText, { color: colors.text }]}>
              Remove <Text style={{ fontFamily: theme.fontBold }}>{confirm.name}</Text>? This cannot be undone.
            </Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={[s.btnSecondary, { backgroundColor: colors.surfaceEl }]} onPress={() => setConfirm(null)}>
                <Text style={[s.btnSecondaryText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnDanger, { backgroundColor: colors.danger }]} onPress={confirmRemove}>
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
  page: { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 110 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 4, paddingTop: theme.sp2, marginBottom: theme.sp2,
  },
  pageTitle: { fontSize: 34, fontFamily: theme.fontBlack, letterSpacing: -1 },
  headerBtns: { flexDirection: 'row', gap: theme.sp2 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconBtnPlus: { fontSize: 22, fontFamily: theme.fontLight, lineHeight: 26 },

  card: { borderRadius: theme.radiusXl, padding: theme.sp5, overflow: 'hidden' },
  row2: { flexDirection: 'row', gap: theme.sp3 },

  kpiCard: { flex: 1, justifyContent: 'space-between', minHeight: 140 },
  kpiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kpiBottom: { marginTop: theme.sp3 },
  kpiName: { fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.3 },
  kpiSub: { fontSize: theme.textXs, fontFamily: theme.fontRegular, marginTop: 2 },

  spendBlock: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  spendMain: { fontSize: 48, fontFamily: theme.fontMonoBold, letterSpacing: -2, lineHeight: 52 },
  spendUnit: { fontSize: 18, fontFamily: theme.fontMono, marginBottom: 4 },

  adjustBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.sp4 },
  sectionTitle: { fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.3 },
  addPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radiusFull },
  addPillText: { fontSize: theme.textXs, fontFamily: theme.fontBold },
  empty: { fontSize: theme.textSm, fontFamily: theme.fontRegular, paddingVertical: theme.sp3 },

  statCard: { flex: 1, gap: 4, overflow: 'hidden' },
  statNum: { fontSize: 32, fontFamily: theme.fontMonoBold, letterSpacing: -1.5 },
  statLabel: { fontSize: theme.textSm, fontFamily: theme.fontBold },
  statSub: { fontSize: theme.textXs, fontFamily: theme.fontMono },

  confirmText: { fontSize: theme.textSm, marginBottom: theme.sp5, lineHeight: 22 },
  confirmActions: { flexDirection: 'row', gap: theme.sp3 },
  btnSecondary: { flex: 1, paddingVertical: theme.sp3, borderRadius: theme.radiusMd, alignItems: 'center' },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold },
  btnDanger: { flex: 1, paddingVertical: theme.sp3, borderRadius: theme.radiusMd, alignItems: 'center' },
  btnDangerText: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: '#fff' },
})
