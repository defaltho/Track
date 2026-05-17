import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { buildForecast, forecastTotal, nextUpcoming } from '../../utils/forecast'
import type { ChargeItem } from '../../utils/forecast'

interface Props {
  items:  ChargeItem[]
  days?:  number
  symbol: string
}

export function ForecastWidget({ items, days = 30, symbol }: Props) {
  const { colors } = useTheme()
  const forecast   = buildForecast(items, days)
  const total      = forecastTotal(forecast)
  const next       = nextUpcoming(forecast)

  // Bar chart — max height proportional to largest daily charge
  const W = 280, H = 36, gap = 1
  const barW   = (W - gap * (days - 1)) / days
  const maxDay = Math.max(...forecast.map(d => d.total), 0.01)

  const nextDiff = next ? differenceInCalendarDays(parseISO(next.date), new Date()) : null
  const nextLabel =
    nextDiff === null  ? null :
    nextDiff === 0     ? 'hoje' :
    nextDiff === 1     ? 'amanhã' :
    `em ${nextDiff} dias`

  return (
    <Widget tag={`próximos ${days} dias`} size="rectangle">
      {/* Hero */}
      <View style={fw.heroRow}>
        <Text style={[fw.hero, { color: colors.text }]}>
          {symbol}{total.toFixed(2)}
        </Text>
        <Text style={[fw.heroSub, { color: colors.textMuted }]}>comprometido</Text>
      </View>

      {/* Bar chart */}
      <View style={fw.chartWrap}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
          {forecast.map((d, i) => {
            const h = d.total > 0 ? Math.max(3, (d.total / maxDay) * H) : 1
            const x = i * (barW + gap)
            const hasCharge = d.total > 0
            return (
              <Rect
                key={d.date}
                x={x} y={H - h} width={Math.max(barW, 1)} height={h}
                rx={1}
                fill={hasCharge ? colors.accent : colors.border}
                opacity={hasCharge ? 1 : 0.4}
              />
            )
          })}
        </Svg>
      </View>

      {/* Next upcoming */}
      {next && nextLabel && (
        <View style={fw.nextRow}>
          <Text style={[fw.nextEmoji]}>{next.charges[0]?.emoji ?? '💳'}</Text>
          <Text style={[fw.nextName, { color: colors.textMuted }]} numberOfLines={1}>
            {next.charges[0]?.name}
            {next.charges.length > 1 ? ` +${next.charges.length - 1}` : ''}
          </Text>
          <View style={fw.spacer} />
          <Text style={[fw.nextWhen, { color: colors.textFaint }]}>{nextLabel}</Text>
          <Text style={[fw.nextAmt, { color: colors.text }]}>
            {symbol}{next.total.toFixed(2)}
          </Text>
        </View>
      )}

      {total === 0 && (
        <Text style={[fw.empty, { color: colors.textFaint }]}>
          nenhum débito previsto neste período
        </Text>
      )}
    </Widget>
  )
}

const fw = StyleSheet.create({
  heroRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  hero:     { fontSize: 28, fontFamily: theme.fontMonoBold, letterSpacing: -1 },
  heroSub:  { fontSize: 11, fontFamily: theme.fontRegular },
  chartWrap:{ width: '100%', marginVertical: 4 },
  nextRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextEmoji:{ fontSize: 13 },
  nextName: { fontSize: 12, fontFamily: theme.fontMedium, flex: 1 },
  spacer:   { flex: 1 },
  nextWhen: { fontSize: 11, fontFamily: theme.fontRegular },
  nextAmt:  { fontSize: 13, fontFamily: theme.fontMonoBold, letterSpacing: -0.4 },
  empty:    { fontSize: 12, fontFamily: theme.fontRegular, fontStyle: 'italic' },
})
