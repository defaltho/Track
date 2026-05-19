import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

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
  /** When provided, shows an Expense | Income toggle. These are the income items. */
  incomeItems?: BreakdownItem[]
  unit?: string       // e.g. "€" — prefixed before value
  action?: React.ReactNode
  maxRows?: number
}

export function BreakdownWidget({
  tag = 'stats', title, items, incomeItems, unit, action, maxRows = 4,
}: Props) {
  const { colors } = useTheme()
  const [mode, setMode] = useState<'expense' | 'income'>('expense')

  const active  = mode === 'expense' ? items : (incomeItems ?? [])
  const visible = active.slice(0, maxRows)
  const total   = active.reduce((sum, it) => sum + Math.abs(it.value), 0)

  const hasToggle = incomeItems !== undefined

  return (
    <Widget tag={tag} action={action} size="rectangle">
      <View style={bw.headerRow}>
        <Text style={[bw.title, { color: colors.text }]}>{title}</Text>
        {hasToggle && (
          <View style={[bw.toggle, { backgroundColor: colors.surfaceEl }]}>
            {(['expense', 'income'] as const).map(m => (
              <Pressable
                key={m}
                style={[bw.toggleBtn, mode === m && { backgroundColor: colors.surface }]}
                onPress={() => setMode(m)}
              >
                <Text style={[bw.toggleLabel, { color: mode === m ? colors.text : colors.textMuted }]}>
                  {m === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Stacked color bar — proportional segments */}
      {total > 0 ? (
        <View style={bw.barRow}>
          {visible.map((it, i) => {
            const flex = Math.max(Math.abs(it.value) / total, 0.06)
            return (
              <View
                key={`${it.label}-${i}`}
                style={[bw.barSeg, { backgroundColor: it.color, flex }]}
              />
            )
          })}
        </View>
      ) : (
        <View style={bw.barRow} />
      )}

      {/* Rows: dot · label · value · delta */}
      <View style={bw.list}>
        {visible.length === 0 ? (
          <Text style={[bw.empty, { color: colors.textFaint }]}>
            {hasToggle && mode === 'income' ? 'No income tracked yet' : 'nothing yet'}
          </Text>
        ) : visible.map((it, i) => {
          const isLast     = i === visible.length - 1
          const trend      = it.delta ?? 0
          const trendColor = trend > 0 ? colors.success : trend < 0 ? colors.danger : colors.textMuted
          const arrow      = trend > 0 ? '▲' : trend < 0 ? '▼' : '·'
          return (
            <View key={`${it.label}-${i}`}>
              <View style={bw.row}>
                <View style={[bw.dot, { backgroundColor: it.color }]} />
                <Text style={[bw.label, { color: colors.text }]} numberOfLines={1}>{it.label}</Text>
                <Text style={[bw.value, { color: colors.text }]}>
                  {unit}{Math.abs(it.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
      </View>
    </Widget>
  )
}

const bw = StyleSheet.create({
  headerRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title:       { fontSize: 26, fontFamily: theme.fontBlack, letterSpacing: -1, lineHeight: 30, flex: 1 },

  toggle:      { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 2, alignSelf: 'flex-start', marginTop: 2 },
  toggleBtn:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  toggleLabel: { fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: -0.1 },

  barRow:      { flexDirection: 'row', gap: 6, height: 6, marginTop: theme.sp3 },
  barSeg:      { height: 6, borderRadius: 999 },

  list:        { marginTop: theme.sp3 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dot:         { width: 10, height: 10, borderRadius: 5 },
  label:       { flex: 1, fontSize: 13, fontFamily: theme.fontMedium, letterSpacing: -0.1 },
  value:       { fontSize: 13, fontFamily: theme.fontMonoBold, letterSpacing: -0.2, minWidth: 72, textAlign: 'right' },
  delta:       { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 56, justifyContent: 'flex-end' },
  deltaArrow:  { fontSize: 10 },
  deltaValue:  { fontSize: 12, fontFamily: theme.fontMono, letterSpacing: -0.1 },
  rule:        { height: StyleSheet.hairlineWidth },

  empty:       { fontSize: 13, fontFamily: theme.fontMono, fontStyle: 'italic', paddingVertical: 12 },
})
