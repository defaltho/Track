import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { monthlyEquivalent } from '../../utils/calculations'
import type { Subscription, AppEntry } from '../../stores/data'

type Mode = 'week' | 'month' | 'year'
type Entry = Subscription | AppEntry

const MODES: Mode[] = ['week', 'month', 'year']
const MODE_LABEL: Record<Mode, string> = { week: 'Week', month: 'Month', year: 'Year' }
const DAY_ABBR = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface Bar { label: string; current: number; previous: number }

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function mondayOf(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  const dow = (out.getDay() + 6) % 7   // 0 = Monday
  out.setDate(out.getDate() - dow)
  return out
}

function chargesOnDay(entries: Entry[], dateStr: string): number {
  return entries.reduce((sum, e) => {
    if (!e.active || !e.nextChargeDate) return sum
    try {
      return isoDate(new Date(e.nextChargeDate)) === dateStr ? sum + e.price : sum
    } catch { return sum }
  }, 0)
}

function buildWeekBars(entries: Entry[], today: Date): Bar[] {
  const curMonday  = mondayOf(today)
  const prevMonday = new Date(curMonday)
  prevMonday.setDate(prevMonday.getDate() - 7)

  return DAY_ABBR.map((label, i) => {
    const curDay  = new Date(curMonday);  curDay.setDate(curDay.getDate() + i)
    const prevDay = new Date(prevMonday); prevDay.setDate(prevDay.getDate() + i)
    return {
      label,
      current:  chargesOnDay(entries, isoDate(curDay)),
      previous: chargesOnDay(entries, isoDate(prevDay)),
    }
  })
}

function buildMonthBars(entries: Entry[], today: Date): Bar[] {
  const year = today.getFullYear()
  const curM  = today.getMonth()
  const prevM = curM === 0 ? 11 : curM - 1
  const prevY = curM === 0 ? year - 1 : year

  // 4 week-buckets within each month
  const bars: Bar[] = [1, 2, 3, 4].map(week => {
    let cur = 0, prev = 0
    for (const e of entries) {
      if (!e.active) continue
      const daily = monthlyEquivalent(e.price, e.billingCycle) / 30
      cur  += daily * 7
      prev += daily * 7
    }
    return { label: `W${week}`, current: cur, previous: prev }
  })

  // Override with actual charge amounts if we can
  for (const e of entries) {
    if (!e.active || !e.nextChargeDate) continue
    const cd = new Date(e.nextChargeDate)
    if (isNaN(cd.getTime())) continue
    if (cd.getFullYear() === year && cd.getMonth() === curM) {
      const week = Math.min(Math.floor((cd.getDate() - 1) / 7), 3)
      bars[week].current += e.price
    }
    if (cd.getFullYear() === prevY && cd.getMonth() === prevM) {
      const week = Math.min(Math.floor((cd.getDate() - 1) / 7), 3)
      bars[week].previous += e.price
    }
  }
  return bars
}

function buildYearBars(entries: Entry[], today: Date): Bar[] {
  const year = today.getFullYear()
  return MONTH_ABBR.map((label, m) => {
    let cur = 0, prev = 0
    for (const e of entries) {
      if (!e.active) continue
      const monthly = monthlyEquivalent(e.price, e.billingCycle)
      cur  += monthly
      prev += monthly
    }
    for (const e of entries) {
      if (!e.active || !e.nextChargeDate) continue
      const cd = new Date(e.nextChargeDate)
      if (isNaN(cd.getTime())) continue
      if (cd.getFullYear() === year && cd.getMonth() === m)      cur  += e.price
      if (cd.getFullYear() === year - 1 && cd.getMonth() === m)  prev += e.price
    }
    return { label, current: cur, previous: prev }
  })
}

interface Props {
  subscriptions: (Subscription | AppEntry)[]
  tag?: string
  unit?: string
}

