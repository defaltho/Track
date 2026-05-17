import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

// ── BreakdownWidget ───────────────────────────────────────────────────
// Rectangle widget — a stacked color bar + list of rows with value + delta.
// For Track: spending breakdown by category (categories + monthly amount +
// % of total). Mirrors the "Traffic source" data-widget pattern but lives
// inside the Track design system (lowercase tag, Roboto Black title,
// Space Mono numbers, hairline rules, ink palette).

export interface BreakdownItem {
  label: string
  value: number
  color: string
  delta?: number      // optional positive/negative number for trend arrow
}

interface Props {
  tag?: string
  title: string
  items: BreakdownItem[]
  unit?: string       // e.g. "€" — prefixed before value
  action?: React.ReactNode
  maxRows?: number
}

export function BreakdownWidget({
  tag = 'stats', title, items, unit, action, maxRows = 4,
}: Props) {
  const { colors } = useTheme()
  const visible = items.slice(0, maxRows)
  const total = items.reduce((sum, it) => sum + it.value, 0)

  return (
    <Widget tag={tag} action={action} size="rectangle">
      <Text style={[bw.title, { color: colors.text }]}>{title}</Text>

      {/* Stacked color bar — proportional segments */}
      {total > 0 && (
        <View style={bw.barRow}>
          {visible.map((it, i) => {
            const flex = Math.max(it.value / total, 0.06) // min visible width
            return (
              <View
                key={`${it.label}-${i}`}
                style={[bw.barSeg, { backgroundColor: it.color, flex }]}
              />
            )
          })}
        </View>
      )}

      {/* Rows: dot · label · value · delta */}
      <View style={bw.list}>
        {visible.map((it, i) => {
          const isLast = i === visible.length - 1
          const trend  = it.delta ?? 0
          const trendColor = trend > 0 ? colors.success : trend < 0 ? colors.danger : colors.textMuted
          const arrow = trend > 0 ? '▲' : trend < 0 ? '▼' : '·'
          return (
            <View key={`${it.label}-${i}`}>
              <View style={bw.row}>
                <View style={[bw.dot, { backgroundColor: it.color }]} />
                <Text style={[bw.label, { color: colors.text }]} numberOfLines={1}>{it.label}</Text>
                <Text style={[bw.value, { color: colors.text }]}>
                  {unit}{it.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
                {it.delta !== undefined && (
                  <View style={bw.delta}>
                    <Text style={[bw.deltaArrow, { color: trendColor }]}>{arrow}</Text>
                    <Text style={[bw.deltaValue, { color: trendColor }]}>
                      {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
              {!isLast && <View style={[bw.rule, { backgroundColor: colors.border }]} />}
            </View>
          )
        })}
        {items.length === 0 && (
          <Text style={[bw.empty, { color: colors.textFaint }]}>nothing yet</Text>
        )}
      </View>
    </Widget>
  )
}

const bw = StyleSheet.create({
  // Big bold title — echoes the notebook masthead
  title:      { fontSize: 26, fontFamily: theme.fontBlack, letterSpacing: -1, lineHeight: 30 },

  // Stacked bar — pill-shaped segments with gaps
  barRow:     { flexDirection: 'row', gap: 6, height: 6, marginTop: theme.sp3 },
  barSeg:     { height: 6, borderRadius: 999 },

  // Rows
  list:       { marginTop: theme.sp3 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dot:        { width: 10, height: 10, borderRadius: 5 },
  label:      { flex: 1, fontSize: 13, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
  value:      { fontSize: 13, fontFamily: theme.fontMonoBold, letterSpacing: -0.2, minWidth: 72, textAlign: 'right' },
  delta:      { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 56, justifyContent: 'flex-end' },
  deltaArrow: { fontSize: 10 },
  deltaValue: { fontSize: 12, fontFamily: theme.fontMono, letterSpacing: -0.1 },
  rule:       { height: StyleSheet.hairlineWidth },

  empty:      { fontSize: 13, fontFamily: theme.fontMono, fontStyle: 'italic', paddingVertical: 12 },
})
