import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg'
import { useDataStore } from '../stores/data'
import {
  totalMonthlySpend,
  projectedYearly,
  coffees,
  monthlyEquivalent,
} from '../utils/calculations'
import { buildMonthlyBars, RANGE_CONFIG } from '../utils/chart'
import { useTheme } from '../context/ThemeContext'
import { theme, CURRENCY_SYMBOL } from '../theme'

type Bar = { label: string; value: number; isCurrent: boolean; isFuture: boolean }

const CHART_H = 160
const PAD_T   = 20
const PAD_B   = 20

const COLOR_UP   = '#EF4444'
const COLOR_DOWN = '#22C55E'

function curvePath(pts: { x: number; y: number }[], t = 0.3): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

// ── Line Chart ─────────────────────────────────────────────────────────────
function SpendingChart({ bars, compBars, symbol, colors }: {
  bars: Bar[]; compBars: Bar[]; symbol: string; colors: any
}) {
  const [w, setW] = useState(320)

  const curValue  = bars.find(b => b.isCurrent)?.value ?? 0
  const compValue = compBars[bars.findIndex(b => b.isCurrent)]?.value ?? curValue
  const trendColor = curValue === compValue ? colors.accent
    : curValue > compValue ? COLOR_UP : COLOR_DOWN
  const trendUp = curValue > compValue

  const { coords, pastPath, futurePath, areaPath, compPath, curCoord } = useMemo(() => {
    const maxValue = Math.max(...bars.map(b => b.value), ...compBars.map(b => b.value), 0.01)
    if (bars.length < 2) return { coords: [], pastPath: '', futurePath: '', areaPath: '', compPath: '', curCoord: null }

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
    const futCoords  = curIdx >= 0 ? coords.slice(curIdx) : []

    const pastPath   = curvePath(pastCoords)
    const futurePath = futCoords.length >= 2 ? curvePath(futCoords) : ''
    const lastPast   = pastCoords[pastCoords.length - 1]
    const areaPath   = `${pastPath} L ${lastPast.x.toFixed(1)} ${CHART_H} L 0 ${CHART_H} Z`
    const compPath   = curvePath(compCoords)
    const curCoord   = coords.find(c => c.isCurrent) ?? null

    return { coords, pastPath, futurePath, areaPath, compPath, curCoord }
  }, [bars, compBars, w])

  const gridYs = [0.25, 0.5, 0.75, 1.0].map(pct =>
    PAD_T + (CHART_H - PAD_T - PAD_B) * (1 - pct)
  )

  return (
    <View>
      {/* Top row */}
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

      <View onLayout={e => setW(Math.max(e.nativeEvent.layout.width, 1))}>
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

          {/* Comparison line — previous period, dimmed */}
          {compPath ? (
            <Path d={compPath} fill="none" stroke={colors.textMuted}
              strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.45}
              strokeLinejoin="round" strokeLinecap="round" />
          ) : null}

          {/* Gradient fill — current */}
          <Path d={areaPath} fill="url(#grad-main)" />

          {/* Past line — solid, trend colored */}
          <Path d={pastPath} fill="none" stroke={trendColor}
            strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* Future line — dashed */}
          {futurePath ? (
            <Path d={futurePath} fill="none" stroke={trendColor}
              strokeWidth={2} strokeDasharray="5 5" strokeOpacity={0.4}
              strokeLinejoin="round" strokeLinecap="round" />
          ) : null}

          {curCoord && (
            <Line x1={curCoord.x} y1={curCoord.y + 10} x2={curCoord.x} y2={CHART_H - PAD_B}
              stroke={trendColor} strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 4" />
          )}

          {coords.map((c, i) => !c.isCurrent && (
            <Circle key={i} cx={c.x} cy={c.y} r={3}
              fill={colors.surface} stroke={trendColor} strokeWidth={1.5}
              strokeOpacity={c.isFuture ? 0.3 : 0.8} fillOpacity={c.isFuture ? 0.4 : 1} />
          ))}

          {curCoord && (
            <>
              <Circle cx={curCoord.x} cy={curCoord.y} r={11} fill={trendColor} fillOpacity={0.12} />
              <Circle cx={curCoord.x} cy={curCoord.y} r={6} fill={colors.surface} stroke={trendColor} strokeWidth={2.5} />
              <Circle cx={curCoord.x} cy={curCoord.y} r={2.5} fill={trendColor} />
            </>
          )}
        </Svg>
      </View>

      <View style={lc.labelsRow}>
        {bars.map((bar, i) => (
          <Text key={i} style={[
            lc.xLabel,
            { color: bar.isCurrent ? colors.text : colors.textFaint },
            bar.isCurrent && { fontFamily: theme.fontBold },
          ]}>{bar.label}</Text>
        ))}
      </View>

      {/* Legend */}
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
  legendLineDash:{ width: 16, height: 2, borderRadius: 2, opacity: 0.45 },
  legendTxt:    { fontSize: 10, fontFamily: theme.fontRegular },
})

