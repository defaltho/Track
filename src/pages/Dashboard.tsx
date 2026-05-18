import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet,
  Platform, useWindowDimensions, Dimensions,
} from 'react-native'
import { MotiView } from 'moti'
import Animated, {
  FadeInRight, ZoomIn, LinearTransition,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated'
import Svg, { Circle as SvgCircle } from 'react-native-svg'
import { format, differenceInCalendarDays, parseISO, subDays, eachDayOfInterval, getMonth } from 'date-fns'
import { useDataStore } from '../stores/data'
import { useToastStore } from '../stores/toasts'
import { useTheme } from '../context/ThemeContext'
import { totalMonthlySpend, coffees, isTrialExpiring } from '../utils/calculations'
import { buildMonthlyBars } from '../utils/chart'
import { computeDropIndex } from '../utils/dragReorder'
import { Modal } from '../components/ui/Modal'
import { Button, IconButton, usePrimaryFg } from '../components/ui/Button'
import { Widget, WidgetRow } from '../components/ui/Widget'
import { EditableWidget } from '../components/dashboard/EditableWidget'
import { HiddenWidgetTray } from '../components/dashboard/HiddenWidgetTray'
import { BreakdownWidget, BreakdownItem } from '../components/widgets/BreakdownWidget'
import { RingGoalWidget } from '../components/widgets/RingGoalWidget'
import { LineTrendWidget } from '../components/widgets/LineTrendWidget'
import { CategoryRingsWidget, RingItem } from '../components/widgets/CategoryRingsWidget'
import { SpendTrendWidget } from '../components/widgets/SpendTrendWidget'
import { ClockWidget } from '../components/widgets/ClockWidget'
import { RadarWidget, RadarCategory } from '../components/widgets/RadarWidget'
import { BudgetWidget }         from '../components/widgets/BudgetWidget'
import { ForecastWidget }       from '../components/widgets/ForecastWidget'
import { ScoreWidget }          from '../components/widgets/ScoreWidget'
import { TopExpensesWidget }    from '../components/widgets/TopExpensesWidget'
import { AnomalyWidget }        from '../components/widgets/AnomalyWidget'
import { buildForecast }        from '../utils/forecast'
import { AddTrackForm } from '../components/forms/AddTrackForm'
import { AddTaskForm } from '../components/forms/AddTaskForm'
import { theme, CURRENCY_SYMBOL, Colors } from '../theme'

// ── Press / hover wrapper ──────────────────────────────────────────────
function PressCard({ style, hoverStyle, onPress, children, disabled }: {
  style?: any
  hoverStyle?: any
  onPress?: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  const scale = useSharedValue(1)
  const [hovered, setHovered] = useState(false)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isWeb = Platform.OS === 'web'
  return (
    <Pressable
      onPressIn={()  => { if (!disabled) scale.value = withSpring(0.96, { damping: 18, stiffness: 420 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 420 }) }}
      onHoverIn={()  => { if (!disabled && isWeb) { setHovered(true);  scale.value = withSpring(1.025, { damping: 22, stiffness: 360 }) } }}
      onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }) } }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, hovered && isWeb ? hoverStyle : null, animStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}

