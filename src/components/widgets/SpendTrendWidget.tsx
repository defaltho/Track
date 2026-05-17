import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { curvePath } from '../../utils/chart'

// ── SpendTrendWidget ──────────────────────────────────────────────────
// Compact version of the Analytics page's SpendingChart for the
// dashboard. Same visual language (curved area, dashed prev-period
// line, current-point halo, mono month labels) so the two surfaces
// read as the same chart — just smaller and without the trend badge,
// callout, or legend the widget header already covers.
//
// `bars` / `compBars` should come from `buildMonthlyBars` exactly like
// Analytics so the two charts can't drift.

type Bar = { label: string; value: number; isCurrent: boolean; isFuture: boolean }

const COLOR_UP   = '#EF4444'
const COLOR_DOWN = '#22C55E'

const CHART_H = 80
const PAD_T   = 10
const PAD_B   = 6

interface Props {
  tag?: string
  title?: string
  bars: Bar[]
  compBars?: Bar[]
  unit?: string
  invertDelta?: boolean
  action?: React.ReactNode
}

export function SpendTrendWidget ({
  tag = 'trend', title = 'spend', bars, compBars = [], unit = '', invertDelta = true, action,
}: Props) {
  const { colors } = useTheme()
  const [w, setW] = useState(280)

  const curBar  = bars.find(b => b.isCurrent) ?? bars[bars.length - 1]
  const curIdx  = bars.findIndex(b => b.isCurrent)
  const compBar = curIdx >= 0 ? compBars[curIdx] : undefined
  const curVal  = curBar?.value ?? 0
  const compVal = compBar?.value ?? curVal

  const deltaPct = compVal > 0 ? ((curVal - compVal) / compVal) * 100 : 0
  const isGood = invertDelta ? deltaPct < 0 : deltaPct > 0
  const isBad  = invertDelta ? deltaPct > 0 : deltaPct < 0
  const trendColor = isGood ? COLOR_DOWN : isBad ? COLOR_UP : colors.accent
  const arrow = deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '·'

  const { pastPath, futurePath, areaPath, compPath, curCoord, coords } = useMemo(() => {
    const maxValue = Math.max(...bars.map(b => b.value), ...compBars.map(b => b.value), 0.01)
    if (bars.length < 2) return { pastPath: '', futurePath: '', areaPath: '', compPath: '', curCoord: null, coords: [] }
    const usableH = CHART_H - PAD_T - PAD_B
    const stepX   = w / (bars.length - 1)
    const coords  = bars.map((bar, i) => ({
      x: i * stepX,
      y: PAD_T + usableH - (bar.value / maxValue) * usableH,
      ...bar,
    }))
    const compCoords = compBars.map((bar, i) => ({
      x: i * stepX,
      y: PAD_T + usableH - (bar.value / maxValue) * usableH,
    }))

    const cur = coords.findIndex(c => c.isCurrent)
    const pastCoords = cur >= 0 ? coords.slice(0, cur + 1) : coords
    const futCoords  = cur >= 0 ? coords.slice(cur)     : []

    const pastPath   = curvePath(pastCoords)
    const futurePath = futCoords.length >= 2 ? curvePath(futCoords) : ''
    const lastPast   = pastCoords[pastCoords.length - 1]
    const areaPath   = lastPast ? `${pastPath} L ${lastPast.x.toFixed(1)} ${CHART_H} L 0 ${CHART_H} Z` : ''
    const compPath   = curvePath(compCoords)
    const curCoord   = coords.find(c => c.isCurrent) ?? null

    return { pastPath, futurePath, areaPath, compPath, curCoord, coords }
  }, [bars, compBars, w])

  const fmt = (n: number) => Math.round(n).toLocaleString()

  return (
    <Widget tag={tag} action={action} size="rectangle">
      {/* Header — title + value + delta */}
      <View style={st.header}>
        {title ? <Text style={[st.title, { color: colors.text }]}>{title}</Text> : null}
        <View style={st.headerRow}>
          <Text style={[st.value, { color: colors.text }]}>{unit}{fmt(curVal)}</Text>
          {compVal > 0 && (
            <View style={st.deltaRow}>
              <Text style={[st.deltaArrow, { color: trendColor }]}>{arrow}</Text>
              <Text style={[st.deltaPct, { color: trendColor }]}>
                {deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%
              </Text>
              <Text style={[st.deltaLabel, { color: colors.textMuted }]}>vs last period</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chart — Analytics visual, compact */}
      <View onLayout={e => setW(Math.max(e.nativeEvent.layout.width, 1))} style={st.chartWrap}>
        <Svg width={w} height={CHART_H} viewBox={`0 0 ${w} ${CHART_H}`}>
          <Defs>
            <LinearGradient id="spend-mini-grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={trendColor} stopOpacity={0.22} />
              <Stop offset="80%"  stopColor={trendColor} stopOpacity={0.03} />
              <Stop offset="100%" stopColor={trendColor} stopOpacity={0}    />
            </LinearGradient>
          </Defs>

          {compPath ? (
            <Path d={compPath} fill="none" stroke={colors.textMuted}
              strokeWidth={1.2} strokeDasharray="4 4" strokeOpacity={0.4}
              strokeLinejoin="round" strokeLinecap="round" />
          ) : null}

          <Path d={areaPath} fill="url(#spend-mini-grad)" />

          <Path d={pastPath} fill="none" stroke={trendColor}
            strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {futurePath ? (
            <Path d={futurePath} fill="none" stroke={trendColor}
              strokeWidth={1.6} strokeDasharray="5 5" strokeOpacity={0.4}
              strokeLinejoin="round" strokeLinecap="round" />
          ) : null}

          {coords.map((c, i) => !c.isCurrent && (
            <Circle key={i} cx={c.x} cy={c.y} r={2.5}
              fill={colors.surface} stroke={trendColor} strokeWidth={1.5}
              strokeOpacity={c.isFuture ? 0.3 : 0.8} fillOpacity={c.isFuture ? 0.4 : 1} />
          ))}

          {curCoord && (
            <>
              <Circle cx={curCoord.x} cy={curCoord.y} r={8}   fill={trendColor} fillOpacity={0.12} />
              <Circle cx={curCoord.x} cy={curCoord.y} r={4.5} fill={colors.surface} stroke={trendColor} strokeWidth={2} />
              <Circle cx={curCoord.x} cy={curCoord.y} r={2}   fill={trendColor} />
            </>
          )}
        </Svg>
      </View>

      <View style={st.labelsRow}>
        {bars.map((bar, i) => (
          <Text key={i} style={[
            st.label,
            { color: bar.isCurrent ? colors.text : colors.textFaint },
            bar.isCurrent && { fontFamily: theme.fontBold },
          ]}>{bar.label.toLowerCase()}</Text>
        ))}
      </View>
    </Widget>
  )
}

const st = StyleSheet.create({
  header:     { gap: 4 },
  title:      { fontSize: 18, fontFamily: theme.fontBold, letterSpacing: -0.4 },
  headerRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  value:      { fontSize: 30, fontFamily: theme.fontMonoBold, letterSpacing: -1.2 },
  deltaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaArrow: { fontSize: 11 },
  deltaPct:   { fontSize: 12, fontFamily: theme.fontMono, letterSpacing: -0.2 },
  deltaLabel: { fontSize: 11, fontFamily: theme.fontRegular, marginLeft: 4 },
  chartWrap:  { width: '100%' },
  labelsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
  label:      { flex: 1, textAlign: 'center', fontSize: 9, fontFamily: theme.fontMono },
})
