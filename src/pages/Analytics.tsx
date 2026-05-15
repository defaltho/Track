import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
} from 'react-native-svg'
import { useDataStore } from '../stores/data'
import {
  totalMonthlySpend,
  projectedYearly,
  coffees,
  monthlyEquivalent,
} from '../utils/calculations'
import { buildSpendingTimeline, pointsToPath, RANGE_DAYS } from '../utils/chart'
import { useTheme } from '../context/ThemeContext'
import { theme, CURRENCY_SYMBOL } from '../theme'

export function Analytics() {
  const { colors } = useTheme()
  const store = useDataStore()

  const currency = store.settings.defaultCurrency ?? 'EUR'
  const symbol = CURRENCY_SYMBOL[currency] ?? ''

  const monthly = useMemo(() => totalMonthlySpend(store.subscriptions), [store.subscriptions])
  const yearly = useMemo(() => projectedYearly(store.subscriptions), [store.subscriptions])
  const coffeeCount = useMemo(() => coffees(monthly), [monthly])

  const breakdown = useMemo(
    () =>
      store.subscriptions
        .filter((s: any) => s.active !== false)
        .map((s: any) => ({ ...s, monthly: monthlyEquivalent(s.price, s.billingCycle) }))
        .sort((a: any, b: any) => b.monthly - a.monthly),
    [store.subscriptions]
  )

  const [timeRange, setTimeRange] = useState('1Y')
  const timeline = useMemo(
    () => buildSpendingTimeline(store.subscriptions, RANGE_DAYS[timeRange]),
    [store.subscriptions, timeRange]
  )
  const path = useMemo(() => pointsToPath(timeline, 300, 100), [timeline])

  return (
    <ScrollView
      style={[s.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.text }]}>Analytics</Text>

      {/* Summary */}
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.summaryGrid}>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.text }]}>{symbol}{monthly.toFixed(0)}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>per month</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.text }]}>{symbol}{yearly.toFixed(0)}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>per year</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: colors.text }]}>{coffeeCount}</Text>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>coffees / mo</Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={[s.card, { backgroundColor: colors.accent }]}>
        <View style={s.chartHeader}>
          <Text style={[s.cardTitle, { color: colors.accentFg }]}>Spending over time</Text>
          <View style={s.filters}>
            {Object.keys(RANGE_DAYS).map(f => (
              <TouchableOpacity
                key={f}
                style={[s.filterPill, {
                  backgroundColor: timeRange === f ? colors.accentFg : 'rgba(255,255,255,0.15)',
                }]}
                onPress={() => setTimeRange(f)}
                accessibilityRole="button"
              >
                <Text style={[s.filterPillText, {
                  color: timeRange === f ? colors.accent : colors.accentFg,
                }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {store.subscriptions.length > 0 ? (
          <Svg width="100%" height={100} viewBox="0 0 300 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="g-analytics" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.accentFg} stopOpacity={0.25} />
                <Stop offset="100%" stopColor={colors.accentFg} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={path.area} fill="url(#g-analytics)" />
            <Path d={path.line} fill="none" stroke={colors.accentFg} strokeWidth={1.5} strokeLinejoin="round" />
            <Circle cx={path.last.x} cy={path.last.y} r={3} fill={colors.accentFg} />
          </Svg>
        ) : (
          <View style={s.chartEmpty}>
            <Text style={[s.chartEmptyText, { color: colors.accentFg }]}>
              Add a subscription to see the chart
            </Text>
          </View>
        )}
      </View>

      {/* Breakdown */}
      {breakdown.length > 0 ? (
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardTitle, { color: colors.text, marginBottom: theme.sp5 }]}>Breakdown</Text>
          {breakdown.map((sub: any) => {
            const pct = monthly > 0 ? (sub.monthly / monthly) * 100 : 0
            return (
              <View key={sub.id} style={s.breakdownRow}>
                <View style={s.breakdownInfo}>
                  <Text style={[s.breakdownName, { color: colors.text }]}>{sub.emoji ?? '💳'} {sub.name}</Text>
                  <Text style={[s.breakdownPct, { color: colors.textMuted }]}>{symbol}{sub.monthly.toFixed(2)} · {pct.toFixed(0)}%</Text>
                </View>
                <View style={[s.barTrack, { backgroundColor: colors.surfaceHigh }]}>
                  <View style={[s.barFill, { flex: pct, maxWidth: `${pct}%` as any, backgroundColor: colors.accent }]} />
                  <View style={{ flex: 100 - pct }} />
                </View>
              </View>
            )
          })}
        </View>
      ) : (
        <View style={[s.card, s.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.empty, { color: colors.textFaint }]}>No subscriptions yet</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp4, paddingBottom: 110 },

  pageTitle: {
    fontSize: 34,
    fontFamily: theme.fontBlack,
    letterSpacing: -1,
    marginBottom: theme.sp4,
  },

  card: {
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    ...theme.shadow,
  },

  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.sp3 },
  stat: { flex: 1 },
  statNum: { fontSize: theme.textXl, fontFamily: theme.fontBlack },
  statLabel: { fontSize: theme.textXs, fontFamily: theme.fontRegular, marginTop: 2 },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.sp4, flexWrap: 'wrap', gap: theme.sp2 },
  cardTitle: { fontSize: theme.textBase, fontFamily: theme.fontBold },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  filterPillText: { fontSize: theme.textXs, fontFamily: theme.fontMedium },

  breakdownRow: { marginBottom: theme.sp4 },
  breakdownInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.sp1 },
  breakdownName: { fontSize: theme.textSm, fontFamily: theme.fontMedium },
  breakdownPct: { fontSize: theme.textSm, fontFamily: theme.fontRegular },
  barTrack: { height: 4, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  barFill: { height: 4 },

  emptyCard: { alignItems: 'center', padding: theme.sp8 },
  empty: { fontSize: theme.textSm, fontFamily: theme.fontRegular },

  chartEmpty: { height: 100, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontSize: 13, fontFamily: theme.fontRegular, opacity: 0.6 },
})
