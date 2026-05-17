import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme, CURRENCY_SYMBOL } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

interface Props {
  tag?: string
  spent: number
  budget: number | null
  currency: string
}

export function BudgetWidget({ tag = 'orçamento mensal', spent, budget, currency }: Props) {
  const { colors } = useTheme()
  const symbol = CURRENCY_SYMBOL[currency] ?? ''

  if (!budget || budget <= 0) {
    return (
      <Widget tag={tag} size="rectangle">
        <View style={b.center}>
          <Text style={[b.empty, { color: colors.textFaint }]}>
            define um orçamento em settings
          </Text>
        </View>
      </Widget>
    )
  }

  const pct     = spent / budget
  const over    = pct > 1
  const barFill = `${Math.min(Math.round(pct * 100), 100)}%` as `${number}%`
  const barColor = over ? colors.danger : colors.accent
  const remaining = Math.abs(budget - spent)

  return (
    <Widget tag={tag} size="rectangle">
      {/* Hero row: spent / budget */}
      <View style={b.heroRow}>
        <View style={b.heroLeft}>
          <Text style={[b.spent, { color: colors.text }]}>
            {symbol}{spent.toFixed(0)}
          </Text>
          <Text style={[b.total, { color: colors.textMuted }]}>
            {' '}/ {symbol}{budget.toFixed(0)}
          </Text>
        </View>
        <Text style={[b.pct, { color: over ? colors.danger : colors.textMuted }]}>
          {over ? '+' : ''}{Math.round(pct * 100)}%
        </Text>
      </View>

      {/* 4px progress bar */}
      <View style={[b.track, { backgroundColor: colors.border }]}>
        <View style={[b.fill, { width: barFill, backgroundColor: barColor }]} />
      </View>

      {/* Sub-line */}
      <Text style={[b.sub, { color: over ? colors.danger : colors.textMuted }]}>
        {over
          ? `${symbol}${(spent - budget).toFixed(2)} acima do orçamento`
          : `${symbol}${remaining.toFixed(2)} disponível`
        }
      </Text>
    </Widget>
  )
}

const b = StyleSheet.create({
  heroRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heroLeft: { flexDirection: 'row', alignItems: 'baseline' },
  spent:    { fontSize: 32, fontFamily: theme.fontMonoBold, letterSpacing: -1.4 },
  total:    { fontSize: 15, fontFamily: theme.fontMono, letterSpacing: -0.4 },
  pct:      { fontSize: 13, fontFamily: theme.fontMono, letterSpacing: -0.2 },

  track:    { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:     { height: 4, borderRadius: 2 },

  sub:      { fontSize: 11, fontFamily: theme.fontMono, letterSpacing: 0.2 },

  center:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:    { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic', textAlign: 'center' },
})
