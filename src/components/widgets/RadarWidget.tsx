import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Line } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

// ── RadarWidget ───────────────────────────────────────────────────────
// Spider/radar chart of categorical spend.
//
// Caller passes raw category totals; widget filters zeros, sorts by
// value desc, takes the top `maxCategories` (default 6 — > 6 spokes get
// unreadable), then plots each as a fraction of the top value so the
// outer ring is "the biggest category" and the polygon shape encodes
// the relative distribution.
//
// Needs ≥ 3 categories to draw a polygon — otherwise falls back to a
// compact text list.

const RADAR_SIZE = 240
const RADAR_CX   = RADAR_SIZE / 2
const RADAR_CY   = RADAR_SIZE / 2
const RADAR_R    = 88

function radarPoint(angle: number, r: number) {
  // -π/2 puts spoke 0 at 12 o'clock
  const a = angle - Math.PI / 2
  return { x: RADAR_CX + r * Math.cos(a), y: RADAR_CY + r * Math.sin(a) }
}

export interface RadarCategory {
  label: string
  value: number
}

interface Props {
  tag?: string
  title?: string
  categories: RadarCategory[]
  unit?: string
  maxCategories?: number
  action?: React.ReactNode
}

export function RadarWidget({
  tag = 'stats',
  title = 'Breakdown by category',
  categories,
  unit = '',
  maxCategories = 6,
  action,
}: Props) {
  const { colors } = useTheme()

  const items = categories
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, maxCategories)

  const n = items.length

  if (n < 3) {
    return (
      <Widget tag={tag} action={action} size="rectangle">
        <Text style={[rw.title, { color: colors.text }]}>{title}</Text>
        <Text style={[rw.empty, { color: colors.textFaint }]}>
          {n === 0 ? 'no spend tracked yet' : 'add at least 3 categories to plot the radar'}
        </Text>
        <View style={rw.miniList}>
          {items.map(c => (
            <View key={c.label} style={rw.miniRow}>
              <Text style={[rw.miniLabel, { color: colors.text }]}>{c.label}</Text>
              <Text style={[rw.miniValue, { color: colors.text }]}>{unit}{c.value.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </Widget>
    )
  }

  // Linear normalization vs the top category → outer ring = the biggest.
  const max     = items[0].value
  const rings   = [0.25, 0.5, 0.75, 1.0]
  const angles  = items.map((_, i) => (i / n) * 2 * Math.PI)
  const points  = items.map((c, i) => radarPoint(angles[i], (c.value / max) * RADAR_R))
  const dataPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ') + ' Z'

  return (
    <Widget tag={tag} action={action} size="rectangle">
      <Text style={[rw.title, { color: colors.text }]}>{title}</Text>

      <View style={rw.chartWrap}>
        <Svg width={RADAR_SIZE} height={RADAR_SIZE} viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}>
          <Defs>
            <LinearGradient id="radarw-grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={colors.accent} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0.08} />
            </LinearGradient>
          </Defs>

          {/* Ring gridlines */}
          {rings.map((r, ri) => {
            const pts = angles.map(a => radarPoint(a, r * RADAR_R))
            const d   = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
            return <Path key={ri} d={d} fill="none" stroke={colors.text} strokeOpacity={0.08} strokeWidth={1} />
          })}

          {/* Spokes */}
          {angles.map((a, i) => {
            const tip = radarPoint(a, RADAR_R)
            return <Line key={i} x1={RADAR_CX} y1={RADAR_CY} x2={tip.x} y2={tip.y} stroke={colors.text} strokeOpacity={0.1} strokeWidth={1} />
          })}

          {/* Data polygon */}
          <Path d={dataPath} fill="url(#radarw-grad)" />
          <Path d={dataPath} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.surface} stroke={colors.accent} strokeWidth={2} />
          ))}
        </Svg>

        {/* Spoke labels — just the category name */}
        {items.map((cat, i) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2
          const labelR = RADAR_R + 20
          const lx = RADAR_CX + labelR * Math.cos(a)
          const ly = RADAR_CY + labelR * Math.sin(a)
          return (
            <Text
              key={`${cat.label}-${i}`}
              style={[
                rw.label,
                {
                  color: colors.textMuted,
                  left: lx - 40,
                  top:  ly - 8,
                  textAlign: lx < RADAR_CX - 5 ? 'right' : lx > RADAR_CX + 5 ? 'left' : 'center',
                },
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          )
        })}
      </View>
    </Widget>
  )
}

const rw = StyleSheet.create({
  // Mirrors Analytics card style: sentence-case, bold, base size.
  title:      { fontSize: theme.textBase, fontFamily: theme.fontBold },
  chartWrap:  { width: RADAR_SIZE, height: RADAR_SIZE, position: 'relative', alignSelf: 'center', marginTop: theme.sp3 },
  label:      { position: 'absolute', width: 80, fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
  empty:      { fontSize: 13, fontFamily: theme.fontMono, fontStyle: 'italic', paddingVertical: 4 },
  miniList:   { gap: theme.sp2, marginTop: theme.sp2 },
  miniRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  miniLabel:  { fontSize: 13, fontFamily: theme.fontMedium },
  miniValue:  { fontSize: 13, fontFamily: theme.fontMonoBold },
})