// ── Radar Chart ────────────────────────────────────────────────────────────
const RADAR_SIZE = 200
const RADAR_CX   = RADAR_SIZE / 2
const RADAR_CY   = RADAR_SIZE / 2
const RADAR_R    = 78

function radarPoint(angle: number, r: number) {
  const a = angle - Math.PI / 2
  return { x: RADAR_CX + r * Math.cos(a), y: RADAR_CY + r * Math.sin(a) }
}

function RadarChart({ categories, colors }: {
  categories: { label: string; value: number; pct: number }[]
  colors: any
}) {
  const n = categories.length
  if (n < 3) return null

  const rings   = [0.25, 0.5, 0.75, 1.0]
  const angles  = categories.map((_, i) => (i / n) * 2 * Math.PI)

  const dataPoints = categories.map((cat, i) => radarPoint(angles[i], cat.pct * RADAR_R))
  const dataPath   = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}>
      <Defs>
        <LinearGradient id="radar-grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.08} />
        </LinearGradient>
      </Defs>

      {/* Ring gridlines */}
      {rings.map((r, ri) => {
        const pts = angles.map(a => radarPoint(a, r * RADAR_R))
        const d   = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
        return <Path key={ri} d={d} fill="none" stroke={colors.text} strokeOpacity={0.08} strokeWidth={1} />
      })}

      {/* Axis spokes */}
      {angles.map((a, i) => {
        const tip = radarPoint(a, RADAR_R)
        return <Line key={i} x1={RADAR_CX} y1={RADAR_CY} x2={tip.x} y2={tip.y} stroke={colors.text} strokeOpacity={0.1} strokeWidth={1} />
      })}

      {/* Data polygon fill */}
      <Path d={dataPath} fill="url(#radar-grad)" />
      {/* Data polygon stroke */}
      <Path d={dataPath} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.surface} stroke={colors.accent} strokeWidth={2} />
      ))}
    </Svg>
  )
}

// ── Analytics ──────────────────────────────────────────────────────────────
const CATEGORIES = ['Streaming','Music','Gaming','Cloud','Productivity','News','Fitness','Education','Other']

