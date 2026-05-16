import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet,
  Platform, useWindowDimensions,
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
import { totalMonthlySpend, coffees } from '../utils/calculations'
import { Modal } from '../components/ui/Modal'
import { DotGrid } from '../components/ui/DotGrid'
import { Button } from '../components/ui/Button'
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
  const stroke = 3, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const isDark = colors.bg !== '#F2F1EE'
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <SvgCircle cx={size/2} cy={size/2} r={r} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth={stroke} fill="none" />
        {pct > 0 && <SvgCircle cx={size/2} cy={size/2} r={r} stroke={colors.accent} strokeWidth={stroke} fill="none" strokeDasharray={`${circ*pct} ${circ*(1-pct)}`} strokeLinecap="round" />}
      </Svg>
      <Text style={{ fontSize: 20, fontFamily: theme.fontBlack, color: colors.text, letterSpacing: -0.5 }}>{value}</Text>
    </View>
  )
}

// ── Activity heatmap ───────────────────────────────────────────────────
const CELL = 9, GAP = 2, WEEKS = 26
function buildHeatmap(subs: any[], events: any[]) {
  const today = new Date(), start = subDays(today, WEEKS * 7 - 1)
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
  const cols = useMemo(() => buildHeatmap(subs, events), [subs, events])
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []; let last = -1
    cols.forEach((week, ci) => {
      if (!week[0]?.date) return
      const m = getMonth(parseISO(week[0].date))
      if (m !== last) { labels.push({ col: ci, label: format(parseISO(week[0].date), 'MMM') }); last = m }
    })
    return labels
  }, [cols])
  const totalW = cols.length * (CELL + GAP) - GAP
  const dotColor = (count: number) => isDark
    ? (!count ? 'rgba(255,255,255,0.07)' : count===1 ? 'rgba(255,255,255,0.28)' : count===2 ? colors.accentRed+'88' : colors.accentRed)
    : (!count ? 'rgba(0,0,0,0.07)' : count===1 ? 'rgba(0,0,0,0.28)' : count===2 ? 'rgba(0,0,0,0.55)' : '#111')
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={{ height: 16, width: totalW, marginBottom: 5 }}>
          {monthLabels.map((ml, i) => (
            <Text key={i} style={[hm.label, { position:'absolute', left: ml.col*(CELL+GAP), color: isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.35)' }]}>{ml.label}</Text>
          ))}
        </View>
        <View style={{ flexDirection:'row', gap:GAP }}>
          {cols.map((week, ci) => (
            <View key={ci} style={{ gap:GAP }}>
              {week.map((cell, ri) => <View key={ri} style={[hm.cell, { backgroundColor: dotColor(cell.count) }]} />)}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
const hm = StyleSheet.create({
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  label: { fontSize: 9, fontFamily: theme.fontMono, letterSpacing: 0.3 },
})

// ── Subscription row ───────────────────────────────────────────────────
function SubRow({ sub, symbol, diff, onRemove, delay, colors }: { sub: any; symbol: string; diff: number; onRemove: () => void; delay: number; colors: Colors }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const dueColor = diff === 0 ? colors.accentRed : diff <= 2 ? colors.warning : colors.textMuted
  const dueBg    = diff === 0 ? colors.accentRed+'18' : colors.surfaceEl
  const dueLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `In ${diff}d`
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)}>
      <Pressable onPressIn={() => { scale.value = withSpring(0.98,{damping:16,stiffness:380}) }} onPressOut={() => { scale.value = withSpring(1,{damping:16,stiffness:380}) }} onLongPress={onRemove} delayLongPress={500}>
        <Animated.View style={[sr.row, { borderBottomColor: colors.border }, animStyle]}>
          {sub.color ? <View style={[sr.accentBar, { backgroundColor: sub.color }]} /> : null}
          <View style={[sr.badge, { backgroundColor: colors.surfaceEl, borderColor: sub.color ?? 'transparent', borderWidth: sub.color ? 1.5 : 0 }]}><Text style={sr.emoji}>{sub.emoji ?? '💳'}</Text></View>
          <View style={sr.body}>
            <Text style={[sr.name, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
            <View style={sr.metaRow}>
              <View style={[sr.duePill, { backgroundColor: dueBg }]}><Text style={[sr.dueText, { color: dueColor }]}>{dueLabel}</Text></View>
              <Text style={[sr.cat, { color: colors.textFaint }]}>{sub.category ?? ''}</Text>
            </View>
          </View>
          <View style={sr.right}>
            <Text style={[sr.price, { color: colors.text }]}>{symbol}{sub.price}</Text>
            <Text style={[sr.cycle, { color: colors.textMuted }]}>{sub.billingCycle ?? 'mo'}</Text>
          </View>
          <TouchableOpacity style={[sr.removeBtn, { backgroundColor: colors.surfaceEl }]} onPress={onRemove} hitSlop={8}>
            <View style={[sr.removeLine, { backgroundColor: colors.textMuted }]} />
            <View style={[sr.removeLine, { backgroundColor: colors.textMuted, transform:[{rotate:'90deg'}], position:'absolute' }]} />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
const sr = StyleSheet.create({
  row:       { flexDirection:'row', alignItems:'center', gap:theme.sp3, paddingVertical:14, borderBottomWidth:1 },
  accentBar: { width: 3, height: 28, borderRadius: 2, marginRight: -theme.sp1 },
  badge:     { width:44, height:44, borderRadius:13, alignItems:'center', justifyContent:'center' },
  emoji:     { fontSize:22 },
  body:      { flex:1, minWidth:0, gap:5 },
  name:      { fontSize:theme.textBase, fontFamily:theme.fontBold, letterSpacing:-0.3 },
  metaRow:   { flexDirection:'row', alignItems:'center', gap:6 },
  duePill:   { paddingHorizontal:7, paddingVertical:2, borderRadius:5 },
  dueText:   { fontSize:10, fontFamily:theme.fontBold, letterSpacing:0.2 },
  cat:       { fontSize:10, fontFamily:theme.fontRegular },
  right:     { alignItems:'flex-end', gap:3 },
  price:     { fontSize:theme.textBase, fontFamily:theme.fontMonoBold, letterSpacing:-0.5 },
  cycle:     { fontSize:10, fontFamily:theme.fontMono },
  removeBtn: { width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },
  removeLine:{ width:12, height:1.5, borderRadius:1 },
})

// ── Task row ───────────────────────────────────────────────────────────
function TaskRow({ task, delay, onToggle, onRemove, colors }: { task: any; delay: number; onToggle: () => void; onRemove: () => void; colors: Colors }) {
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify().damping(20).stiffness(220)} style={[sr.row, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={[tr.box, { borderColor:colors.borderStrong, backgroundColor:colors.surfaceEl }, task.done && { backgroundColor:colors.accent, borderColor:colors.accent }]} onPress={onToggle} accessibilityRole="checkbox">
        {task.done && <Animated.Text entering={ZoomIn.springify().damping(12).stiffness(300)} style={[tr.check, { color:colors.accentFg }]}>✓</Animated.Text>}
      </TouchableOpacity>
      <View style={{ flex:1, minWidth:0 }}>
        <Text style={[sr.name, { color:colors.text }, task.done && { color:colors.textMuted, textDecorationLine:'line-through' }]}>{task.name}</Text>
        {task.note ? <Text style={[sr.cat, { color:colors.textFaint }]}>{task.note}</Text> : null}
      </View>
      <TouchableOpacity style={[sr.removeBtn, { backgroundColor:colors.surfaceEl }]} onPress={onRemove}>
        <View style={[sr.removeLine, { backgroundColor:colors.textMuted }]} />
        <View style={[sr.removeLine, { backgroundColor:colors.textMuted, transform:[{rotate:'90deg'}], position:'absolute' }]} />
      </TouchableOpacity>
    </Animated.View>
  )
}
const tr = StyleSheet.create({
  box:   { width:22, height:22, borderRadius:7, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
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
  label:  { fontFamily: theme.fontMedium, fontSize: 10, letterSpacing: 1.4 },
})

// ── Dashboard ──────────────────────────────────────────────────────────
type WKey = 'kpi' | 'heatmap' | 'due' | 'stats'
const WIDGET_DELAY: Record<WKey, number> = { kpi: 60, heatmap: 120, due: 180, stats: 240 }

export function Dashboard() {
  const { colors, themeKey } = useTheme()
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
  const dueSubs     = useMemo(() => store.subscriptions.filter((s: any) => {
    if (s.active === false || !s.nextChargeDate) return false
    return differenceInCalendarDays(parseISO(s.nextChargeDate), now) >= 0 &&
           differenceInCalendarDays(parseISO(s.nextChargeDate), now) <= 7
  }), [store.subscriptions])
  const activeSubs  = useMemo(() => store.subscriptions.filter((s: any) => s.active !== false), [store.subscriptions])

  const [showAddTrack, setShowAddTrack] = useState(false)
  const [showAddTask, setShowAddTask]   = useState(false)
  const [confirm, setConfirm]           = useState<{ kind: string; id: string; name: string } | null>(null)

  // ── Widget ordering ────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false)
  const [order, setOrder]       = useState<WKey[]>(['kpi', 'heatmap', 'due', 'stats'])

  function moveWidget(id: WKey, dir: -1 | 1) {
    setOrder(prev => {
      const idx = prev.indexOf(id)
      const next = idx + dir
      if (idx === -1 || next < 0 || next >= prev.length) return prev
      const out = [...prev]
      out.splice(idx, 1)
      out.splice(next, 0, id)
      return out
    })
  }

  // ── Reorder controls (shown in edit mode) ─────────────────────────
  function ReorderBar({ id }: { id: WKey }) {
    if (!editMode) return null
    const idx = order.indexOf(id)
    const canUp   = idx > 0
    const canDown = idx < order.length - 1
    return (
      <View style={[gh.bar, { backgroundColor: colors.surfaceEl, borderColor: colors.border }]}>
        <PressCard
          style={gh.btn}
          hoverStyle={{ backgroundColor: colors.surfaceHigh }}
          onPress={() => moveWidget(id, -1)}
          disabled={!canUp}
        >
          <Text style={[gh.btnText, { color: canUp ? colors.text : colors.textFaint }]}>↑</Text>
        </PressCard>
        <View style={[gh.divider, { backgroundColor: colors.border }]} />
        <PressCard
          style={gh.btn}
          hoverStyle={{ backgroundColor: colors.surfaceHigh }}
          onPress={() => moveWidget(id, 1)}
          disabled={!canDown}
        >
          <Text style={[gh.btnText, { color: canDown ? colors.text : colors.textFaint }]}>↓</Text>
        </PressCard>
      </View>
    )
  }

  function handleAddTrack(data: any) {
    if (data.type === 'subscription') { store.addSubscription(data); toast.push('Subscription added', 'success') }
    else if (data.type === 'app') { store.addApp(data); toast.push('App added', 'success') }
    else if (data.type === 'event') { store.addEvent(data); toast.push('Event added', 'success') }
    setShowAddTrack(false)
  }
  function handleAddTask(data: any) { store.addTask(data); toast.push('Task added', 'success'); setShowAddTask(false) }
  function confirmRemove() {
    if (!confirm) return
    if (confirm.kind === 'sub') { store.removeSubscription(confirm.id); toast.push(`Removed ${confirm.name}`) }
    else if (confirm.kind === 'task') { store.removeTask(confirm.id); toast.push(`Removed ${confirm.name}`) }
    setConfirm(null)
  }

  const isNothing = themeKey === 'nothing'
  const dotColor  = isNothing ? colors.accentRed : colors.text
  const hasItems  = dueSubs.length > 0 || todayTasks.length > 0

  // ── Desktop notebook data ────────────────────────────────────────────
  const desktopData = useMemo(() => {
    const byCat: Record<string, number> = {}
    for (const sub of store.subscriptions as any[]) {
      if (sub.active === false) continue
      const cat = sub.category || 'Other'
      byCat[cat] = (byCat[cat] || 0) + (sub.price || 0)
    }
    const breakdown = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    return { breakdown }
  }, [store.subscriptions])

  // ── Widget renderers ───────────────────────────────────────────────
  function renderWidget(id: WKey, _idx: number) {
    return (
      <Animated.View
        key={id}
        layout={LinearTransition.springify().damping(22).stiffness(220)}
      >
        <MotiView
          from={{ opacity:0, translateY:16 }}
          animate={{ opacity:1, translateY:0 }}
          transition={{ type:'spring', damping:20, stiffness:200, delay: WIDGET_DELAY[id] }}
        >
          <ReorderBar id={id} />
          {id === 'kpi' && (
            <View style={s.row2}>
              <PressCard style={[s.card, s.kpiCard, { backgroundColor: colors.surface }]}>
                {isNothing && <DotGrid color={dotColor} opacity={0.08} />}
                <View style={s.kpiTopRow}>
                  <RingBadge value={activeSubs.length} max={Math.max(activeSubs.length+4, 10)} colors={colors} />
                  <View style={[s.adjustBtn, { backgroundColor: colors.surfaceEl }]}>
                    {[14,10,14].map((w,i) => <View key={i} style={{ width:w, height:1.5, backgroundColor:colors.text+'55', borderRadius:1 }} />)}
                  </View>
                </View>
                <View style={s.kpiBottom}>
                  <Text style={[s.kpiName, { color:colors.text }]}>Active</Text>
                  <Text style={[s.kpiSub, { color:colors.textMuted }]}>subscriptions</Text>
                </View>
              </PressCard>
              <PressCard style={[s.card, s.kpiCard, { backgroundColor: colors.surface }]}>
                {isNothing && <DotGrid color={dotColor} opacity={0.08} />}
                <View style={s.kpiTopRow}>
                  <View style={s.spendBlock}>
                    <Text style={[s.spendMain, { color:colors.text }]}>{monthly.toFixed(0)}</Text>
                    <Text style={[s.spendUnit, { color:colors.textMuted }]}>{symbol}</Text>
                  </View>
                  <View style={[s.adjustBtn, { backgroundColor: colors.surfaceEl }]}>
                    {[14,10,14].map((w,i) => <View key={i} style={{ width:w, height:1.5, backgroundColor:colors.text+'55', borderRadius:1 }} />)}
                  </View>
                </View>
                <View style={s.kpiBottom}>
                  <Text style={[s.kpiName, { color:colors.text }]}>Monthly</Text>
                  <Text style={[s.kpiSub, { color:colors.textMuted }]}>spend</Text>
                </View>
              </PressCard>
            </View>
          )}
          {id === 'heatmap' && (
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              <ActivityHeatmap subs={store.subscriptions} events={store.events} colors={colors} />
            </View>
          )}
          {id === 'due' && (
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color:colors.text }]}>Due this week</Text>
                <PressCard style={[s.addPill, { backgroundColor:colors.surfaceEl }]} onPress={() => setShowAddTrack(true)}>
                  <Text style={[s.addPillText, { color:colors.textMuted }]}>+ Add</Text>
                </PressCard>
              </View>
              {!hasItems && <Text style={[s.empty, { color:colors.textFaint }]}>Nothing due in the next 7 days</Text>}
              {dueSubs.map((sub: any, i: number) => (
                <SubRow key={sub.id} sub={sub} symbol={symbol} diff={differenceInCalendarDays(parseISO(sub.nextChargeDate), now)} delay={200+i*40} colors={colors} onRemove={() => setConfirm({ kind:'sub', id:sub.id, name:sub.name })} />
              ))}
              {todayTasks.map((task: any, i: number) => (
                <TaskRow key={task.id} task={task} delay={300+i*40} colors={colors} onToggle={() => store.updateTask(task.id, { done: !task.done })} onRemove={() => setConfirm({ kind:'task', id:task.id, name:task.name })} />
              ))}
            </View>
          )}
          {id === 'stats' && (
            <View style={s.row2}>
              <PressCard style={[s.card, s.statCard, { backgroundColor:colors.surface }]}>
                {isNothing && <DotGrid color={dotColor} opacity={0.07} />}
                <Text style={[s.statNum, { color:colors.text }]}>{coffeeCount}</Text>
                <Text style={[s.statLabel, { color:colors.text }]}>coffees / mo</Text>
                <Text style={[s.statSub, { color:colors.textMuted }]}>at {symbol}{store.settings.coffeePrice?.toFixed(2)}</Text>
              </PressCard>
              <PressCard style={[s.card, s.statCard, { backgroundColor:colors.surface }]}>
                {isNothing && <DotGrid color={dotColor} opacity={0.07} />}
                <Animated.Text entering={ZoomIn.delay(280).springify().damping(12).stiffness(260)} style={[s.statNum, { color:colors.text }]}>{monthEvents.length}</Animated.Text>
                <Text style={[s.statLabel, { color:colors.text }]}>events</Text>
                <Text style={[s.statSub, { color:colors.textMuted }]}>{format(now, 'MMMM')}</Text>
              </PressCard>
            </View>
          )}
        </MotiView>
      </Animated.View>
    )
  }

  const header = (
    <MotiView from={{ opacity:0, translateY:-8 }} animate={{ opacity:1, translateY:0 }} transition={{ type:'spring', damping:20, stiffness:200 }} style={s.header}>
      <Text style={[s.pageTitle, { color:colors.text }]}>{isNothing ? '⬡ Track' : 'Track'}</Text>
      <View style={s.headerBtns}>
        {!editMode && (
          <PressCard style={[s.iconBtn, { backgroundColor:colors.surface }]} onPress={() => setShowAddTask(true)}>
            <View style={{ width:14, height:1.5, backgroundColor:colors.text, borderRadius:1 }} />
            <View style={{ width:10, height:1.5, backgroundColor:colors.text, borderRadius:1 }} />
            <View style={{ width:14, height:1.5, backgroundColor:colors.text, borderRadius:1 }} />
          </PressCard>
        )}
        <PressCard style={[s.iconBtn, { backgroundColor: editMode ? colors.accent : colors.surface }]} onPress={() => setEditMode(e => !e)}>
          {editMode
            ? <Text style={{ color:colors.accentFg, fontSize:12, fontFamily:theme.fontBold }}>Done</Text>
            : <>
                <View style={{ flexDirection:'row', gap:3 }}>
                  {[8,8].map((w,i) => <View key={i} style={{ width:w, height:8, borderRadius:2, backgroundColor:colors.text+'88' }} />)}
                </View>
                <View style={{ flexDirection:'row', gap:3 }}>
                  {[8,8].map((w,i) => <View key={i} style={{ width:w, height:8, borderRadius:2, backgroundColor:colors.text+'88' }} />)}
                </View>
              </>
          }
        </PressCard>
        {!editMode && (
          <PressCard style={[s.iconBtn, { backgroundColor:colors.surface }]} onPress={() => setShowAddTrack(true)}>
            <Text style={[s.iconBtnPlus, { color:colors.text }]}>+</Text>
          </PressCard>
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
      <Modal open={confirm !== null} title="Remove?" onClose={() => setConfirm(null)}>
        {confirm && (
          <View>
            <Text style={[s.confirmText, { color:colors.text }]}>
              Remove <Text style={{ fontFamily:theme.fontBold }}>{confirm.name}</Text>? This cannot be undone.
            </Text>
            <View style={s.confirmActions}>
              <Button label="Cancel" variant="secondary" size="md" onPress={() => setConfirm(null)} fullWidth />
              <Button label="Remove" variant="danger" size="md" onPress={confirmRemove} fullWidth />
            </View>
          </View>
        )}
      </Modal>
    </>
  )

  if (isDesktop) {
    const monthName = format(now, 'MMMM')
    const dateLine  = format(now, "EEEE · d LLL · yyyy")
    return (
      <ScrollView style={[s.page, { backgroundColor:colors.bg }]} contentContainerStyle={nb.scroll} showsVerticalScrollIndicator={false}>
        <View style={nb.page}>
          {/* Masthead — month + date + quiet "+" */}
          <MotiView from={{ opacity:0, translateY:-6 }} animate={{ opacity:1, translateY:0 }} transition={{ type:'timing', duration:260 }} style={nb.masthead}>
            <View style={{ flex:1 }}>
              <Text style={[nb.month, { color:colors.text }]}>{monthName}</Text>
              <Text style={[nb.dateLine, { color:colors.textMuted }]}>{dateLine.toLowerCase()}</Text>
            </View>
            <PressCard
              onPress={() => setShowAddTrack(true)}
              style={nb.plusBtn}
              hoverStyle={{ backgroundColor: colors.surfaceEl }}
            >
              <Text style={[nb.plus, { color:colors.text }]}>+</Text>
            </PressCard>
          </MotiView>

          <View style={[nb.rule, { backgroundColor:colors.border }]} />

          {/* Ledger row — 4 numbers in Space Mono */}
          <View style={nb.ledger}>
            <Stat value={String(activeSubs.length)} label="subscribed" colors={colors} />
            <Stat value={monthly.toFixed(0)} unit={symbol} label="this month" colors={colors} />
            <Stat value={String(monthEvents.length)} label="events" colors={colors} />
            <Stat value={String(coffeeCount)} label="coffees" colors={colors} />
          </View>

          <View style={[nb.rule, { backgroundColor:colors.border }]} />

          {/* The year, in dots */}
          <View style={nb.section}>
            <Text style={[nb.sectionTag, { color:colors.textMuted }]}>the year, in dots</Text>
            <View style={nb.heatmapHolder}>
              <ActivityHeatmap subs={store.subscriptions} events={store.events} colors={colors} />
            </View>
          </View>

          <View style={[nb.rule, { backgroundColor:colors.border }]} />

          {/* This week */}
          <View style={nb.section}>
            <Text style={[nb.sectionTag, { color:colors.textMuted }]}>this week</Text>
            {!hasItems && <Text style={[nb.empty, { color:colors.textFaint }]}>nothing due in the next 7 days</Text>}
            {dueSubs.map((sub: any, i: number) => (
              <SubRow
                key={sub.id}
                sub={sub}
                symbol={symbol}
                diff={differenceInCalendarDays(parseISO(sub.nextChargeDate), now)}
                delay={120 + i * 40}
                colors={colors}
                onRemove={() => setConfirm({ kind:'sub', id:sub.id, name:sub.name })}
              />
            ))}
            {todayTasks.map((task: any, i: number) => (
              <TaskRow
                key={task.id}
                task={task}
                delay={180 + i * 40}
                colors={colors}
                onToggle={() => store.updateTask(task.id, { done: !task.done })}
                onRemove={() => setConfirm({ kind:'task', id:task.id, name:task.name })}
              />
            ))}
          </View>

          <View style={[nb.rule, { backgroundColor:colors.border }]} />

          {/* By category — dotted leader lines, mono prices */}
          <View style={nb.section}>
            <Text style={[nb.sectionTag, { color:colors.textMuted }]}>by category</Text>
            {desktopData.breakdown.length === 0 ? (
              <Text style={[nb.empty, { color:colors.textFaint }]}>no active subscriptions</Text>
            ) : desktopData.breakdown.map(([cat, val]) => (
              <View key={cat} style={nb.catRow}>
                <Text style={[nb.catName, { color:colors.text }]} numberOfLines={1}>{cat}</Text>
                <View style={[nb.catLeader, { borderBottomColor: colors.border }]} />
                <Text style={[nb.catValue, { color:colors.text }]}>{symbol}{val.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {modals}
      </ScrollView>
    )
  }

  return (
    <ScrollView style={[s.page, { backgroundColor:colors.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} scrollEnabled={!editMode}>
      {header}
      {order.map((id, idx) => renderWidget(id, idx))}
      {modals}
    </ScrollView>
  )
}

// ── Reorder bar styles ─────────────────────────────────────────────────
const gh = StyleSheet.create({
  bar:        { height:40, borderRadius:12, borderWidth:1, marginBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  btn:        { flex:1, height:'100%', alignItems:'center', justifyContent:'center' },
  btnDisabled:{ opacity:0.4 },
  btnText:    { fontSize:18, lineHeight:20, fontFamily:theme.fontMedium },
  divider:    { width:1, height:18, opacity:0.7 },
})

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { padding:theme.sp4, gap:theme.sp3, paddingBottom:110 },
  contentDesktop: { padding:theme.sp5, gap:theme.sp4, paddingBottom:40 },
  desktopGrid:  { flexDirection:'row', gap:theme.sp4, alignItems:'flex-start' },
  desktopLeft:  { flex:3, gap:theme.sp4 },
  desktopRight: { flex:2, gap:theme.sp4 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:4, paddingTop:theme.sp2, marginBottom:theme.sp2 },
  pageTitle: { fontSize:34, fontFamily:theme.fontBlack, letterSpacing:-1 },
  headerBtns: { flexDirection:'row', gap:theme.sp2 },
  iconBtn: { width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center', gap:3 },
  iconBtnPlus: { fontSize:22, fontFamily:theme.fontLight, lineHeight:26 },
  card: { borderRadius:theme.radiusXl, padding:theme.sp5, overflow:'hidden' },
  row2: { flexDirection:'row', gap:theme.sp3 },
  kpiCard: { flex:1, justifyContent:'space-between', minHeight:140 },
  kpiTopRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  kpiBottom: { marginTop:theme.sp3 },
  kpiName: { fontSize:theme.textBase, fontFamily:theme.fontBold, letterSpacing:-0.3 },
  kpiSub: { fontSize:theme.textXs, fontFamily:theme.fontRegular, marginTop:2 },
  spendBlock: { flexDirection:'row', alignItems:'flex-end', gap:3 },
  spendMain: { fontSize:48, fontFamily:theme.fontBlack, letterSpacing:-2, lineHeight:52 },
  spendUnit: { fontSize:18, fontFamily:theme.fontMono, marginBottom:4 },
  adjustBtn: { width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center' },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:theme.sp4 },
  sectionTitle: { fontSize:theme.textBase, fontFamily:theme.fontBold, letterSpacing:-0.3 },
  addPill: { paddingHorizontal:12, paddingVertical:6, borderRadius:theme.radiusFull },
  addPillText: { fontSize:theme.textXs, fontFamily:theme.fontBold },
  empty: { fontSize:theme.textSm, fontFamily:theme.fontRegular, paddingVertical:theme.sp3 },
  statCard: { flex:1, gap:4, overflow:'hidden' },
  statNum: { fontSize:32, fontFamily:theme.fontBlack, letterSpacing:-1.5 },
  statLabel: { fontSize:theme.textSm, fontFamily:theme.fontBold },
  statSub: { fontSize:theme.textXs, fontFamily:theme.fontMono },
  confirmText: { fontSize:theme.textSm, marginBottom:theme.sp5, lineHeight:22 },
  confirmActions: { flexDirection:'row', gap:theme.sp3 },
  btnSec: { flex:1, paddingVertical:theme.sp3, borderRadius:theme.radiusMd, alignItems:'center' },
  btnSecTxt: { fontSize:theme.textSm, fontFamily:theme.fontBold },
  btnDanger: { flex:1, paddingVertical:theme.sp3, borderRadius:theme.radiusMd, alignItems:'center' },
  btnDangerTxt: { fontSize:theme.textSm, fontFamily:theme.fontBold, color:'#fff' },
})

// ── Notebook desktop styles ────────────────────────────────────────────
const nb = StyleSheet.create({
  scroll:       { paddingVertical: 56, paddingHorizontal: 32, alignItems: 'center' },
  page:         { width: '100%', maxWidth: 720, gap: 28 },

  masthead:     { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  month:        { fontSize: 56, fontFamily: theme.fontBlack, letterSpacing: -2.5, lineHeight: 58, textTransform: 'capitalize' },
  dateLine:     { fontSize: 12, fontFamily: theme.fontMono, letterSpacing: 0.2, marginTop: 6 },
  plusBtn:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  plus:         { fontSize: 24, fontFamily: theme.fontLight, lineHeight: 28 },

  rule:         { height: StyleSheet.hairlineWidth, width: '100%' },

  ledger:       { flexDirection: 'row', gap: 24, paddingVertical: 4 },

  section:      { gap: 14 },
  sectionTag:   { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },

  heatmapHolder:{ paddingVertical: 4 },

  empty:        { fontSize: 13, fontFamily: theme.fontMono, fontStyle: 'italic', paddingVertical: 12 },

  catRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingVertical: 6 },
  catName:      { fontFamily: theme.fontMedium, fontSize: 14, letterSpacing: -0.2 },
  catLeader:    { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderStyle: 'dotted', marginBottom: 4, opacity: 0.6 },
  catValue:     { fontFamily: theme.fontMono, fontSize: 14, letterSpacing: -0.3 },
})
