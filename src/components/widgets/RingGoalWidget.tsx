import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

interface Props {
  tag: string
  value: number
  target: number
  unit?: string
  label?: string
  onPress?: () => void
}

export function RingGoalWidget({ tag, value, target, unit, label, onPress }: Props) {
  const { colors } = useTheme()
  const [dim, setDim] = useState(90)

  const stroke  = Math.max(5, Math.round(dim * 0.055))
  const r       = (dim - stroke) / 2
  const circ    = 2 * Math.PI * r
  const pct     = target > 0 ? Math.min(value / target, 1) : 0
  const fmt     = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString()
  const valSize = Math.round(dim * 0.22)
  const tgtSize = Math.round(dim * 0.09)

  return (
    <Widget tag={tag} size="square" onPress={onPress}>
      <View
        style={rg.center}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout
          setDim(Math.min(width, height) - 4)
        }}
      >
        <View style={{ width: dim, height: dim, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={dim} height={dim} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={dim / 2} cy={dim / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
            {pct > 0 && (
              <Circle
                cx={dim / 2} cy={dim / 2} r={r}
                stroke={colors.text}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
                strokeLinecap="round"
              />
            )}
          </Svg>
          <Text style={[rg.value, { color: colors.text, fontSize: valSize }]}>
            {unit}{fmt(value)}
          </Text>
          <Text style={[rg.target, { color: colors.textMuted, fontSize: tgtSize }]}>
            / {unit}{fmt(target)}
          </Text>
        </View>
        {label ? <Text style={[rg.label, { color: colors.textMuted }]}>{label}</Text> : null}
      </View>
    </Widget>
  )
}

const rg = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  value:  { fontFamily: theme.fontMonoBold, letterSpacing: -1.4 },
  target: { fontFamily: theme.fontMono, marginTop: 2 },
  label:  { fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },
})
