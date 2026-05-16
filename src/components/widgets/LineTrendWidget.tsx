import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

// ── LineTrendWidget ───────────────────────────────────────────────────
// Rectangle widget — big metric + delta + minimalist line chart.
// Inspired by the reference "Engagement" / "Activation" cards.
// For Track: monthly spend trend, charge frequency, etc.

interface Props {
  tag: string
  title?: string             // optional title above the value
  value: number              // hero value
  unit?: string              // prefix (e.g. "€")
  deltaPct?: number          // signed % vs previous period
  deltaLabel?: string        // e.g. "vs last month"
  series: number[]           // chart data
  labels?: string[]          // x-axis labels (one per point)
}

export function LineTrendWidget({
  tag, title, value, unit, deltaPct, deltaLabel, series, labels,
}: Props) {
  const { colors } = useTheme()
  const w = 280, h = 70, pad = 6
  const min = Math.min(...series, 0)
  const max = Math.max(...series, 1)
  const span = max - min || 1
  const stepX = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0
  const pts = series.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (v - min) / span) * (h - pad * 2)
    return { x, y }
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const fmt = (n: number) => Math.round(n).toLocaleString()
  const trendColor =
    deltaPct === undefined ? colors.textMuted :
    deltaPct > 0 ? colors.success :
    deltaPct < 0 ? colors.danger :
    colors.textMuted
  const arrow =
    deltaPct === undefined ? '' :
    deltaPct > 0 ? '↑' :
    deltaPct < 0 ? '↓' :
    '·'

  return (
    <Widget tag={tag} size="rectangle">
      {title ? <Text style={[lt.title, { color: colors.text }]}>{title}</Text> : null}

      <View style={lt.headerRow}>
        <Text style={[lt.value, { color: colors.text }]}>{unit}{fmt(value)}</Text>
        {deltaPct !== undefined && (
          <View style={lt.deltaRow}>
            <Text style={[lt.deltaArrow, { color: trendColor }]}>{arrow}</Text>
            <Text style={[lt.deltaPct, { color: trendColor }]}>
              {deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%
            </Text>
            {deltaLabel ? <Text style={[lt.deltaLabel, { color: colors.textMuted }]}>{deltaLabel}</Text> : null}
          </View>
        )}
      </View>

      <View style={lt.chartWrap}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%' }}>
          <Path d={d} stroke={colors.text} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {last && <Circle cx={last.x} cy={last.y} r={3} fill={colors.text} />}
          {/* x-axis baseline tick lines */}
          {pts.map((p, i) => (
            <Line key={i} x1={p.x} x2={p.x} y1={h - 2} y2={h - 6} stroke={colors.border} strokeWidth={1} />
          ))}
        </Svg>
      </View>

      {labels && labels.length > 0 && (
        <View style={lt.labelsRow}>
          {labels.map((l, i) => (
            <Text key={`${l}-${i}`} style={[lt.label, { color: colors.textFaint }]}>{l}</Text>
          ))}
        </View>
      )}
    </Widget>
  )
}

const lt = StyleSheet.create({
  title:      { fontSize: 18, fontFamily: theme.fontBold, letterSpacing: -0.4 },
  headerRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  value:      { fontSize: 32, fontFamily: theme.fontMonoBold, letterSpacing: -1.4 },
  deltaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaArrow: { fontSize: 11 },
  deltaPct:   { fontSize: 12, fontFamily: theme.fontMono, letterSpacing: -0.2 },
  deltaLabel: { fontSize: 11, fontFamily: theme.fontRegular, marginLeft: 4 },
  chartWrap:  { width: '100%' },
  labelsRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  label:      { fontSize: 9, fontFamily: theme.fontMono, letterSpacing: 0.4, textTransform: 'lowercase' },
})
