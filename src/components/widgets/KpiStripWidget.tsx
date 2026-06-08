import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { monthlyEquivalent } from '../../utils/calculations'
import type { Subscription, Task } from '../../stores/data'
import { mask } from '../../utils/format'

interface Props {
  subscriptions: Subscription[]
  tasks: Task[]
  monthlyBudget: number | null
  monthlySpend: number
  symbol: string
  isPrivate?: boolean
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toFixed(0)
}

export function KpiStripWidget({ subscriptions, tasks, monthlyBudget, monthlySpend, symbol, isPrivate = false }: Props) {
  const { colors } = useTheme()

  const today = new Date().toISOString().slice(0, 10)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()

  const budgetPct = monthlyBudget && monthlyBudget > 0
    ? Math.min(999, Math.round((monthlySpend / monthlyBudget) * 100))
    : null

  const todaySpend = useMemo(() => {
    const subToday = subscriptions
      .filter(s => s.active !== false && s.nextChargeDate === today)
      .reduce((sum, s) => sum + (Number(s.price) || 0), 0)
    const taskToday = tasks
      .filter(t => t.dueDate === today && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    return subToday + taskToday
  }, [subscriptions, tasks, today])

  const perDayAvg = monthlySpend > 0 ? monthlySpend / daysInMonth : 0

  const topCategory = useMemo(() => {
    const sums: Record<string, number> = {}
    for (const s of subscriptions) {
      if (s.active === false) continue
      const m = monthlyEquivalent(s.price, s.billingCycle)
      sums[s.category] = (sums[s.category] ?? 0) + m
    }
    let bestCat = ''
    let bestVal = 0
    for (const [cat, val] of Object.entries(sums)) {
      if (val > bestVal) { bestCat = cat; bestVal = val }
    }
    return { name: bestCat || '—', value: bestVal }
  }, [subscriptions])

  const cells = [
    {
      icon: '🎯',
      value: mask(budgetPct != null ? `${budgetPct}%` : '—', isPrivate),
      label: 'budget',
      tone: budgetPct == null ? 'muted' : budgetPct >= 100 ? 'danger' : budgetPct >= 80 ? 'warning' : 'success',
    },
    {
      icon: '☀️',
      value: mask(`${symbol}${formatCompact(todaySpend)}`, isPrivate),
      label: 'today',
      tone: 'normal',
    },
    {
      icon: '📊',
      value: mask(`${symbol}${formatCompact(perDayAvg)}`, isPrivate),
      label: 'per day',
      tone: 'normal',
    },
    {
      icon: '🥇',
      value: mask(`${symbol}${formatCompact(topCategory.value)}`, isPrivate),
      label: topCategory.name.toLowerCase(),
      tone: 'normal',
    },
  ]

  const toneColor = (tone: string) =>
    tone === 'danger' ? colors.danger :
    tone === 'warning' ? colors.warning :
    tone === 'success' ? colors.success :
    tone === 'muted' ? colors.textFaint :
    colors.text

  return (
    <Widget tag="key metrics" size="rectangle">
      <View style={s.row}>
        {cells.map((c, i) => (
          <View key={c.label} style={[s.cell, i < cells.length - 1 && { borderRightColor: colors.border, borderRightWidth: 1 }]}>
            <Text style={s.icon}>{c.icon}</Text>
            <Text style={[s.value, { color: toneColor(c.tone) }]} numberOfLines={1}>{c.value}</Text>
            <Text style={[s.label, { color: colors.textMuted }]} numberOfLines={1}>{c.label}</Text>
          </View>
        ))}
      </View>
    </Widget>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flex: 1 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.sp2, gap: 4 },
  icon: { fontSize: 18 },
  value: { fontSize: theme.textLg, fontFamily: theme.fontBold },
  label: {
    fontSize: theme.textXs,
    fontFamily: theme.fontMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
