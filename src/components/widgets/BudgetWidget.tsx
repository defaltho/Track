import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme, CURRENCY_SYMBOL } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import type { Budget, Subscription } from '../../stores/data'
import { mask } from '../../utils/format'

interface Props {
  tag?: string
  spent: number
  budget: number | null
  currency: string
  budgets?: Budget[]
  subscriptions?: Subscription[]
  isPrivate?: boolean
}

export function BudgetWidget({
  tag = 'monthly budget',
  spent,
  budget,
  currency,
  budgets = [],
  subscriptions = [],
  isPrivate = false,
}: Props) {
  const { colors } = useTheme()
  const symbol = CURRENCY_SYMBOL[currency] ?? ''

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {}
    for (const sub of subscriptions) {
      if (sub.active === false || (sub.price ?? 0) <= 0) continue
      const cat = sub.category || 'Other'
      map[cat] = (map[cat] ?? 0) + (sub.price || 0)
    }
    return map
  }, [subscriptions])

  if (budgets.length > 0) {
    return (
      <Widget tag={tag} size="rectangle">
        <View style={{ gap: 10 }}>
          {budgets.map(b => {
            const catSpent = b.category === 'All' ? spent : (categorySpend[b.category] ?? 0)
            const pct = b.amount > 0 ? catSpent / b.amount : 0
            const over = pct > 1
            const barColor = over ? colors.danger : colors.accent
            return (
              <View key={b.id} style={{ gap: 4 }}>
                <View style={b2.row}>
                  <Text style={[b2.cat, { color: colors.text }]} numberOfLines={1}>{b.category}</Text>
                  <Text style={[b2.pct, { color: over ? colors.danger : colors.textMuted }]}>
                    {mask(`${symbol}${catSpent.toFixed(0)} / ${symbol}${b.amount.toFixed(0)}`, isPrivate)}
                  </Text>
                </View>
                <View style={[b2.track, { backgroundColor: colors.border }]}>
                  <View style={[b2.fill, { width: `${Math.min(Math.round(pct * 100), 100)}%` as any, backgroundColor: barColor }]} />
                </View>
              </View>
            )
          })}
        </View>
      </Widget>
    )
  }

  if (!budget || budget <= 0) {
    return (
      <Widget tag={tag} size="rectangle">
        <View style={b.center}>
          <Text style={[b.empty, { color: colors.textFaint }]}>
            set a budget in settings
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
      <View style={b.heroRow}>
        <View style={b.heroLeft}>
          <Text style={[b.spent, { color: colors.text }]}>
            {mask(`${symbol}${spent.toFixed(0)}`, isPrivate)}
          </Text>
          <Text style={[b.total, { color: colors.textMuted }]}>
            {isPrivate ? '' : ` / ${symbol}${budget.toFixed(0)}`}
          </Text>
        </View>
        <Text style={[b.pct, { color: over ? colors.danger : colors.textMuted }]}>
          {mask(`${over ? '+' : ''}${Math.round(pct * 100)}%`, isPrivate)}
        </Text>
      </View>

      <View style={[b.track, { backgroundColor: colors.border }]}>
        <View style={[b.fill, { width: barFill, backgroundColor: barColor }]} />
      </View>

      <Text style={[b.sub, { color: over ? colors.danger : colors.textMuted }]}>
        {isPrivate ? '••••' : over
          ? `${symbol}${(spent - budget).toFixed(2)} over budget`
          : `${symbol}${remaining.toFixed(2)} available`
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

const b2 = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cat:   { fontSize: 12, fontFamily: theme.fontMedium, flex: 1 },
  pct:   { fontSize: 11, fontFamily: theme.fontMono, letterSpacing: -0.2 },
  track: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:  { height: 4, borderRadius: 2 },
})