export function PeriodCompareWidget({ subscriptions, tag = 'compare', unit = '€' }: Props) {
  const { colors } = useTheme()
  const [mode, setMode]       = useState<Mode>('week')
  const [tooltip, setTooltip] = useState<{ idx: number; which: 'current' | 'previous' } | null>(null)

  const today = useMemo(() => new Date(), [])

  const bars = useMemo<Bar[]>(() => {
    if (mode === 'week')  return buildWeekBars(subscriptions, today)
    if (mode === 'month') return buildMonthBars(subscriptions, today)
    return buildYearBars(subscriptions, today)
  }, [mode, subscriptions, today])

  const maxVal = Math.max(...bars.flatMap(b => [b.current, b.previous]), 1)

  const currentPeriod  = mode === 'week' ? 'This week'  : mode === 'month' ? 'This month'  : 'This year'
  const previousPeriod = mode === 'week' ? 'Last week'  : mode === 'month' ? 'Last month'  : 'Last year'
  const curTotal  = bars.reduce((s, b) => s + b.current,  0)
  const prevTotal = bars.reduce((s, b) => s + b.previous, 0)
  const delta     = prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0

  return (
    <Widget tag={tag} size="rectangle">
      {/* Header */}
      <View style={pc.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[pc.title, { color: colors.text }]}>period compare</Text>
          <View style={pc.totalsRow}>
            <Text style={[pc.totalVal, { color: colors.text }]}>
              {unit}{curTotal.toFixed(0)}
            </Text>
            <Text style={[pc.deltaTag, {
              color: delta <= 0 ? colors.success : colors.danger,
              backgroundColor: delta <= 0 ? colors.successBg : colors.dangerBg,
            }]}>
              {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
            </Text>
          </View>
        </View>
        {/* Mode toggle */}
        <View style={[pc.toggle, { backgroundColor: colors.surfaceEl }]}>
          {MODES.map(m => (
            <Pressable
              key={m}
              style={[pc.toggleBtn, mode === m && { backgroundColor: colors.surface }]}
              onPress={() => { setMode(m); setTooltip(null) }}
            >
              <Text style={[pc.toggleLabel, { color: mode === m ? colors.text : colors.textMuted }]}>
                {MODE_LABEL[m]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bar chart */}
      <View style={pc.chart}>
        {bars.map((bar, i) => {
          const curH  = Math.max((bar.current  / maxVal) * 80, bar.current  > 0 ? 3 : 0)
          const prevH = Math.max((bar.previous / maxVal) * 80, bar.previous > 0 ? 3 : 0)
          const ttCur  = tooltip?.idx === i && tooltip.which === 'current'
          const ttPrev = tooltip?.idx === i && tooltip.which === 'previous'
          return (
            <View key={i} style={pc.barGroup}>
              {/* Tooltip */}
              {(ttCur || ttPrev) && (
                <View style={[pc.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[pc.ttLabel, { color: colors.textMuted }]}>
                    {ttCur ? currentPeriod : previousPeriod}
                  </Text>
                  <Text style={[pc.ttVal, { color: colors.text }]}>
                    {unit}{(ttCur ? bar.current : bar.previous).toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={pc.barsWrap}>
                {/* Previous — grey */}
                <Pressable
                  style={[pc.bar, { height: prevH, backgroundColor: colors.border }]}
                  onPress={() => setTooltip(ttPrev ? null : { idx: i, which: 'previous' })}
                />
                {/* Current — accent */}
                <Pressable
                  style={[pc.bar, { height: curH, backgroundColor: colors.accent }]}
                  onPress={() => setTooltip(ttCur ? null : { idx: i, which: 'current' })}
                />
              </View>
              <Text style={[pc.barLabel, { color: colors.textFaint }]}>{bar.label}</Text>
            </View>
          )
        })}
      </View>

      {/* Legend */}
      <View style={pc.legend}>
        <View style={pc.legendItem}>
          <View style={[pc.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[pc.legendLabel, { color: colors.textMuted }]}>{previousPeriod}</Text>
        </View>
        <View style={pc.legendItem}>
          <View style={[pc.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[pc.legendLabel, { color: colors.textMuted }]}>{currentPeriod}</Text>
        </View>
      </View>
    </Widget>
  )
}

const pc = StyleSheet.create({
  headerRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: theme.sp3 },
  title:      { fontSize: 13, fontFamily: theme.fontMedium, letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.45, marginBottom: 4 },
  totalsRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalVal:   { fontSize: 26, fontFamily: theme.fontBlack, letterSpacing: -1 },
  deltaTag:   { fontSize: 11, fontFamily: theme.fontMedium, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },

  toggle:     { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 2 },
  toggleBtn:  { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  toggleLabel:{ fontSize: 11, fontFamily: theme.fontMedium },

  chart:      { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 100 },
  barGroup:   { flex: 1, alignItems: 'center', gap: 4, position: 'relative' },
  barsWrap:   { flexDirection: 'row', alignItems: 'flex-end', gap: 2, flex: 1 },
  bar:        { flex: 1, borderRadius: 3, minHeight: 0 },
  barLabel:   { fontSize: 10, fontFamily: theme.fontMono, marginTop: 4 },

  tooltip: {
    position: 'absolute', bottom: '100%', zIndex: 10,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center',
    minWidth: 72,
  },
  ttLabel:  { fontSize: 10, fontFamily: theme.fontMedium },
  ttVal:    { fontSize: 13, fontFamily: theme.fontMonoBold, marginTop: 2 },

  legend:     { flexDirection: 'row', gap: theme.sp4, marginTop: theme.sp3 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendLabel:{ fontSize: 11, fontFamily: theme.fontMedium },
})