export function Analytics() {
  const { colors } = useTheme()
  const store = useDataStore()

  const currency = store.settings.defaultCurrency ?? 'EUR'
  const symbol   = CURRENCY_SYMBOL[currency] ?? ''

  const monthly     = useMemo(() => totalMonthlySpend(store.subscriptions), [store.subscriptions])
  const yearly      = useMemo(() => projectedYearly(store.subscriptions), [store.subscriptions])
  const coffeeCount = useMemo(() => coffees(monthly), [monthly])

  const breakdown = useMemo(
    () => store.subscriptions
      .filter((s: any) => s.active !== false)
      .map((s: any) => ({ ...s, monthly: monthlyEquivalent(s.price, s.billingCycle) }))
      .sort((a: any, b: any) => b.monthly - a.monthly),
    [store.subscriptions]
  )

  // Radar data — spending per category
  const radarData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const sub of breakdown) {
      const cat = CATEGORIES.includes(sub.category) ? sub.category : 'Other'
      totals[cat] = (totals[cat] || 0) + sub.monthly
    }
    const max = Math.max(...Object.values(totals), 0.01)
    return CATEGORIES
      .filter(c => totals[c] > 0)
      .map(c => ({ label: c, value: totals[c], pct: totals[c] / max }))
  }, [breakdown])

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

      {/* Summary */}
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.summaryGrid}>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.text }]}>{symbol}{monthly.toFixed(0)}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>per month</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.text }]}>{symbol}{yearly.toFixed(0)}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>per year</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.text }]}>{coffeeCount}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>coffees / mo</Text>
          </View>
        </View>
      </View>

      {/* Line Chart */}
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.chartHeader}>
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

      {/* Radar + Breakdown */}
      {breakdown.length > 0 ? (
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardTitle, { color: colors.text, marginBottom: theme.sp4 }]}>Breakdown by category</Text>
          <View style={s.radarRow}>
            {radarData.length >= 3 && (
              <View style={s.radarWrap}>
                <RadarChart categories={radarData} colors={colors} />
                {/* Axis labels */}
                {radarData.map((cat, i) => {
                  const a = (i / radarData.length) * 2 * Math.PI - Math.PI / 2
                  const labelR = RADAR_R + 18
                  const lx = RADAR_CX + labelR * Math.cos(a)
                  const ly = RADAR_CY + labelR * Math.sin(a)
                  return (
                    <Text key={i} style={[s.radarLabel, { color: colors.textMuted,
                      position: 'absolute',
                      left: lx - 28,
                      top:  ly - 8,
                      width: 56,
                      textAlign: lx < RADAR_CX - 5 ? 'right' : lx > RADAR_CX + 5 ? 'left' : 'center',
                    }]}>{cat.label}</Text>
                  )
                })}
              </View>
            )}
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
                      <View style={[s.barFill, { flex: pct, maxWidth: `${pct}%` as any, backgroundColor: colors.accent }]} />
                      <View style={{ flex: 100 - pct }} />
                    </View>
                  </View>
                )
              })}
            </View>
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
  content: { padding: theme.sp4, gap: theme.sp4, paddingBottom: 110 },
  pageTitle: { fontSize: 34, fontFamily: theme.fontBlack, letterSpacing: -1, marginBottom: theme.sp4 },
  card: { borderRadius: theme.radiusXl, padding: theme.sp5, ...theme.shadow },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.sp3 },
  stat:        { flex: 1 },
  statNum:     { fontSize: theme.textXl, fontFamily: theme.fontBlack },
  statLabel:   { fontSize: theme.textXs, fontFamily: theme.fontRegular, marginTop: 2 },
  chartHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.sp4, flexWrap: 'wrap', gap: theme.sp2 },
  cardTitle:      { fontSize: theme.textBase, fontFamily: theme.fontBold },
  filters:        { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2 },
  filterPill:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  filterPillText: { fontSize: theme.textXs, fontFamily: theme.fontMedium },
  chartEmpty:     { height: 160, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 13, fontFamily: theme.fontRegular, opacity: 0.6 },
  radarRow:     { flexDirection: 'row', gap: theme.sp4, alignItems: 'flex-start', flexWrap: 'wrap' },
  radarWrap:    { width: RADAR_SIZE, height: RADAR_SIZE, position: 'relative' },
  radarLabel:   { fontSize: 9, fontFamily: theme.fontMedium },
  breakdownList:{ flex: 1, minWidth: 180, gap: 0 },
  breakdownRow: { marginBottom: theme.sp4 },
  breakdownInfo:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.sp1 },
  breakdownName:{ fontSize: theme.textSm, fontFamily: theme.fontMedium },
  breakdownPct: { fontSize: theme.textSm, fontFamily: theme.fontRegular },
  barTrack:     { height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  barFill:      { height: 4 },
  emptyCard:    { alignItems: 'center', padding: theme.sp8 },
  empty:        { fontSize: theme.textSm, fontFamily: theme.fontRegular },
})
