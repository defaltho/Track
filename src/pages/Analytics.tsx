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
  Text as SvgText,
} from 'react-native-svg'
import { useDataStore } from '../stores/data'
import {
  totalMonthlySpend,
  projectedYearly,
  coffees,
  monthlyEquivalent,
} from '../utils/calculations'
import { buildSpendingTimeline, pointsToPath, RANGE_DAYS } from '../utils/chart'
import { theme, CURRENCY_SYMBOL } from '../theme'

export function Analytics() {
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
    <ScrollView style={s.page} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Summary */}
      <View style={s.card}>
        <View style={s.summaryGrid}>
          <View style={s.stat}>
            <Text style={s.statNum}>{symbol}{monthly.toFixed(0)}</Text>
            <Text style={s.statLabel}>per month</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{symbol}{yearly.toFixed(0)}</Text>
            <Text style={s.statLabel}>per year</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{coffeeCount}</Text>
            <Text style={s.statLabel}>coffees / mo</Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <View style={s.card}>
        <View style={s.chartHeader}>
          <Text style={s.cardTitle}>Spending over time</Text>
          <View style={s.filters}>
            {Object.keys(RANGE_DAYS).map(f => (
              <TouchableOpacity
                key={f}
                style={[s.filterPill, timeRange === f && s.filterPillActive]}
                onPress={() => setTimeRange(f)}
                accessibilityRole="button"
                accessibilityLabel={`${f} time range`}
              >
                <Text style={[s.filterPillText, timeRange === f && s.filterPillTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Svg width="100%" height={100} viewBox="0 0 300 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="g-analytics" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#000" stopOpacity={0.14} />
              <Stop offset="100%" stopColor="#000" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {store.subscriptions.length > 0 ? (
            <>
              <Path d={path.area} fill="url(#g-analytics)" />
              <Path d={path.line} fill="none" stroke="#000" strokeWidth={1.5} strokeLinejoin="round" />
              <Circle cx={path.last.x} cy={path.last.y} r={3} fill="#000" />
            </>
          ) : (
            <SvgText x={150} y={54} textAnchor="middle" fontSize={12} fill="#888">
              Add a subscription to see the chart
            </SvgText>
          )}
        </Svg>
      </View>

      {/* Breakdown */}
      {breakdown.length > 0 ? (
        <View style={s.card}>
          <Text style={[s.cardTitle, { marginBottom: theme.sp5 }]}>Breakdown</Text>
          {breakdown.map((sub: any) => {
            const pct = monthly > 0 ? (sub.monthly / monthly) * 100 : 0
            return (
              <View key={sub.id} style={s.breakdownRow}>
                <View style={s.breakdownInfo}>
                  <Text style={s.breakdownName}>{sub.emoji ?? '💳'} {sub.name}</Text>
                  <Text style={s.breakdownPct}>{symbol}{sub.monthly.toFixed(2)} · {pct.toFixed(0)}%</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { flex: pct, maxWidth: `${pct}%` as any }]} />
                  <View style={{ flex: 100 - pct }} />
                </View>
              </View>
            )
          })}
        </View>
      ) : (
        <View style={[s.card, s.emptyCard]}>
          <Text style={s.empty}>No subscriptions yet</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.sp4, gap: theme.sp4, paddingBottom: 110 },

  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    ...theme.shadow,
  },

  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.sp3 },
  stat: { flex: 1 },
  statNum: { fontSize: theme.textXl, fontWeight: '800', color: theme.text },
  statLabel: { fontSize: theme.textXs, color: theme.textMuted, marginTop: 2 },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.sp4, flexWrap: 'wrap', gap: theme.sp2 },
  cardTitle: { fontSize: theme.textBase, fontWeight: '700', color: theme.text },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: theme.bg,
  },
  filterPillActive: { backgroundColor: theme.accent },
  filterPillText: { fontSize: theme.textXs, fontWeight: '600', color: theme.text },
  filterPillTextActive: { color: theme.accentFg },

  breakdownRow: { marginBottom: theme.sp4 },
  breakdownInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.sp1 },
  breakdownName: { fontSize: theme.textSm, fontWeight: '500', color: theme.text },
  breakdownPct: { fontSize: theme.textSm, color: theme.textMuted },
  barTrack: { height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' },
  barFill: { height: 4, backgroundColor: theme.accent },

  emptyCard: { alignItems: 'center', padding: theme.sp8 },
  empty: { fontSize: theme.textSm, color: theme.textMuted },
})
