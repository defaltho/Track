import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { buildMonthlyBars } from '../../utils/chart'
import type { Subscription, Task } from '../../stores/data'
import { mask } from '../../utils/format'

interface Props {
  subscriptions: Subscription[]
  tasks: Task[]
  symbol: string
  isPrivate?: boolean
}

function getMonthKey(dateStr: string): string {
  return dateStr?.slice(0, 7) ?? ''
}

export function CashflowWidget({ subscriptions, tasks, symbol, isPrivate = false }: Props) {
  const { colors } = useTheme()

  const expenseBars = useMemo(
    () => buildMonthlyBars(subscriptions, 2, 0, 0),
    [subscriptions]
  )

  const incomeBars = useMemo(() => {
    const buckets: Record<string, number> = {}
    for (const sub of subscriptions) {
      if ((sub.price ?? 0) < 0 && sub.active !== false) {
        const key = getMonthKey(sub.nextChargeDate ?? new Date().toISOString())
        buckets[key] = (buckets[key] ?? 0) + Math.abs(sub.price)
      }
    }
    for (const task of tasks) {
      if (task.amount && task.amount > 0) {
        const key = getMonthKey(task.dueDate ?? task.createdAt ?? new Date().toISOString())
        buckets[key] = (buckets[key] ?? 0) + task.amount
      }
    }
    return expenseBars.map(bar => ({ ...bar, value: buckets[bar.label] ?? 0 }))
  }, [subscriptions, tasks, expenseBars])

  const maxVal = Math.max(
    ...expenseBars.map(b => b.value),
    ...incomeBars.map(b => b.value),
    0.01
  )

  const currentIncome  = incomeBars.find(b => b.isCurrent)?.value ?? 0
  const currentExpense = expenseBars.find(b => b.isCurrent)?.value ?? 0
  const net = currentIncome - currentExpense
  const netColor = net >= 0 ? colors.success : colors.danger

  const W = 280, H = 44, barW = 28, gap = 8, groupGap = 20
  const groupW = barW * 2 + gap
  const totalGroupW = groupW + groupGap
  const n = expenseBars.length

  const bars = expenseBars.map((eb, i) => {
    const income = incomeBars[i]?.value ?? 0
    const expense = eb.value
    const hIncome  = income  > 0 ? Math.max(3, (income  / maxVal) * H) : 1
    const hExpense = expense > 0 ? Math.max(3, (expense / maxVal) * H) : 1
    const x = i * totalGroupW
    return { label: eb.label, income, expense, hIncome, hExpense, x }
  })

  return (
    <Widget tag="cashflow" size="rectangle">
      <View style={cf.heroRow}>
        <Text style={[cf.net, { color: netColor }]}>
          {mask(`${net >= 0 ? '+' : ''}${symbol}${Math.abs(net).toFixed(0)}`, isPrivate)}
        </Text>
        <Text style={[cf.netLabel, { color: colors.textMuted }]}>net this month</Text>
      </View>

      <View style={cf.chartWrap}>
        <Svg width={W} height={H} viewBox={`0 0 ${n * totalGroupW} ${H}`} style={{ width: '100%' }}>
          {bars.map(bar => (
            <React.Fragment key={bar.label}>
              <Rect
                x={bar.x}
                y={H - bar.hIncome}
                width={barW}
                height={bar.hIncome}
                rx={3}
                fill={colors.success}
                opacity={0.85}
              />
              <Rect
                x={bar.x + barW + gap}
                y={H - bar.hExpense}
                width={barW}
                height={bar.hExpense}
                rx={3}
                fill={colors.accentRed}
                opacity={0.75}
              />
            </React.Fragment>
          ))}
        </Svg>
        <View style={cf.labelsRow}>
          {bars.map(bar => {
            const parts = bar.label.split('-')
            const label = parts.length === 2
              ? new Date(`${bar.label}-01`).toLocaleString('default', { month: 'short' }).toLowerCase()
              : bar.label
            return (
              <Text key={bar.label} style={[cf.barLabel, { color: colors.textFaint, width: totalGroupW }]}>
                {label}
              </Text>
            )
          })}
        </View>
      </View>

      <View style={cf.legend}>
        <View style={cf.legendItem}>
          <View style={[cf.dot, { backgroundColor: colors.success }]} />
          <Text style={[cf.legendTxt, { color: colors.textMuted }]}>income</Text>
        </View>
        <View style={cf.legendItem}>
          <View style={[cf.dot, { backgroundColor: colors.accentRed }]} />
          <Text style={[cf.legendTxt, { color: colors.textMuted }]}>expense</Text>
        </View>
      </View>
    </Widget>
  )
}

const cf = StyleSheet.create({
  heroRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  net:      { fontSize: 26, fontFamily: theme.fontMonoBold, letterSpacing: -1 },
  netLabel: { fontSize: 11, fontFamily: theme.fontRegular },
  chartWrap:{ width: '100%', marginVertical: 6 },
  labelsRow:{ flexDirection: 'row', marginTop: 4 },
  barLabel: { fontSize: 9, fontFamily: theme.fontMono, letterSpacing: 0.2, textAlign: 'center' },
  legend:   { flexDirection: 'row', gap: 12 },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  legendTxt:{ fontSize: 10, fontFamily: theme.fontRegular },
})
