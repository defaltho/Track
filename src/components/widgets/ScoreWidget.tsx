import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { computeScore } from '../../utils/score'

interface Props {
  subscriptions: any[]
  tasks:         any[]
  monthlyBudget: number | null
  monthlySpend:  number
}

const R = 38, STROKE = 6, CIRC = 2 * Math.PI * R

export function ScoreWidget({ subscriptions, tasks, monthlyBudget, monthlySpend }: Props) {
  const { colors } = useTheme()
  const score      = computeScore(subscriptions, tasks, monthlyBudget, monthlySpend)
  const ringColor  =
    score.labelColor === 'success' ? colors.success :
    score.labelColor === 'warning' ? colors.warning : colors.danger
  const dash = (score.total / 100) * CIRC
  const dim  = (R + STROKE) * 2 + 4

  return (
    <Widget tag="score financeiro" size="square">
      <View style={sc.center}>
        {/* Ring */}
        <View style={sc.ringWrap}>
          <Svg width={dim} height={dim}>
            {/* Track */}
            <Circle
              cx={dim / 2} cy={dim / 2} r={R}
              stroke={colors.border} strokeWidth={STROKE}
              fill="none"
            />
            {/* Progress */}
            <Circle
              cx={dim / 2} cy={dim / 2} r={R}
              stroke={ringColor} strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeDashoffset={CIRC / 4}
              strokeLinecap="round"
              rotation="-90"
              origin={`${dim / 2}, ${dim / 2}`}
            />
          </Svg>
          {/* Number inside ring */}
          <View style={sc.ringInner}>
            <Text style={[sc.score, { color: colors.text }]}>{score.total}</Text>
          </View>
        </View>

        <Text style={[sc.label, { color: ringColor }]}>{score.label}</Text>
      </View>

      {/* Breakdown mini bars */}
      <View style={sc.breakdown}>
        {[
          { key: 'orçamento', pts: score.budgetPts, max: 40 },
          { key: 'subs',      pts: score.subsPts,   max: 30 },
          { key: 'tarefas',   pts: score.tasksPts,  max: 30 },
        ].map(row => (
          <View key={row.key} style={sc.barRow}>
            <Text style={[sc.barLabel, { color: colors.textFaint }]}>{row.key}</Text>
            <View style={[sc.barTrack, { backgroundColor: colors.border }]}>
              <View style={[sc.barFill, { width: `${(row.pts / row.max) * 100}%` as any, backgroundColor: ringColor }]} />
            </View>
          </View>
        ))}
      </View>
    </Widget>
  )
}

const sc = StyleSheet.create({
  center:    { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 4 },
  ringWrap:  { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  score:     { fontSize: 26, fontFamily: theme.fontMonoBold, letterSpacing: -1 },
  label:     { fontSize: 12, fontFamily: theme.fontBold, letterSpacing: 0.2 },
  breakdown: { gap: 5, marginTop: 4 },
  barRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel:  { fontSize: 9, fontFamily: theme.fontRegular, width: 48 },
  barTrack:  { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: 3, borderRadius: 2 },
})
