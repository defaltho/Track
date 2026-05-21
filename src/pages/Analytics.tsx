import React, { useState, useMemo, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useDataStore } from '../stores/data'
import {
  totalMonthlySpend,
  projectedYearly,
  coffees,
  monthlyEquivalent,
} from '../utils/calculations'
import { buildMonthlyBars, RANGE_CONFIG, curvePath } from '../utils/chart'
import { useTheme } from '../context/ThemeContext'
import { theme, CURRENCY_SYMBOL } from '../theme'

type Bar = { label: string; value: number; isCurrent: boolean; isFuture: boolean }

const CHART_H   = 160
const PAD_T     = 20
const PAD_B     = 20
const TOOLTIP_W = 108

const COLOR_UP   = '#EF4444'
const COLOR_DOWN = '#22C55E'

// ── Line Chart (Luis Miguel) ────────────────────────────────────────────────
function SpendingChart({ bars, compBars, symbol, colors }: {
  bars: Bar[]; compBars: Bar[]; symbol: string; colors: any
}) {
  const [w, setW] = useState(320)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const coordsRef      = useRef<typeof coords>([])
  const selectedIdxRef = useRef(selectedIdx)
  selectedIdxRef.current = selectedIdx

  const curValue  = bars.find(b => b.isCurrent)?.value ?? 0
  const compValue = compBars[bars.findIndex(b => b.isCurrent)]?.value ?? curValue
  const trendColor = curValue === compValue ? colors.accent
    : curValue > compValue ? COLOR_UP : COLOR_DOWN
  const trendUp = curValue > compValue

  const { coords, pastPath, areaPath, compPath, curCoord } = useMemo(() => {
    const maxValue = Math.max(...bars.map(b => b.value), ...compBars.map(b => b.value), 0.01)
    if (bars.length < 2) return { coords: [], pastPath: '', areaPath: '', compPath: '', curCoord: null }

    const usableH = CHART_H - PAD_T - PAD_B
    const stepX   = w / (bars.length - 1)

    const coords = bars.map((bar, i) => ({
      x: i * stepX,
      y: PAD_T + usableH - (bar.value / maxValue) * usableH,
      ...bar,
    }))

    const compCoords = compBars.map((bar, i) => ({
      x: i * stepX,
      y: PAD_T + usableH - (bar.value / maxValue) * usableH,
    }))

    const curIdx     = coords.findIndex(c => c.isCurrent)
    const pastCoords = curIdx >= 0 ? coords.slice(0, curIdx + 1) : coords

    const pastPath = curvePath(pastCoords)
    const lastPast = pastCoords[pastCoords.length - 1]
    const areaPath = `${pastPath} L ${lastPast.x.toFixed(1)} ${CHART_H} L 0 ${CHART_H} Z`
    const compPath = curvePath(compCoords)
    const curCoord = coords.find(c => c.isCurrent) ?? null

    return { coords, pastPath, areaPath, compPath, curCoord }
  }, [bars, compBars, w])

  coordsRef.current = coords

  const chartTap = useMemo(() => Gesture.Tap()
    .runOnJS(true)
    .onEnd((e, success) => {
      if (!success) return
      const TAP_R = 28
      let closest = -1, minDist = Infinity
      coordsRef.current.forEach((c, i) => {
        if (c.isFuture) return
        const d = Math.hypot(c.x - e.x, c.y - e.y)
        if (d < minDist && d <= TAP_R) { minDist = d; closest = i }
      })
      setSelectedIdx(closest >= 0 ? (selectedIdxRef.current === closest ? null : closest) : null)
    }), [])

  const gridYs = [0.25, 0.5, 0.75, 1.0].map(pct =>
    PAD_T + (CHART_H - PAD_T - PAD_B) * (1 - pct)
  )

  return (
    <View>
      <View style={lc.topRow}>
        <View style={lc.trendBadge}>
          <Text style={[lc.trendArrow, { color: trendColor }]}>{trendUp ? '↑' : '↓'}</Text>
          <Text style={[lc.trendLabel, { color: trendColor }]}>
            {trendUp ? 'spending more' : 'spending less'} vs last period
          </Text>
        </View>
        {curCoord && curCoord.value > 0 && (
          <View style={lc.callout}>
            <Text style={[lc.calloutAmt, { color: colors.text }]}>{symbol}{curCoord.value.toFixed(2)}</Text>
            <Text style={[lc.calloutSub, { color: colors.textMuted }]}>this month</Text>
          </View>
        )}
      </View>

      <GestureDetector gesture={chartTap}>
      <View onLayout={e => setW(Math.max(e.nativeEvent.layout.width, 1))} style={{ position: 'relative' }}>
        {/* Tooltip flutuante */}
        {selectedIdx !== null && coords[selectedIdx] && (() => {
          const sel   = coords[selectedIdx]
          const comp  = compBars[selectedIdx]?.value ?? 0
          const delta = comp > 0 ? ((sel.value - comp) / comp) * 100 : 0
          const left  = Math.max(4, Math.min(w - TOOLTIP_W - 4, sel.x - TOOLTIP_W / 2))
          const above = sel.y > 72
          return (
            <View style={[lc.tooltip, {
              left, top: above ? sel.y - 88 : sel.y + 16,
              backgroundColor: colors.surface, borderColor: colors.border,
            }]}>
              <Text style={[lc.ttMonth, { color: colors.textMuted }]}>{sel.label}</Text>
              <Text style={[lc.ttValue, { color: colors.text }]}>{symbol}{sel.value.toFixed(2)}</Text>
              {comp > 0 && (
                <Text style={[lc.ttDelta, { color: delta > 0 ? COLOR_UP : COLOR_DOWN }]}>
                  {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
                </Text>
              )}
              {comp > 0 && (
                <Text style={[lc.ttComp, { color: colors.textFaint }]}>
                  prev: {symbol}{comp.toFixed(2)}
                </Text>
              )}
            </View>
          )
        })()}

        <Svg width={w} height={CHART_H} viewBox={`0 0 ${w} ${CHART_H}`}>
          <Defs>
            <LinearGradient id="grad-main" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={trendColor} stopOpacity={0.22} />
              <Stop offset="80%"  stopColor={trendColor} stopOpacity={0.03} />
              <Stop offset="100%" stopColor={trendColor} stopOpacity={0}    />
            </LinearGradient>
          </Defs>

          {gridYs.map((y, i) => (
            <Line key={i} x1={0} y1={y} x2={w} y2={y}
              stroke={colors.text} strokeOpacity={0.06} strokeWidth={1} strokeDasharray="3 6" />
          ))}

          {compPath ? (
            <Path d={compPath} fill="none" stroke={colors.textMuted}
              strokeWidth={2} strokeDasharray="6 3" strokeOpacity={0.75}
              strokeLinejoin="round" strokeLinecap="round" />
          ) : null}

          <Path d={areaPath} fill="url(#grad-main)" />

          <Path d={pastPath} fill="none" stroke={trendColor}
            strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {curCoord && (
            <Line x1={curCoord.x} y1={curCoord.y + 10} x2={curCoord.x} y2={CHART_H - PAD_B}
              stroke={trendColor} strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 4" />
          )}

          {/* Bolinhas passadas — apenas visuais (toque via Pressable overlay) */}
          {coords.map((c, i) => !c.isCurrent && !c.isFuture && (
            <Circle key={i} cx={c.x} cy={c.y} r={selectedIdx === i ? 4.5 : 3}
              fill={colors.surface} stroke={trendColor}
              strokeWidth={selectedIdx === i ? 2 : 1.5} strokeOpacity={0.8} />
          ))}

          {/* Bolinha do mês atual — apenas visual */}
          {curCoord && (
            <>
              <Circle cx={curCoord.x} cy={curCoord.y} r={11} fill={trendColor} fillOpacity={0.12} />
              <Circle cx={curCoord.x} cy={curCoord.y} r={6} fill={colors.surface} stroke={trendColor} strokeWidth={2.5} />
              <Circle cx={curCoord.x} cy={curCoord.y} r={2.5} fill={trendColor} />
            </>
          )}
        </Svg>

      </View>
      </GestureDetector>

      <View style={lc.labelsRow}>
        {bars.map((bar, i) => (
          <Text key={i} style={[
            lc.xLabel,
            { color: bar.isCurrent ? colors.text : colors.textFaint },
            bar.isCurrent && { fontFamily: theme.fontBold },
          ]}>{bar.label}</Text>
        ))}
      </View>

      <View style={lc.legend}>
        <View style={lc.legendItem}>
          <View style={[lc.legendLine, { backgroundColor: trendColor }]} />
          <Text style={[lc.legendTxt, { color: colors.textMuted }]}>This period</Text>
        </View>
        <View style={lc.legendItem}>
          <View style={[lc.legendLineDash, { backgroundColor: colors.textMuted }]} />
          <Text style={[lc.legendTxt, { color: colors.textMuted }]}>Previous period</Text>
        </View>
      </View>
    </View>
  )
}

const lc = StyleSheet.create({
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  trendBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendArrow:   { fontSize: 14, fontFamily: theme.fontBold },
  trendLabel:   { fontSize: 11, fontFamily: theme.fontMedium },
  callout:      { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  calloutAmt:   { fontSize: 20, fontFamily: theme.fontBlack, letterSpacing: -1 },
  calloutSub:   { fontSize: 11, fontFamily: theme.fontRegular },
  labelsRow:    { flexDirection: 'row', marginTop: 8 },
  xLabel:       { flex: 1, textAlign: 'center', fontSize: 9, fontFamily: theme.fontMono },
  legend:       { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine:   { width: 16, height: 2.5, borderRadius: 2 },
  legendLineDash:{ width: 16, height: 2, borderRadius: 2, opacity: 0.75 },
  legendTxt:    { fontSize: 10, fontFamily: theme.fontRegular },

  tooltip:  { position: 'absolute', zIndex: 20, borderWidth: StyleSheet.hairlineWidth,
               borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, width: TOOLTIP_W },
  ttMonth:  { fontSize: 10, fontFamily: theme.fontMono, marginBottom: 2 },
  ttValue:  { fontSize: 15, fontFamily: theme.fontBlack, letterSpacing: -0.5 },
  ttDelta:  { fontSize: 11, fontFamily: theme.fontMedium, marginTop: 2 },
  ttComp:   { fontSize: 10, fontFamily: theme.fontRegular, marginTop: 3, opacity: 0.8 },
})

// ── Donut Chart ─────────────────────────────────────────────────────────────
interface DonutSlice { label: string; value: number; color: string }

function polarXY(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutArc(cx: number, cy: number, r: number, start: number, end: number, stroke: number): string {
  const a = polarXY(cx, cy, r, start)
  const b = polarXY(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  const inner = r - stroke
  const ai = polarXY(cx, cy, inner, end)
  const bi = polarXY(cx, cy, inner, start)
  return [
    `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
    `L ${ai.x.toFixed(2)} ${ai.y.toFixed(2)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${bi.x.toFixed(2)} ${bi.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

function DonutChart({ slices, symbol, colors }: { slices: DonutSlice[]; symbol: string; colors: any }) {
  const SIZE   = 140
  const CX     = SIZE / 2
  const STROKE = 24
  const R      = (SIZE - STROKE) / 2 - 2
  const GAP    = 1.5

  const total = slices.reduce((s, sl) => s + sl.value, 0)

  const paths = useMemo(() => {
    if (total <= 0) return []
    let cursor = 0
    return slices.map(sl => {
      const sweep = (sl.value / total) * (360 - GAP * slices.length)
      const start = cursor + GAP / 2
      const end   = cursor + sweep + GAP / 2
      cursor += sweep + GAP
      return { ...sl, d: donutArc(CX, CX, R, start, end, STROKE) }
    })
  }, [slices, total])

  return (
    <View style={dc.wrap}>
      <Svg width={SIZE} height={SIZE}>
        {total <= 0 ? (
          <Circle cx={CX} cy={CX} r={R - STROKE / 2} fill="none"
            stroke={colors.border} strokeWidth={STROKE} />
        ) : paths.map((p, i) => (
          <Path key={i} d={p.d} fill={p.color} />
        ))}
      </Svg>
      {/* centre label */}
      <View style={dc.centre} pointerEvents="none">
        <Text style={[dc.centreAmt, { color: colors.text }]}>
          {symbol}{total.toFixed(0)}
        </Text>
        <Text style={[dc.centreSub, { color: colors.textMuted }]}>/ mo</Text>
      </View>

      {/* legend */}
      <View style={dc.legend}>
        {slices.slice(0, 6).map((sl, i) => (
          <View key={i} style={dc.legendRow}>
            <View style={[dc.dot, { backgroundColor: sl.color }]} />
            <Text style={[dc.legendLabel, { color: colors.text }]} numberOfLines={1}>{sl.label}</Text>
            <Text style={[dc.legendVal, { color: colors.textMuted }]}>
              {symbol}{sl.value.toFixed(0)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const dc = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', gap: theme.sp5 },
  centre:      { position: 'absolute', left: 0, width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  centreAmt:   { fontSize: 18, fontFamily: theme.fontBlack, letterSpacing: -1 },
  centreSub:   { fontSize: 10, fontFamily: theme.fontRegular, marginTop: 1 },
  legend:      { flex: 1, gap: theme.sp2 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:         { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendLabel: { flex: 1, fontSize: 12, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
  legendVal:   { fontSize: 12, fontFamily: theme.fontMonoBold, letterSpacing: -0.2 },
})

// ── Analytics ──────────────────────────────────────────────────────────────

export function Analytics() {
  const { colors } = useTheme()
  const store = useDataStore()

  const currency = store.settings.defaultCurrency ?? 'EUR'
  const symbol   = CURRENCY_SYMBOL[currency] ?? ''

  const activeSubs = useMemo(
    () => store.subscriptions.filter((s: any) => s.active !== false),
    [store.subscriptions]
  )

  const monthly     = useMemo(() => totalMonthlySpend(store.subscriptions), [store.subscriptions])
  const yearly      = useMemo(() => projectedYearly(store.subscriptions), [store.subscriptions])
  const coffeeCount = useMemo(() => coffees(monthly), [monthly])

  const avgPerSub = activeSubs.length > 0
    ? monthly / activeSubs.length
    : 0

  const nextChargeDays = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const upcoming = activeSubs
      .filter((s: any) => s.nextChargeDate)
      .map((s: any) => {
        const d = new Date(s.nextChargeDate); d.setHours(0, 0, 0, 0)
        return Math.ceil((d.getTime() - today.getTime()) / 86400000)
      })
      .filter(d => d >= 0)
      .sort((a, b) => a - b)
    return upcoming[0] ?? null
  }, [activeSubs])

  // Category breakdown for donut
  const [donutMode, setDonutMode] = useState<'expense' | 'income'>('expense')

  const expenseSlices = useMemo<DonutSlice[]>(() => {
    const map = new Map<string, { value: number; color: string }>()
    for (const s of activeSubs as any[]) {
      if (s.price <= 0) continue
      const cat = s.category ?? 'Other'
      const monthly = monthlyEquivalent(s.price, s.billingCycle)
      const existing = map.get(cat)
      if (existing) existing.value += monthly
      else map.set(cat, { value: monthly, color: s.color ?? colors.accent })
    }
    return [...map.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.value - a.value)
  }, [activeSubs, colors.accent])

  const incomeSlices = useMemo<DonutSlice[]>(() => {
    const map = new Map<string, { value: number; color: string }>()
    for (const s of activeSubs as any[]) {
      if (s.price >= 0) continue
      const cat = s.category ?? 'Other'
      const monthly = monthlyEquivalent(Math.abs(s.price), s.billingCycle)
      const existing = map.get(cat)
      if (existing) existing.value += monthly
      else map.set(cat, { value: monthly, color: s.color ?? colors.success })
    }
    return [...map.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.value - a.value)
  }, [activeSubs, colors.success])

  const hasIncome   = incomeSlices.length > 0
  const activeSlices = donutMode === 'expense' ? expenseSlices : incomeSlices

  const breakdown = useMemo(
    () => activeSubs
      .map((s: any) => ({ ...s, monthly: monthlyEquivalent(s.price, s.billingCycle) }))
      .sort((a: any, b: any) => b.monthly - a.monthly),
    [activeSubs]
  )

  const [timeRange, setTimeRange] = useState('6M')
  const bars = useMemo(() => {
    const { back, ahead } = RANGE_CONFIG[timeRange]
    return buildMonthlyBars(store.subscriptions, back, ahead, 0)
  }, [store.subscriptions, timeRange])

  const compBars = useMemo(() => {
    const { back, ahead } = RANGE_CONFIG[timeRange]
    const total = back + ahead + 1
    return buildMonthlyBars(store.subscriptions, back, ahead, total)
  }, [store.subscriptions, timeRange])

  return (
    <ScrollView style={[s.page, { backgroundColor: colors.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={[s.pageTitle, { color: colors.text }]}>Analytics</Text>

      {/* ── Hero KPI scroll ─────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kpiRow}>
        <View style={[s.kpiCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.kpiNum, { color: colors.text }]}>{symbol}{monthly.toFixed(0)}</Text>
          <Text style={[s.kpiLabel, { color: colors.textMuted }]}>per month</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.kpiNum, { color: colors.text }]}>{symbol}{yearly.toFixed(0)}</Text>
          <Text style={[s.kpiLabel, { color: colors.textMuted }]}>per year</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.kpiNum, { color: colors.text }]}>{activeSubs.length}</Text>
          <Text style={[s.kpiLabel, { color: colors.textMuted }]}>active subs</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.kpiNum, { color: colors.text }]}>{symbol}{avgPerSub.toFixed(0)}</Text>
          <Text style={[s.kpiLabel, { color: colors.textMuted }]}>avg / sub</Text>
        </View>
        <View style={[s.kpiCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.kpiNum, { color: colors.text }]}>{coffeeCount}</Text>
          <Text style={[s.kpiLabel, { color: colors.textMuted }]}>coffees / mo</Text>
        </View>
        {nextChargeDays !== null && (
          <View style={[s.kpiCard, { backgroundColor: colors.surface }]}>
            <Text style={[s.kpiNum, { color: colors.text }]}>{nextChargeDays}d</Text>
            <Text style={[s.kpiLabel, { color: colors.textMuted }]}>next charge</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Category donut ──────────────────────────────────────── */}
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.cardHeader}>
          <Text style={[s.cardTitle, { color: colors.text }]}>By category</Text>
          {hasIncome && (
            <View style={[s.toggle, { backgroundColor: colors.surfaceEl }]}>
              {(['expense', 'income'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.toggleBtn, donutMode === m && { backgroundColor: colors.surface }]}
                  onPress={() => setDonutMode(m)}
                >
                  <Text style={[s.toggleLabel, { color: donutMode === m ? colors.text : colors.textMuted }]}>
                    {m === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {activeSlices.length > 0
          ? <DonutChart slices={activeSlices} symbol={symbol} colors={colors} />
          : <View style={s.chartEmpty}>
              <Text style={[s.chartEmptyText, { color: colors.textFaint }]}>
                {donutMode === 'income' ? 'No income tracked yet' : 'Add a subscription to see the chart'}
              </Text>
            </View>
        }
      </View>

      {/* ── Spending over time (Luis Miguel) ────────────────────── */}
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.cardHeader}>
          <Text style={[s.cardTitle, { color: colors.text }]}>Spending over time</Text>
          <View style={s.filters}>
            {Object.keys(RANGE_CONFIG).map(f => (
              <TouchableOpacity key={f}
                style={[s.filterPill, { backgroundColor: timeRange === f ? colors.accent : colors.surfaceEl }]}
                onPress={() => setTimeRange(f)} accessibilityRole="button">
                <Text style={[s.filterPillText, { color: timeRange === f ? colors.accentFg : colors.textMuted }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {store.subscriptions.length > 0
          ? <SpendingChart bars={bars} compBars={compBars} symbol={symbol} colors={colors} />
          : <View style={s.chartEmpty}><Text style={[s.chartEmptyText, { color: colors.textFaint }]}>Add a subscription to see the chart</Text></View>
        }
      </View>

      {/* ── Breakdown by subscription ────────────────────────────── */}
      {breakdown.length > 0 ? (
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardTitle, { color: colors.text, marginBottom: theme.sp4 }]}>Breakdown by subscription</Text>
          <View style={s.breakdownList}>
            {breakdown.map((sub: any) => {
              const pct = monthly > 0 ? (sub.monthly / monthly) * 100 : 0
              return (
                <View key={sub.id} style={s.breakdownRow}>
                  <View style={s.breakdownInfo}>
                    <Text style={[s.breakdownName, { color: colors.text }]}>{sub.emoji ?? '💳'} {sub.name}</Text>
                    <Text style={[s.breakdownPct, { color: colors.textMuted }]}>{symbol}{sub.monthly.toFixed(2)} · {pct.toFixed(0)}%</Text>
                  </View>
                  <View style={[s.barTrack, { backgroundColor: colors.surfaceHigh }]}>
                    <View style={[s.barFill, { flex: pct, maxWidth: `${pct}%` as any, backgroundColor: sub.color ?? colors.accent }]} />
                    <View style={{ flex: 100 - pct }} />
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      ) : (
        <View style={[s.card, s.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.empty, { color: colors.textFaint }]}>No subscriptions yet</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp4, paddingBottom: 130 },
  pageTitle: { fontSize: 34, fontFamily: theme.fontBlack, letterSpacing: -1, marginBottom: theme.sp4 },

  kpiRow:   { gap: theme.sp3, paddingRight: theme.sp4 },
  kpiCard:  { minWidth: 100, borderRadius: theme.radiusXl, padding: theme.sp4, ...theme.shadow },
  kpiNum:   { fontSize: 28, fontFamily: theme.fontBlack, letterSpacing: -1, lineHeight: 32 },
  kpiLabel: { fontSize: 11, fontFamily: theme.fontRegular, marginTop: 4 },

  card: { borderRadius: theme.radiusXl, padding: theme.sp5, ...theme.shadow },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.sp4, flexWrap: 'wrap', gap: theme.sp2 },
  cardTitle: { fontSize: theme.textBase, fontFamily: theme.fontBold },

  toggle:      { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 2, alignSelf: 'flex-start' },
  toggleBtn:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  toggleLabel: { fontSize: 11, fontFamily: theme.fontMedium },

  filters:        { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2 },
  filterPill:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  filterPillText: { fontSize: theme.textXs, fontFamily: theme.fontMedium },

  chartEmpty:     { height: 140, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 13, fontFamily: theme.fontRegular, opacity: 0.6 },

  breakdownList:{ minWidth: 180, gap: 0 },
  breakdownRow: { marginBottom: theme.sp4 },
  breakdownInfo:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.sp1 },
  breakdownName:{ fontSize: theme.textSm, fontFamily: theme.fontMedium },
  breakdownPct: { fontSize: theme.textSm, fontFamily: theme.fontRegular },
  barTrack:     { height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  barFill:      { height: 4 },
  emptyCard:    { alignItems: 'center', padding: theme.sp8 },
  empty:        { fontSize: theme.textSm, fontFamily: theme.fontRegular },
})