// ── Count-up hook for animated numeric values ─────────────────────────
function useCountUp(target: number, duration = 700): number {
  const [v, setV] = useState(0)
  const prevRef = useRef(0)
  useEffect(() => {
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now())
    const from  = prevRef.current
    const to    = target
    if (from === to) return
    let raf = 0
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = easeOutCubic(t)
      setV(from + (to - from) * eased)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

// ── Ring badge ─────────────────────────────────────────────────────────
function RingBadge({ value, max = 20, size = 56, colors }: { value: number; max?: number; size?: number; colors: Colors }) {
  const stroke = Math.max(3, Math.round(size * 0.045))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const isDark = colors.bg !== '#F2F1EE'
  // Number scales with the ring — keeps the proportion identical at any size
  const numSize = Math.round(size * 0.36)
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <SvgCircle cx={size/2} cy={size/2} r={r} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth={stroke} fill="none" />
        {pct > 0 && <SvgCircle cx={size/2} cy={size/2} r={r} stroke={colors.accent} strokeWidth={stroke} fill="none" strokeDasharray={`${circ*pct} ${circ*(1-pct)}`} strokeLinecap="round" />}
      </Svg>
      <Text style={{ fontSize: numSize, fontFamily: theme.fontMonoBold, color: colors.text, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  )
}

// ── Activity heatmap ───────────────────────────────────────────────────
const HM_GAP = 3, HM_CELL_TARGET = 11, HM_MAX_WEEKS = 26

function buildHeatmap(subs: any[], events: any[], weeks: number) {
  const today = new Date(), start = subDays(today, weeks * 7 - 1)
  const map: Record<string, number> = {}
  for (const s of subs) if (s.nextChargeDate) map[s.nextChargeDate] = (map[s.nextChargeDate] || 0) + 1
  for (const e of events) if (e.date) map[e.date] = (map[e.date] || 0) + 1
  const cols: { date: string; count: number }[][] = []; let week: { date: string; count: number }[] = []
  for (const d of eachDayOfInterval({ start, end: today })) {
    const ds = format(d, 'yyyy-MM-dd'); week.push({ date: ds, count: map[ds] || 0 })
    if (week.length === 7) { cols.push(week); week = [] }
  }
  if (week.length > 0) { while (week.length < 7) week.push({ date: '', count: 0 }); cols.push(week) }
  return cols
}

function ActivityHeatmap({ subs, events, colors }: { subs: any[]; events: any[]; colors: Colors }) {
  const isDark = colors.bg !== '#F2F1EE'
  const [containerW, setContainerW] = useState(0)

  // Fit as many weeks as possible at target cell size; fill remaining width
  const weeksToShow = containerW > 0
    ? Math.min(HM_MAX_WEEKS, Math.floor((containerW + HM_GAP) / (HM_CELL_TARGET + HM_GAP)))
    : HM_MAX_WEEKS
  const cellSize = containerW > 0
    ? Math.floor((containerW + HM_GAP) / weeksToShow) - HM_GAP
    : HM_CELL_TARGET
  const radius = Math.max(2, Math.round(cellSize * 0.28))

  const cols = useMemo(() => buildHeatmap(subs, events, weeksToShow), [subs, events, weeksToShow])
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []; let last = -1
    cols.forEach((week, ci) => {
      if (!week[0]?.date) return
      const m = getMonth(parseISO(week[0].date))
      if (m !== last) { labels.push({ col: ci, label: format(parseISO(week[0].date), 'MMM') }); last = m }
    })
    return labels
  }, [cols])

  const dotColor = (count: number) => isDark
    ? (!count ? 'rgba(255,255,255,0.07)' : count===1 ? 'rgba(255,255,255,0.28)' : count===2 ? colors.accentRed+'88' : colors.accentRed)
    : (!count ? 'rgba(0,0,0,0.07)' : count===1 ? 'rgba(0,0,0,0.28)' : count===2 ? 'rgba(0,0,0,0.55)' : '#111')

  return (
    <View onLayout={e => setContainerW(e.nativeEvent.layout.width)}>
      <View style={{ height: 16, marginBottom: 5 }}>
        {monthLabels.map((ml, i) => (
          <Text key={i} style={[hm.label, { position:'absolute', left: ml.col*(cellSize+HM_GAP), color: isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.35)' }]}>{ml.label}</Text>
        ))}
      </View>
      <View style={{ flexDirection:'row', gap:HM_GAP }}>
        {cols.map((week, ci) => (
          <View key={ci} style={{ gap:HM_GAP }}>
            {week.map((cell, ri) => (
              <View key={ri} style={{ width:cellSize, height:cellSize, borderRadius:radius, backgroundColor:dotColor(cell.count) }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}
const hm = StyleSheet.create({
  label: { fontSize: 9, fontFamily: theme.fontMono, letterSpacing: 0.3 },
})

// ── Subscription row ───────────────────────────────────────────────────
function SubRow({ sub, symbol, diff, onRemove, onEdit, delay, colors }: { sub: any; symbol: string; diff: number; onRemove: () => void; onEdit?: () => void; delay: number; colors: Colors }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  // accentRed is reserved for "due today" and OVERDUE — everything else is graphite
  const isToday   = diff === 0
  const isOverdue = diff < 0
  const dueColor = (isToday || isOverdue) ? colors.accentRed : colors.textMuted
  const dueLabel = isOverdue
    ? (diff === -1 ? 'overdue 1d' : `overdue ${-diff}d`)
    : isToday ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff}d`
  const trialExpiring = isTrialExpiring(sub)
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98,{damping:16,stiffness:380}) }}
        onPressOut={() => { scale.value = withSpring(1,{damping:16,stiffness:380}) }}
        onPress={onEdit}
        onLongPress={onRemove}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${sub.name}`}
      >
        <Animated.View style={[
          sr.row,
          { borderBottomColor: colors.border },
          isOverdue && { backgroundColor: colors.accentRed + '12', borderRadius: theme.radiusMd, paddingHorizontal: 6 },
          animStyle,
        ]}>
          <View style={[sr.badge, { backgroundColor: isOverdue ? colors.accentRed + '22' : colors.surfaceEl }]}><Text style={sr.emoji}>{sub.emoji ?? '💳'}</Text></View>
          <View style={sr.body}>
            <Text style={[sr.name, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
            <View style={sr.metaRow}>
              <Text style={[sr.dueText, { color: dueColor, fontFamily: isOverdue ? theme.fontMonoBold : theme.fontMono }]}>· {dueLabel}</Text>
              {sub.category ? <Text style={[sr.cat, { color: colors.textFaint }]}>{sub.category}</Text> : null}
              {trialExpiring && <Text style={[sr.trial, { color: colors.warning }]}>trial</Text>}
            </View>
          </View>
          <View style={sr.right}>
            <Text style={[sr.price, { color: colors.text }]}>{symbol}{sub.price}</Text>
            <Text style={[sr.cycle, { color: colors.textMuted }]}>{sub.billingCycle ?? 'mo'}</Text>
          </View>
          <IconButton variant="secondary" size="sm" onPress={onRemove} accessibilityLabel="Remove">
            <View style={[sr.removeLine, { backgroundColor: colors.textMuted }]} />
            <View style={[sr.removeLine, { backgroundColor: colors.textMuted, transform:[{rotate:'90deg'}], position:'absolute' }]} />
          </IconButton>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const sr = StyleSheet.create({
  row:       { flexDirection:'row', alignItems:'center', gap:theme.sp3, paddingVertical:theme.sp3, borderBottomWidth:StyleSheet.hairlineWidth },
  badge:     { width:40, height:40, borderRadius:theme.radiusMd, alignItems:'center', justifyContent:'center' },
  emoji:     { fontSize:20 },
  body:      { flex:1, minWidth:0, gap:4 },
  name:      { fontSize:theme.textBase, fontFamily:theme.fontBold, letterSpacing:-0.3 },
  metaRow:   { flexDirection:'row', alignItems:'baseline', gap:8 },
  // Quiet "· today" / "· in 3d" marker — accentRed only when isToday
  dueText:   { fontSize:11, fontFamily:theme.fontMono, letterSpacing:0.2 },
  cat:       { fontSize:10, fontFamily:theme.fontRegular },
  right:     { alignItems:'flex-end', gap:2 },
  price:     { fontSize:theme.textBase, fontFamily:theme.fontMono, letterSpacing:-0.5 },
  cycle:     { fontSize:10, fontFamily:theme.fontMono, opacity:0.7 },
  removeBtn: { width:24, height:24, borderRadius:12, alignItems:'center', justifyContent:'center', opacity:0.5 },
  removeLine:{ width:10, height:StyleSheet.hairlineWidth, borderRadius:1 },
  trial:     { fontSize:9, fontFamily:theme.fontBold, letterSpacing:0.6, textTransform:'uppercase', paddingHorizontal:5, paddingVertical:1 },
})

// ── Task row ───────────────────────────────────────────────────────────
function TaskRow({ task, delay, onToggle, onRemove, onEdit, colors }: { task: any; delay: number; onToggle: () => void; onRemove: () => void; onEdit?: () => void; colors: Colors }) {
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)} style={[sr.row, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={[tr.box, { borderColor:colors.borderStrong, backgroundColor:colors.surfaceEl }, task.done && { backgroundColor:colors.accent, borderColor:colors.accent }]} onPress={onToggle} accessibilityRole="checkbox">
        {task.done && <Animated.Text entering={ZoomIn.springify().damping(12).stiffness(300)} style={[tr.check, { color:colors.accentFg }]}>✓</Animated.Text>}
      </TouchableOpacity>
      <Pressable
        style={{ flex:1, minWidth:0 }}
        onPress={onEdit}
        onLongPress={onRemove}
        delayLongPress={500}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${task.name}`}
      >
        <Text style={[sr.name, { color:colors.text }, task.done && { color:colors.textMuted, textDecorationLine:'line-through' }]}>{task.name}</Text>
        {task.note ? <Text style={[sr.cat, { color:colors.textFaint }]}>{task.note}</Text> : null}
      </Pressable>
      <IconButton variant="secondary" size="sm" onPress={onRemove} accessibilityLabel="Remove">
        <View style={[sr.removeLine, { backgroundColor:colors.textMuted }]} />
        <View style={[sr.removeLine, { backgroundColor:colors.textMuted, transform:[{rotate:'90deg'}], position:'absolute' }]} />
      </IconButton>
    </Animated.View>
  )
}
const tr = StyleSheet.create({
  box:   { width:20, height:20, borderRadius:6, borderWidth:StyleSheet.hairlineWidth, alignItems:'center', justifyContent:'center' },
  check: { fontSize:12, fontFamily:theme.fontBold },
})

// ── Ledger stat (notebook desktop) ─────────────────────────────────────
function Stat({ value, unit, label, colors }: { value: string; unit?: string; label: string; colors: Colors }) {
  const numeric = Number(value)
  const animatable = Number.isFinite(numeric)
  const animated = useCountUp(animatable ? numeric : 0)
  const display  = animatable ? Math.round(animated).toLocaleString() : value
  return (
    <View style={statS.cell}>
      <View style={statS.numRow}>
        <Text style={[statS.value, { color: colors.text }]}>{display}</Text>
        {unit ? <Text style={[statS.unit, { color: colors.textMuted }]}>{unit}</Text> : null}
      </View>
      <Text style={[statS.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  )
}
const statS = StyleSheet.create({
  cell:   { flex: 1, gap: 4 },
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  value:  { fontFamily: theme.fontMono, fontSize: 30, letterSpacing: -1, lineHeight: 32 },
  unit:   { fontFamily: theme.fontMono, fontSize: 13 },
  label:  { fontFamily: theme.fontMedium, fontSize: 10, letterSpacing: 1.6, textTransform: 'lowercase' },
})

// ── Dashboard ──────────────────────────────────────────────────────────
// MONO widget grid: each entry is either a 'square' (1×1, paired in rows of 2)
// or a 'rectangle' (2×1, full row).
type WKey =
  | 'active' | 'spend' | 'coffees' | 'events' | 'topExpense' | 'ytd' | 'monthGoal' | 'clock'
  | 'categoryRings'
  | 'heatmap' | 'due' | 'category' | 'upcoming' | 'spendTrend' | 'radar' | 'budget' | 'forecast'
  | 'score' | 'topExpenses' | 'anomaly'

const WIDGET_SIZE: Record<WKey, 'square' | 'rectangle'> = {
  active:        'square',
  spend:         'square',
  coffees:       'square',
  events:        'square',
  topExpense:    'square',
  ytd:           'square',
  monthGoal:     'square',
  clock:         'square',
  categoryRings: 'square',
  heatmap:       'rectangle',
  due:           'rectangle',
  category:      'rectangle',
  upcoming:      'rectangle',
  spendTrend:    'rectangle',
  radar:         'rectangle',
  budget:        'rectangle',
  forecast:      'rectangle',
  score:         'square',
  topExpenses:   'rectangle',
  anomaly:       'rectangle',
}

const WIDGET_DELAY: Record<WKey, number> = {
  active: 60,  spend: 90,    monthGoal: 120, clock: 150,
  heatmap: 180, due: 210,    spendTrend: 240, category: 270,
  coffees: 300, events: 330, upcoming: 360,
  topExpense: 390, ytd: 420,  radar: 450, categoryRings: 480,
  budget: 500, forecast: 520, score: 540, topExpenses: 560, anomaly: 580,
}

const ALL_KEYS: WKey[] = Object.keys(WIDGET_SIZE) as WKey[]

const WIDGET_META: Record<WKey, { label: string; emoji: string }> = {
  active:        { label: 'active',         emoji: '📊' },
  spend:         { label: 'spend',          emoji: '💸' },
  coffees:       { label: 'coffees',        emoji: '☕' },
  events:        { label: 'events',         emoji: '📅' },
  topExpense:    { label: 'top expense',    emoji: '🥇' },
  ytd:           { label: 'YTD',            emoji: '🗓️' },
  monthGoal:     { label: 'month goal',     emoji: '🎯' },
  clock:         { label: 'clock',          emoji: '🕐' },
  categoryRings: { label: 'top categories', emoji: '⭕' },
  heatmap:       { label: 'heatmap',        emoji: '🟩' },
  due:           { label: 'this week',      emoji: '📌' },
  category:      { label: 'by category',    emoji: '📈' },
  upcoming:      { label: 'upcoming',       emoji: '⏭️' },
  spendTrend:    { label: 'spend trend',    emoji: '📉' },
  radar:         { label: 'radar',          emoji: '🕸️' },
  budget:        { label: 'budget',         emoji: '🎯' },
  forecast:      { label: 'forecast',       emoji: '📆' },
  score:         { label: 'score',          emoji: '🏅' },
  topExpenses:   { label: 'top expenses',   emoji: '💰' },
  anomaly:       { label: 'patterns',       emoji: '📊' },
}

export function Dashboard() {
  const { colors } = useTheme()
  const primaryFg = usePrimaryFg()
  const store = useDataStore()
  const toast = useToastStore()
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 768

  const now   = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const month = format(now, 'yyyy-MM')

  const currency = store.settings.defaultCurrency ?? 'EUR'
  const symbol   = CURRENCY_SYMBOL[currency] ?? ''

  const monthly     = useMemo(() => totalMonthlySpend(store.subscriptions), [store.subscriptions])
  const coffeeCount = useMemo(() => coffees(monthly), [monthly])
  const monthEvents = useMemo(() => store.events.filter((e: any) => e.date?.startsWith(month)), [store.events, month])
  const todayTasks  = useMemo(() => store.tasks.filter((t: any) => t.dueDate === today), [store.tasks, today])
  // Includes overdue (diff < 0) AND next 7 days; overdue pinned to the top.
  const dueSubs     = useMemo(() => {
    return store.subscriptions
      .filter((s: any) => s.active !== false && s.nextChargeDate)
      .map((s: any) => ({ s, diff: differenceInCalendarDays(parseISO(s.nextChargeDate), now) }))
      .filter(({ diff }) => diff < 0 || diff <= 7)
      .sort((a, b) => a.diff - b.diff)
      .map(({ s }) => s)
  }, [store.subscriptions])
  const activeSubs  = useMemo(() => store.subscriptions.filter((s: any) => s.active !== false), [store.subscriptions])

  const forecastItems = useMemo(() => activeSubs.map((s: any) => ({
    name:           s.name,
    emoji:          s.emoji ?? '💳',
    price:          s.price ?? 0,
    billingCycle:   s.billingCycle ?? 'monthly',
    nextChargeDate: s.nextChargeDate ?? format(new Date(), 'yyyy-MM-dd'),
    active:         true,
  })), [activeSubs])

  // Top expense (square widget)
  const topExpense = useMemo(() => {
    return [...activeSubs].sort((a: any, b: any) => (b.price || 0) - (a.price || 0))[0] ?? null
  }, [activeSubs])

  // Year-to-date approximation: monthly × months elapsed
  const ytdSpend = useMemo(() => monthly * (now.getMonth() + 1), [monthly, now])

  // Monthly target — soft goal = 1.25× current monthly spend (until a real budget exists)
  const monthlyTarget = useMemo(() => Math.max(Math.ceil(monthly * 1.25 / 10) * 10, 50), [monthly])

  // Spend trend — driven by the SAME `buildMonthlyBars` the Analytics
  // page uses, with both `bars` (this period) and `compBars` (previous
  // period) so the dashboard widget can render the same dashed
  // comparison line. Matches Analytics' default '6M' range:
  // back=4, ahead=2 → 7 bars, current month centered at index 4.
  const spendBars = useMemo(
    () => buildMonthlyBars(store.subscriptions, 4, 2, 0),
    [store.subscriptions]
  )
  const spendCompBars = useMemo(
    () => buildMonthlyBars(store.subscriptions, 4, 2, 7),
    [store.subscriptions]
  )

  // Radar — spending share per category (normalized to 0..1 vs the top category)
  const radarCategories = useMemo<RadarCategory[]>(() => {
    const totals: Record<string, number> = {}
    for (const sub of activeSubs as any[]) {
      const cat = sub.category || 'Other'
      totals[cat] = (totals[cat] || 0) + (sub.price || 0)
    }
    const entries = Object.entries(totals).filter(([, v]) => v > 0)
    const max = Math.max(...entries.map(([, v]) => v), 0.01)
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, pct: value / max }))
  }, [activeSubs])

  // Category breakdown — for the Breakdown widget (Traffic-source style)
  const categoryBreakdown = useMemo<BreakdownItem[]>(() => {
    const byCat: Record<string, { value: number; color: string }> = {}
    for (const sub of activeSubs as any[]) {
      const cat = sub.category || 'Other'
      if (!byCat[cat]) byCat[cat] = { value: 0, color: sub.color || colors.accent }
      byCat[cat].value += (sub.price || 0)
    }
    return Object.entries(byCat)
      .map(([label, { value, color }]) => ({ label, value, color }))
      .sort((a, b) => b.value - a.value)
  }, [activeSubs, colors.accent])

  // Top 4 categories as rings — share of total monthly spend (0..1)
  const categoryRingItems = useMemo<RingItem[]>(() => {
    const total = categoryBreakdown.reduce((s, it) => s + it.value, 0)
    if (total <= 0) return []
    const emojiByCat: Record<string, string> = {
      Productivity: '💼', Gaming: '🎮', Streaming: '📺', Music: '🎵',
      Fitness: '💪', Other: '📦', Food: '🍽️', Travel: '✈️', Health: '⚕️',
    }
    return categoryBreakdown.slice(0, 4).map(it => ({
      label: it.label,
      pct:   it.value / total,
      color: it.color,
      emoji: emojiByCat[it.label],
    }))
  }, [categoryBreakdown])

  // Upcoming next 30 days
  const upcomingList = useMemo(() => {
    const out: Array<{ emoji: string; name: string; date: string; kind: 'sub' | 'event' | 'task'; price?: number; currency?: string }> = []
    for (const sub of activeSubs as any[]) {
      if (!sub.nextChargeDate) continue
      const d = differenceInCalendarDays(parseISO(sub.nextChargeDate), now)
      if (d >= 0 && d <= 30) out.push({ emoji: sub.emoji ?? '💳', name: sub.name, date: sub.nextChargeDate, kind: 'sub', price: sub.price, currency: sub.currency })
    }
    for (const ev of store.events as any[]) {
      if (!ev.date) continue
      const d = differenceInCalendarDays(parseISO(ev.date), now)
      if (d >= 0 && d <= 30) out.push({ emoji: ev.emoji ?? '📅', name: ev.name, date: ev.date, kind: 'event' })
    }
    return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  }, [activeSubs, store.events, now])

  const [showAddTrack, setShowAddTrack] = useState(false)
  const [showAddTask, setShowAddTask]   = useState(false)
  const [editTrack, setEditTrack]       = useState<any | null>(null)
  const [editTask, setEditTask]         = useState<any | null>(null)
  const [confirm, setConfirm]           = useState<{ kind: string; id: string; name: string } | null>(null)

  // ── Widget ordering ────────────────────────────────────────────────
  const [editMode, setEditMode]       = useState(false)
  const [draggingId, setDraggingId]   = useState<WKey | null>(null)
  const [dropTargetId, setDropTargetId] = useState<WKey | null>(null)
  // Refs mirror state so gesture callbacks (useCallback with [] deps) always
  // see the current value without needing to re-create the callback.
  const draggingIdRef   = useRef<WKey | null>(null)
  const dropTargetIdRef = useRef<WKey | null>(null)
  const layoutsRef  = useRef<Map<WKey, { top: number; height: number }>>(new Map())
  const scrollYRef  = useRef(0)
  const cursorAbsYRef = useRef(0)
  const scrollRef   = useRef<ScrollView>(null)
  const [order, setOrder]       = useState<WKey[]>([
    'active', 'spend',              // squares row
    'monthGoal', 'clock',           // squares row (ring goal + analog clock)
    'heatmap',                      // rectangle
    'budget',                       // rectangle (monthly budget vs spend)
    'forecast',                     // rectangle (30-day charge forecast)
    'due',                          // rectangle
    'spendTrend',                   // rectangle (line chart — LineTrend)
    'coffees', 'events',            // squares row
    'category',                     // rectangle (Breakdown — Traffic source style)
    'categoryRings', 'topExpense',  // squares row (rings + top expense)
    'radar',                        // rectangle (Radar — by category)
    'topExpenses',                  // rectangle (top 5 expenses)
    'upcoming',                     // rectangle
    'score', 'ytd',                 // squares row (financial score + year-to-date)
    'anomaly',                      // rectangle (spending pattern anomalies)
  ])

  const handleEnterEdit = React.useCallback(() => {
    setEditMode(true)
  }, [])

  const handleDragStart = React.useCallback((id: WKey) => {
    draggingIdRef.current = id
    setDraggingId(id)
  }, [])

  const handleDragMove = React.useCallback((id: WKey, absoluteY: number) => {
    cursorAbsYRef.current = absoluteY
    const contentY = absoluteY + scrollYRef.current
    let nearest: WKey | null = null
    let minDist = Infinity
    for (const [k, rect] of layoutsRef.current) {
      if (k === id) continue
      const dist = Math.abs((rect.top + rect.height / 2) - contentY)
      if (dist < minDist) { minDist = dist; nearest = k as WKey }
    }
    if (nearest !== dropTargetIdRef.current) {
      dropTargetIdRef.current = nearest
      setDropTargetId(nearest)
    }
  }, [])

  const handleDragEnd = React.useCallback(() => {
    const dragId   = draggingIdRef.current
    const targetId = dropTargetIdRef.current
    if (dragId && targetId && dragId !== targetId) {
      setOrder(prev => {
        const out = [...prev]
        const ai = out.indexOf(dragId)
        const bi = out.indexOf(targetId)
        if (ai !== -1 && bi !== -1) { [out[ai], out[bi]] = [out[bi], out[ai]] }
        return out
      })
    }
    draggingIdRef.current   = null
    dropTargetIdRef.current = null
    setDraggingId(null)
    setDropTargetId(null)
  }, [])

  const handleMeasure = React.useCallback((id: WKey, top: number, height: number) => {
    layoutsRef.current.set(id, { top: top + scrollYRef.current, height })
  }, [])

  // Auto-scroll: while dragging, if the cursor is within EDGE_THRESHOLD of the
  // viewport top or bottom, programmatically scroll the page so the user can
  // drop a widget into positions that are currently off-screen.
  useEffect(() => {
    if (!draggingId) return
    const EDGE_THRESHOLD = 90
    const MAX_SPEED      = 14   // px per frame at the very edge
    let raf = 0
    function step() {
      const viewportH = Dimensions.get('window').height
      const y = cursorAbsYRef.current
      let dy = 0
      if (y < EDGE_THRESHOLD) {
        // Linearly ramp speed: 0 at threshold, MAX at edge
        const k = 1 - y / EDGE_THRESHOLD
        dy = -Math.round(MAX_SPEED * k)
      } else if (y > viewportH - EDGE_THRESHOLD) {
        const k = (y - (viewportH - EDGE_THRESHOLD)) / EDGE_THRESHOLD
        dy =  Math.round(MAX_SPEED * Math.min(k, 1))
      }
      if (dy !== 0 && scrollRef.current) {
        const next = Math.max(0, scrollYRef.current + dy)
        scrollRef.current.scrollTo({ y: next, animated: false })
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [draggingId])

  function handleAddTrack(data: any) {
    if (data.type === 'subscription') { store.addSubscription(data); toast.push('Subscription added', 'success') }
    else if (data.type === 'app') { store.addApp(data); toast.push('App added', 'success') }
    else if (data.type === 'event') { store.addEvent(data); toast.push('Event added', 'success') }
    setShowAddTrack(false)
  }
  function handleAddTask(data: any) { store.addTask(data); toast.push('Task added', 'success'); setShowAddTask(false) }
  function handleEditTrack(data: any) {
    if (!editTrack) return
    const id = editTrack.id
    if (editTrack.type === 'subscription') store.updateSubscription(id, data)
    else if (editTrack.type === 'app') store.updateApp(id, data)
    else if (editTrack.type === 'event') store.updateEvent(id, data)
    toast.push('Saved', 'success')
    setEditTrack(null)
  }
  function handleEditTask(data: any) {
    if (!editTask) return
    store.updateTask(editTask.id, data)
    toast.push('Saved', 'success')
    setEditTask(null)
  }
  function confirmRemove() {
    if (!confirm) return
    if (confirm.kind === 'sub') { store.removeSubscription(confirm.id); toast.push(`Removed ${confirm.name}`) }
    else if (confirm.kind === 'task') { store.removeTask(confirm.id); toast.push(`Removed ${confirm.name}`) }
    setConfirm(null)
  }

  const dotColor  = colors.text
  const hasItems  = dueSubs.length > 0 || todayTasks.length > 0

  // ── Single widget content (no wrapper) ────────────────────────────
  function renderSingle(id: WKey): React.ReactNode {
    switch (id) {
      case 'active':
        return (
          <Widget tag="active subscriptions" size="square">
            <View style={s.metricCenter}>
              <RingBadge value={activeSubs.length} max={Math.max(activeSubs.length+4, 10)} size={110} colors={colors} />
            </View>
          </Widget>
        )
      case 'spend':
        return (
          <Widget tag="this month" size="square">
            <View style={s.metricCenter}>
              <View style={s.spendBlock}>
                <Text style={[s.spendMain, { color:colors.text }]}>{monthly.toFixed(0)}</Text>
                <Text style={[s.spendUnit, { color:colors.textMuted }]}>{symbol}</Text>
              </View>
            </View>
          </Widget>
        )
      case 'coffees':
        return (
          <Widget tag="coffees / mo" size="square">
            <View style={s.metricCenter}>
              <Text style={[s.statNum, { color:colors.text }]}>{coffeeCount}</Text>
              <Text style={[s.statSub, { color:colors.textFaint }]}>at {symbol}{store.settings.coffeePrice?.toFixed(2)}</Text>
            </View>
          </Widget>
        )
      case 'events':
        return (
          <Widget tag="events this month" size="square">
            <View style={s.metricCenter}>
              <Animated.Text entering={ZoomIn.delay(280).springify().damping(12).stiffness(260)} style={[s.statNum, { color:colors.text }]}>{monthEvents.length}</Animated.Text>
              <Text style={[s.statSub, { color:colors.textFaint }]}>{format(now, 'MMMM').toLowerCase()}</Text>
            </View>
          </Widget>
        )
      case 'topExpense':
        return (
          <Widget tag="top expense" size="square">
            <View style={s.metricCenter}>
              {topExpense ? (
                <>
                  <Text style={[s.topName, { color:colors.text }]} numberOfLines={1}>
                    {topExpense.emoji ?? '💳'}  {topExpense.name}
                  </Text>
                  <Text style={[s.topPrice, { color:colors.text }]}>
                    {symbol}{Number(topExpense.price || 0).toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text style={[s.statSub, { color:colors.textFaint }]}>no active subs</Text>
              )}
            </View>
          </Widget>
        )
      case 'ytd':
        return (
          <Widget tag="year-to-date" size="square">
            <View style={s.metricCenter}>
              <View style={s.spendBlock}>
                <Text style={[s.spendMain, { color:colors.text }]}>{ytdSpend.toFixed(0)}</Text>
                <Text style={[s.spendUnit, { color:colors.textMuted }]}>{symbol}</Text>
              </View>
              <Text style={[s.statSub, { color:colors.textFaint }]}>jan → {format(now, 'MMM').toLowerCase()}</Text>
            </View>
          </Widget>
        )
      case 'monthGoal':
        return (
          <RingGoalWidget
            tag="monthly target"
            value={monthly}
            target={monthlyTarget}
            unit={symbol}
            label="this month"
          />
        )
      case 'clock':
        return <ClockWidget tag="now" />
      case 'spendTrend':
        return (
          <SpendTrendWidget
            tag="trend"
            title="spend"
            bars={spendBars}
            compBars={spendCompBars}
            unit={symbol}
            invertDelta
          />
        )
      case 'heatmap':
        return (
          <Widget tag="the year, in dots" size="rectangle">
            <ActivityHeatmap subs={store.subscriptions} events={store.events} colors={colors} />
          </Widget>
        )
      case 'due':
        return (
          <Widget
            tag="this week"
            size="rectangle"
            action={<Button label="+ add" variant="primary" size="sm" onPress={() => setShowAddTrack(true)} />}
          >
            {!hasItems && <Text style={[s.empty, { color:colors.textFaint }]}>nothing due in the next 7 days</Text>}
            {dueSubs.map((sub: any, i: number) => (
              <SubRow
                key={sub.id}
                sub={sub}
                symbol={symbol}
                diff={differenceInCalendarDays(parseISO(sub.nextChargeDate), now)}
                delay={200+i*40}
                colors={colors}
                onEdit={() => setEditTrack({ ...sub, type: sub.type ?? 'subscription' })}
                onRemove={() => setConfirm({ kind:'sub', id:sub.id, name:sub.name })}
              />
            ))}
            {todayTasks.map((task: any, i: number) => (
              <TaskRow
                key={task.id}
                task={task}
                delay={300+i*40}
                colors={colors}
                onToggle={() => store.updateTask(task.id, { done: !task.done })}
                onEdit={() => setEditTask(task)}
                onRemove={() => setConfirm({ kind:'task', id:task.id, name:task.name })}
              />
            ))}
          </Widget>
        )
      case 'category':
        return (
          <BreakdownWidget
            tag="stats"
            title="by category"
            items={categoryBreakdown}
            unit={symbol}
          />
        )
      case 'categoryRings':
        return (
          <CategoryRingsWidget
            tag="top categories"
            items={categoryRingItems}
          />
        )
      case 'radar':
        return (
          <RadarWidget
            tag="stats"
            title="Breakdown by category"
            categories={radarCategories}
          />
        )
      case 'upcoming':
        return (
          <Widget tag="upcoming · next 30 days" size="rectangle">
            {upcomingList.length === 0 ? (
              <Text style={[s.empty, { color:colors.textFaint }]}>nothing in the next 30 days</Text>
            ) : upcomingList.map((it, i) => {
              const isLast = i === upcomingList.length - 1
              const dt = parseISO(it.date)
              const diff = differenceInCalendarDays(dt, now)
              const when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff}d`
              return (
                <View key={`${it.date}-${i}`}>
                  <View style={s.upRow}>
                    <Text style={s.upEmoji}>{it.emoji}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[s.upName, { color: colors.text }]} numberOfLines={1}>{it.name}</Text>
                      <Text style={[s.upMeta, { color: colors.textMuted }]}>{format(dt, 'EEE · d MMM').toLowerCase()} · {when}</Text>
                    </View>
                    {it.kind === 'sub' && it.price != null ? (
                      <Text style={[s.upPrice, { color: colors.text }]}>{symbol}{it.price.toFixed(2)}</Text>
                    ) : (
                      <Text style={[s.upTag, { color: colors.textMuted }]}>event</Text>
                    )}
                  </View>
                  {!isLast && <View style={[s.upRule, { backgroundColor: colors.border }]} />}
                </View>
              )
            })}
          </Widget>
        )
      case 'budget':
        return (
          <BudgetWidget
            spent={monthly}
            budget={store.settings.monthlyBudget ?? null}
            currency={currency}
          />
        )
      case 'forecast':
        return (
          <ForecastWidget
            items={forecastItems}
            symbol={symbol}
          />
        )
      case 'score':
        return (
          <ScoreWidget
            subscriptions={store.subscriptions}
            tasks={store.tasks}
            monthlyBudget={store.settings.monthlyBudget ?? null}
            monthlySpend={monthly}
          />
        )
      case 'topExpenses':
        return (
          <TopExpensesWidget
            subscriptions={store.subscriptions}
            symbol={symbol}
          />
        )
      case 'anomaly':
        return <AnomalyWidget subscriptions={store.subscriptions} />
    }
  }

  // Wrap a widget with reorder bar + animation. `fill` propagates flex:1
  // through both wrappers so square widgets actually take half the row.
  function wrapWidget(id: WKey, content: React.ReactNode, _idx: number, fill = false): React.ReactNode {
    const fillStyle = fill ? { flex: 1 } : undefined
    return (
      <Animated.View
        key={id}
        layout={LinearTransition.springify().damping(22).stiffness(220)}
        style={fillStyle}
      >
        <EditableWidget
          id={id}
          editMode={editMode}
          isDragging={draggingId === id}
          isDropTarget={dropTargetId === id}
          onRemove={() => setOrder(prev => prev.filter(k => k !== id))}
          onEnterEdit={handleEnterEdit}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onMeasure={handleMeasure}
        >
          {content}
        </EditableWidget>
      </Animated.View>
    )
  }

  // Auto-pair consecutive squares into rows (mono layout rule)
  function renderAll(): React.ReactNode[] {
    const out: React.ReactNode[] = []
    let pending: { id: WKey; node: React.ReactNode; idx: number } | null = null

    for (const [idx, id] of order.entries()) {
      const node = renderSingle(id)
      if (WIDGET_SIZE[id] === 'square') {
        if (pending) {
          out.push(
            <View key={`row-${pending.id}-${id}`} style={s.squareRow}>
              {wrapWidget(pending.id, pending.node, pending.idx, true)}
              {wrapWidget(id, node, idx, true)}
            </View>
          )
          pending = null
        } else {
          pending = { id, node, idx }
        }
      } else {
        if (pending) {
          // Lone trailing square: render on its own (half row, left-aligned)
          out.push(
            <View key={`row-${pending.id}-solo`} style={s.squareRow}>
              {wrapWidget(pending.id, pending.node, pending.idx, true)}
              <View style={{ flex: 1 }} />
            </View>
          )
          pending = null
        }
        out.push(wrapWidget(id, node, idx, false))
      }
    }
    if (pending) {
      out.push(
        <View key={`row-${pending.id}-solo`} style={s.squareRow}>
          {wrapWidget(pending.id, pending.node, pending.idx, true)}
          <View style={{ flex: 1 }} />
        </View>
      )
    }
    return out
  }

  const header = (
    <MotiView from={{ opacity:0, translateY:-8 }} animate={{ opacity:1, translateY:0 }} transition={{ type:'spring', damping:20, stiffness:200 }} style={s.header}>
      <Text style={[s.pageTitle, { color:colors.text }]}>Track</Text>
      <View style={s.headerBtns}>
        {editMode ? (
          <IconButton variant="primary" size="md" onPress={() => setEditMode(false)} accessibilityLabel="Done editing layout">
            <Text style={{ color: primaryFg, fontSize: 13, fontFamily: theme.fontBold, paddingHorizontal: 6 }}>Done</Text>
          </IconButton>
        ) : (
          <IconButton variant="primary" size="md" onPress={() => setEditMode(true)} accessibilityLabel="Edit layout">
            <View style={{ gap:3 }}>
              <View style={{ flexDirection:'row', gap:3 }}>
                {[8,8].map((w,i) => <View key={i} style={{ width:w, height:8, borderRadius:2, backgroundColor:primaryFg }} />)}
              </View>
              <View style={{ flexDirection:'row', gap:3 }}>
                {[8,8].map((w,i) => <View key={i} style={{ width:w, height:8, borderRadius:2, backgroundColor:primaryFg }} />)}
              </View>
            </View>
          </IconButton>
        )}
        {!editMode && (
          <IconButton variant="primary" size="md" onPress={() => setShowAddTrack(true)} accessibilityLabel="Add track">
            <Text style={{ color:primaryFg, fontSize:22, fontFamily:theme.fontLight, lineHeight:24 }}>+</Text>
          </IconButton>
        )}
      </View>
    </MotiView>
  )

  const modals = (
    <>
      <Modal open={showAddTrack} title="Add Track" onClose={() => setShowAddTrack(false)}>
        <AddTrackForm onSubmit={handleAddTrack} onCancel={() => setShowAddTrack(false)} />
      </Modal>
      <Modal open={showAddTask} title="Add Task" onClose={() => setShowAddTask(false)}>
        <AddTaskForm onSubmit={handleAddTask} onCancel={() => setShowAddTask(false)} />
      </Modal>
      <Modal open={editTrack !== null} title="Edit Track" onClose={() => setEditTrack(null)}>
        {editTrack && (
          <AddTrackForm
            initialValue={editTrack}
            onSubmit={handleEditTrack}
            onCancel={() => setEditTrack(null)}
          />
        )}
      </Modal>
      <Modal open={editTask !== null} title="Edit Task" onClose={() => setEditTask(null)}>
        {editTask && (
          <AddTaskForm
            initialValue={editTask}
            onSubmit={handleEditTask}
            onCancel={() => setEditTask(null)}
          />
        )}
      </Modal>
      <Modal open={confirm !== null} title="Remove?" onClose={() => setConfirm(null)}>
        {confirm && (
          <View>
            <Text style={[s.confirmText, { color:colors.text }]}>
              Remove <Text style={{ fontFamily:theme.fontBold }}>{confirm.name}</Text>? This cannot be undone.
            </Text>
            <View style={s.confirmActions}>
              <View style={{ flex: 1 }}>
                <Button label="Cancel" variant="secondary" size="md" onPress={() => setConfirm(null)} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Remove" variant="danger" size="md" onPress={confirmRemove} fullWidth />
              </View>
            </View>
          </View>
        )}
      </Modal>
    </>
  )

  // Unified — same widgets on mobile and web (centered column on desktop)
  return (
    <View style={[s.page, { backgroundColor:colors.bg }]}>
      {/* Header is outside the ScrollView so it never shifts position */}
      <View style={[s.headerWrapper, isDesktop && s.headerWrapperDesktop]}>
        {header}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y }}
        scrollEventThrottle={16}
      >
        <Pressable
          onPress={editMode ? () => setEditMode(false) : undefined}
          style={{ flex: 1 }}
        >
          <View style={isDesktop ? s.widgetColumn : undefined}>
            {order.length === 0 && !editMode && (
              <View style={s.emptyState}>
                <Text style={[s.emptyTitle, { color: colors.textMuted }]}>no widgets</Text>
                <Text style={[s.emptySub, { color: colors.textFaint }]}>press ⊞ to add widgets back</Text>
              </View>
            )}
            {renderAll()}
            <HiddenWidgetTray
              visible={editMode}
              items={ALL_KEYS
                .filter(k => !order.includes(k))
                .map(k => ({ id: k, label: WIDGET_META[k].label, emoji: WIDGET_META[k].emoji }))}
              onAdd={(id) => setOrder(prev => [...prev, id as WKey])}
            />
          </View>
        </Pressable>
        {modals}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1 },
  // Header wrapper — always visible above the scroll area
  headerWrapper: { paddingHorizontal: theme.sp4, paddingTop: theme.sp4, paddingBottom: theme.sp3 },
  headerWrapperDesktop: { paddingHorizontal: 32, paddingTop: 40, paddingBottom: theme.sp3 },
  content: { padding:theme.sp4, paddingTop: 0, gap:theme.sp4, paddingBottom:130 },
  // Same widget grid on web — centered, single column matching mobile width
  contentDesktop: { paddingHorizontal: 32, paddingTop: 0, paddingBottom: 80, alignItems: 'center' },
  widgetColumn: { width: '100%', maxWidth: 480, gap: theme.sp4 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', width:'100%' },
  pageTitle: { fontSize:34, fontFamily:theme.fontBlack, letterSpacing:-1 },
  headerBtns: { flexDirection:'row', gap:theme.sp2 },
  emptyState: { flex:1, alignItems:'center', justifyContent:'center', paddingTop: 80, gap: theme.sp2 },
  emptyTitle: { fontSize: theme.textLg, fontFamily: theme.fontMono, letterSpacing: 1 },
  emptySub:   { fontSize: theme.textSm, fontFamily: theme.fontRegular },
  iconBtn: { width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center', gap:3 },
  iconBtnPlus: { fontSize:22, fontFamily:theme.fontLight, lineHeight:26 },
  // Centered hero content area inside a Widget (for metric widgets) —
  // both axes centered, fills the widget body
  metricCenter: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: theme.sp1 },
  // Row of two square widgets — mono spacing matches theme.sp4 (consistent vertical/horizontal rhythm)
  squareRow: { flexDirection: 'row', gap: theme.sp4 },
  spendBlock: { flexDirection:'row', alignItems:'flex-end', gap:6 },
  // Hero numbers — Space Mono BOLD, sized to fill the widget (§Widget hero typo)
  spendMain: { fontSize:56, fontFamily:theme.fontMonoBold, letterSpacing:-2.5, lineHeight:60 },
  spendUnit: { fontSize:20, fontFamily:theme.fontMonoBold, marginBottom:6 },
  empty: { fontSize:theme.textSm, fontFamily:theme.fontMono, fontStyle:'italic', paddingVertical:theme.sp3 },
  statNum: { fontSize:48, fontFamily:theme.fontMonoBold, letterSpacing:-2, lineHeight:52 },
  statSub: { fontSize:12, fontFamily:theme.fontMono, marginTop:4 },

  // Top expense widget
  topName: { fontSize:18, fontFamily:theme.fontBold, letterSpacing:-0.3, textAlign:'center' },
  topPrice: { fontSize:32, fontFamily:theme.fontMonoBold, letterSpacing:-1.4, marginTop:6 },

  // Upcoming widget rows
  upRow: { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8 },
  upEmoji: { fontSize:18, width:22, textAlign:'center' },
  upName: { fontSize:13, fontFamily:theme.fontBold, letterSpacing:-0.2 },
  upMeta: { fontSize:11, fontFamily:theme.fontMono, letterSpacing:0.1, marginTop:1 },
  upPrice: { fontSize:13, fontFamily:theme.fontMono, letterSpacing:-0.2 },
  upTag: { fontSize:10, fontFamily:theme.fontMono, letterSpacing:0.4, textTransform:'lowercase' },
  upRule: { height: StyleSheet.hairlineWidth },
  confirmText: { fontSize:theme.textSm, marginBottom:theme.sp5, lineHeight:22 },
  confirmActions: { flexDirection:'row', gap:theme.sp3 },
  btnSec: { flex:1, paddingVertical:theme.sp3, borderRadius:theme.radiusMd, alignItems:'center' },
  btnSecTxt: { fontSize:theme.textSm, fontFamily:theme.fontBold },
  btnDanger: { flex:1, paddingVertical:theme.sp3, borderRadius:theme.radiusMd, alignItems:'center' },
  btnDangerTxt: { fontSize:theme.textSm, fontFamily:theme.fontBold, color:'#fff' },
})

