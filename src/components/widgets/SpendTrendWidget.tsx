import React, { useMemo, useState, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
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

const CHART_H  = 80
const TOOLTIP_W = 108
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

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

  // Refs so the stable Tap gesture closure always reads current values.
  const coordsRef      = useRef<typeof coords>([])
  const selectedIdxRef = useRef(selectedIdx)
  selectedIdxRef.current = selectedIdx

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

  coordsRef.current = coords

  // Stable tap gesture — uses refs to avoid stale closures. RNGH Tap runs via
  // its own native recognizer (separate from the JS responder system), so it
  // fires correctly even when wrapped in an outer native Pressable (EditableWidget).
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
      <GestureDetector gesture={chartTap}>
      <View onLayout={e => setW(Math.max(e.nativeEvent.layout.width, 1))} style={[st.chartWrap, { position: 'relative' }]}>

        {selectedIdx !== null && coords[selectedIdx] && (() => {
          const sel   = coords[selectedIdx]
          const comp  = compBars[selectedIdx]?.value ?? 0
          const delta = comp > 0 ? ((sel.value - comp) / comp) * 100 : 0
          const left  = Math.max(4, Math.min(w - TOOLTIP_W - 4, sel.x - TOOLTIP_W / 2))
          const above = sel.y > 40
          return (
            <View style={[st.tooltip, {
              left, top: above ? sel.y - 76 : sel.y + 10,
              backgroundColor: colors.surface, borderColor: colors.border,
            }]}>
              <Text style={[st.ttMonth, { color: colors.textMuted }]}>{sel.label}</Text>
              <Text style={[st.ttValue, { color: colors.text }]}>{unit}{sel.value.toFixed(2)}</Text>
              {comp > 0 && (
                <Text style={[st.ttDelta, { color: delta > 0 ? COLOR_UP : COLOR_DOWN }]}>
                  {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
                </Text>
              )}
              {comp > 0 && (
                <Text style={[st.ttComp, { color: colors.textFaint }]}>
                  prev: {unit}{comp.toFixed(2)}
                </Text>
              )}
            </View>
          )
        })()}

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
              strokeWidth={2} strokeDasharray="6 3" strokeOpacity={0.75}
              strokeLinejoin="round" strokeLinecap="round" />
          ) : null}

          <Path d={areaPath} fill="url(#spend-mini-grad)" />

          <Path d={pastPath} fill="none" stroke={trendColor}
            strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {coords.map((c, i) => !c.isCurrent && !c.isFuture && (
            <Circle key={i} cx={c.x} cy={c.y} r={selectedIdx === i ? 3.5 : 2.5}
              fill={colors.surface} stroke={trendColor}
              strokeWidth={selectedIdx === i ? 2 : 1.5} strokeOpacity={0.8} />
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
      </GestureDetector>

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

  tooltip:  { position: 'absolute', zIndex: 20, borderWidth: StyleSheet.hairlineWidth,
               borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, width: TOOLTIP_W },
  ttMonth:  { fontSize: 10, fontFamily: theme.fontMono, marginBottom: 2 },
  ttValue:  { fontSize: 14, fontFamily: theme.fontBlack, letterSpacing: -0.5 },
  ttDelta:  { fontSize: 11, fontFamily: theme.fontMedium, marginTop: 2 },
  ttComp:   { fontSize: 10, fontFamily: theme.fontRegular, marginTop: 3, opacity: 0.8 },
})
