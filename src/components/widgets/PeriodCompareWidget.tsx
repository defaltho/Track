import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { monthlyEquivalent } from '../../utils/calculations'

interface Props {
  subscriptions: any[]
  symbol: string
}

function getMonthSpend(subscriptions: any[], year: number, month: number): number {
  return subscriptions
    .filter((s: any) => {
      if (s.active === false) return false
      if (!s.nextChargeDate) return true
      const d = new Date(s.nextChargeDate)
      if (isNaN(d.getTime())) return true
      // Include if charge falls in this month OR it's monthly recurring
      const chargeMonth = d.getMonth()
      const chargeYear  = d.getFullYear()
      return chargeYear === year && chargeMonth === month
    })
    .reduce((sum: number, s: any) => sum + monthlyEquivalent(s.price, s.billingCycle), 0)
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function PeriodCompareWidget({ subscriptions, symbol }: Props) {
  const { colors } = useTheme()

  const { thisMonth, lastMonth, thisLabel, lastLabel, delta, deltaPct } = useMemo(() => {
    const now = new Date()
    const thisY = now.getFullYear()
    const thisM = now.getMonth()
    const lastDate = new Date(thisY, thisM - 1, 1)
    const lastY = lastDate.getFullYear()
    const lastM = lastDate.getMonth()

    const thisMonth = getMonthSpend(subscriptions, thisY, thisM)
    const lastMonth = getMonthSpend(subscriptions, lastY, lastM)
    const delta = thisMonth - lastMonth
    const deltaPct = lastMonth > 0 ? (delta / lastMonth) * 100 : 0

    return {
      thisMonth,
      lastMonth,
      thisLabel: MONTH_NAMES[thisM],
      lastLabel: MONTH_NAMES[lastM],
      delta,
      deltaPct,
    }
  }, [subscriptions])

  const maxVal = Math.max(thisMonth, lastMonth, 1)
  const thisPct  = thisMonth / maxVal
  const lastPct  = lastMonth / maxVal

  const deltaColor = delta > 0 ? colors.danger : delta < 0 ? colors.success : colors.textMuted
  const arrow      = delta > 0 ? '▲' : delta < 0 ? '▼' : '·'

  return (
    <Widget tag="period compare" size="rectangle">
      <View style={s.row}>
        {/* Last month column */}
        <View style={s.col}>
          <Text style={[s.periodLabel, { color: colors.textMuted }]}>{lastLabel}</Text>
          <View style={s.barTrack}>
            <View style={[s.barFill, { backgroundColor: colors.border, height: `${Math.round(lastPct * 100)}%` }]} />
          </View>
          <Text style={[s.amount, { color: colors.textMuted }]}>
            {symbol}{lastMonth.toFixed(0)}
          </Text>
        </View>

        {/* Delta column */}
        <View style={s.deltaCol}>
          <Text style={[s.deltaArrow, { color: deltaColor }]}>{arrow}</Text>
          <Text style={[s.deltaPct, { color: deltaColor }]}>
            {delta === 0 ? '—' : `${Math.abs(deltaPct).toFixed(0)}%`}
          </Text>
        </View>

        {/* This month column */}
        <View style={s.col}>
          <Text style={[s.periodLabel, { color: colors.accent }]}>{thisLabel}</Text>
          <View style={s.barTrack}>
            <View style={[s.barFill, { backgroundColor: colors.accent, height: `${Math.round(thisPct * 100)}%` }]} />
          </View>
          <Text style={[s.amount, { color: colors.text }]}>
            {symbol}{thisMonth.toFixed(0)}
          </Text>
        </View>
      </View>
    </Widget>
  )
}

const s = StyleSheet.create({
  row:        { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: theme.sp3 },
  col:        { flex: 1, alignItems: 'center', gap: theme.sp2 },
  periodLabel:{ fontSize: theme.textXs, fontFamily: theme.fontBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  barTrack:   { width: 32, height: 80, backgroundColor: 'transparent', justifyContent: 'flex-end', alignItems: 'center' },
  barFill:    { width: 28, borderRadius: theme.radiusMd },
  amount:     { fontSize: theme.textSm, fontFamily: theme.fontMonoBold },

  deltaCol:   { alignItems: 'center', justifyContent: 'center', paddingBottom: 24 },
  deltaArrow: { fontSize: 16, fontFamily: theme.fontBold },
  deltaPct:   { fontSize: theme.textXs, fontFamily: theme.fontBold },
})
