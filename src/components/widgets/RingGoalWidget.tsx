import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

// ── RingGoalWidget ────────────────────────────────────────────────────
// Square widget — radial progress ring with X / Y text in the center.
// For Track: spending vs monthly target, items completed, days streak, etc.
// Pattern from the reference: ring + big mono "value", small "/ target" below.

interface Props {
  tag: string
  value: number
  target: number
  unit?: string
  label?: string      // small label under ring (e.g. "monthly target")
  size?: number       // ring diameter
}

export function RingGoalWidget({ tag, value, target, unit, label, size = 140 }: Props) {
  const { colors } = useTheme()
  const stroke = Math.max(5, Math.round(size * 0.04))
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = target > 0 ? Math.min(value / target, 1) : 0
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString())
  // Hero value scales with the ring
  const valueSize = Math.round(size * 0.22)
  const targetSize = Math.round(size * 0.085)

  return (
    <Widget tag={tag} size="square">
      <View style={rg.center}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={size/2} cy={size/2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
            {pct > 0 && (
              <Circle
                cx={size/2} cy={size/2} r={r}
                stroke={colors.text}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${circ*pct} ${circ*(1-pct)}`}
                strokeLinecap="round"
              />
            )}
          </Svg>
          <Text style={[rg.value, { color: colors.text, fontSize: valueSize }]}>
            {unit}{fmt(value)}
          </Text>
          <Text style={[rg.target, { color: colors.textMuted, fontSize: targetSize }]}>/ {unit}{fmt(target)}</Text>
        </View>
        {label ? <Text style={[rg.label, { color: colors.textMuted }]}>{label}</Text> : null}
      </View>
    </Widget>
  )
}

const rg = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  value:  { fontFamily: theme.fontMonoBold, letterSpacing: -1.4, marginTop: -2 },
  target: { fontFamily: theme.fontMono, marginTop: 4 },
  label:  { fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },
})
