import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { monthlyEquivalent } from '../../utils/calculations'

interface Props {
  subscriptions: any[]
  symbol: string
  limit?: number
}

export function TopExpensesWidget({ subscriptions, symbol, limit = 5 }: Props) {
  const { colors } = useTheme()

  const top = [...subscriptions]
    .filter(s => s.active !== false)
    .map(s => ({ ...s, monthly: monthlyEquivalent(s.price ?? 0, s.billingCycle ?? 'monthly') }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, limit)

  const max = top[0]?.monthly ?? 0.01

  return (
    <Widget tag="maiores despesas" size="rectangle">
      {top.length === 0 ? (
        <Text style={[te.empty, { color: colors.textFaint }]}>nenhuma subscrição ativa</Text>
      ) : top.map((s, i) => {
        const barW = `${Math.round((s.monthly / max) * 100)}%` as `${number}%`
        return (
          <View key={s.id} style={te.row}>
            <Text style={[te.rank, { color: colors.textFaint }]}>{i + 1}</Text>
            <Text style={te.emoji}>{s.emoji ?? '💳'}</Text>
            <View style={te.body}>
              <View style={te.nameRow}>
                <Text style={[te.name, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                <Text style={[te.amount, { color: colors.text }]}>{symbol}{s.monthly.toFixed(2)}</Text>
              </View>
              <View style={[te.track, { backgroundColor: colors.border }]}>
                <View style={[te.fill, { width: barW, backgroundColor: i === 0 ? colors.accent : colors.textFaint }]} />
              </View>
            </View>
          </View>
        )
      })}
    </Widget>
  )
}

const te = StyleSheet.create({
  empty:   { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic' },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rank:    { fontSize: 10, fontFamily: theme.fontMono, width: 12, textAlign: 'right' },
  emoji:   { fontSize: 16, width: 20, textAlign: 'center' },
  body:    { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  name:    { fontSize: 12, fontFamily: theme.fontMedium, flex: 1, letterSpacing: -0.1 },
  amount:  { fontSize: 12, fontFamily: theme.fontMonoBold, letterSpacing: -0.3, marginLeft: 8 },
  track:   { height: 2, borderRadius: 1, overflow: 'hidden' },
  fill:    { height: 2, borderRadius: 1 },
})
