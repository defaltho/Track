import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle, Polyline } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { computeScore, computeScoreHistory } from '../../utils/score'

interface Props {
  subscriptions: any[]
  tasks:         any[]
  monthlyBudget: number | null
  monthlySpend:  number
}

const R = 38, STROKE = 6, CIRC = 2 * Math.PI * R

const SPARK_W = 72, SPARK_H = 18

function Sparkline({ history, color }: { history: { score: number }[]; color: string }) {
  if (history.length < 2) return null
  const vals = history.map(h => h.score)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * SPARK_W
    const y = SPARK_H - ((v - min) / range) * SPARK_H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <Svg width={SPARK_W} height={SPARK_H}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ScoreWidget({ subscriptions, tasks, monthlyBudget, monthlySpend }: Props) {
  const { colors } = useTheme()
  const score      = computeScore(subscriptions, tasks, monthlyBudget, monthlySpend)
  const history    = useMemo(() => computeScoreHistory(subscriptions, tasks, monthlyBudget, 6), [subscriptions, tasks, monthlyBudget])
  const showSpark  = history.length >= 2
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
        {showSpark && (
          <View style={sc.sparkRow}>
            <Sparkline history={history} color={ringColor} />
          </View>
        )}
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
  sparkRow:  { marginTop: 4, alignItems: 'center' },
  breakdown: { gap: 5, marginTop: 4 },
  barRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel:  { fontSize: 9, fontFamily: theme.fontRegular, width: 48 },
  barTrack:  { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: 3, borderRadius: 2 },
})
