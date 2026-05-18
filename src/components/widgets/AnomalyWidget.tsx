import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { detectAnomalies, CategoryAnomaly } from '../../utils/patterns'

interface Props {
  subscriptions: any[]
}

function AnomalyRow({ a, colors }: { a: CategoryAnomaly; colors: any }) {
  const isSpike = a.deltaPct > 0
  const pctColor = a.isAnomaly
    ? (isSpike ? colors.danger : colors.success)
    : colors.textMuted
  const sign = a.deltaPct > 0 ? '+' : ''
  return (
    <View style={r.row}>
      <View style={r.left}>
        <Text style={[r.cat, { color: colors.text }]} numberOfLines={1}>{a.category}</Text>
        <Text style={[r.curr, { color: colors.textFaint }]}>€{a.currentMonth.toFixed(0)} · avg €{a.avg3Month.toFixed(0)}</Text>
      </View>
      <View style={[r.badge, { backgroundColor: pctColor + '1A' }]}>
        <Text style={[r.pct, { color: pctColor }]}>{sign}{a.deltaPct.toFixed(0)}%</Text>
      </View>
    </View>
  )
}

export function AnomalyWidget({ subscriptions }: Props) {
  const { colors } = useTheme()
  const anomalies = detectAnomalies(subscriptions)

  if (anomalies.length === 0) {
    return (
      <Widget tag="spending patterns" size="rectangle">
        <View style={w.center}>
          <Text style={[w.empty, { color: colors.textFaint }]}>no anomalies detected</Text>
        </View>
      </Widget>
    )
  }

  const flagged = anomalies.filter(a => a.isAnomaly)
  const rest    = anomalies.filter(a => !a.isAnomaly).slice(0, 2)
  const rows    = [...flagged, ...rest].slice(0, 4)

  return (
    <Widget tag="spending patterns" size="rectangle">
      {flagged.length > 0 && (
        <Text style={[w.hint, { color: colors.warning }]}>
          {flagged.length} {flagged.length === 1 ? 'category' : 'categories'} above avg
        </Text>
      )}
      <View style={w.list}>
        {rows.map(a => <AnomalyRow key={a.category} a={a} colors={colors} />)}
      </View>
    </Widget>
  )
}

const w = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:  { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic' },
  hint:   { fontSize: 10, fontFamily: theme.fontBold, letterSpacing: 0.3, marginBottom: 6, textTransform: 'uppercase' },
  list:   { gap: 2 },
})

const r = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  left:  { flex: 1, gap: 1 },
  cat:   { fontSize: 13, fontFamily: theme.fontBold },
  curr:  { fontSize: 10, fontFamily: theme.fontMono, letterSpacing: -0.2 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  pct:   { fontSize: 11, fontFamily: theme.fontMonoBold, letterSpacing: -0.3 },
})
