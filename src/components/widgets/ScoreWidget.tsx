import React, { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle, Rect, Defs, Pattern } from 'react-native-svg'
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

function DotBar({ pct, fill, dotColor, id }: { pct: number; fill: string; dotColor: string; id: string }) {
  const [w, setW] = useState(0)
  const H = 7
  const fw = w * Math.max(0, Math.min(pct, 1))
  return (
    <View style={{ flex: 1, height: H }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={H}>
          <Defs>
            <Pattern id={id} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <Circle cx="1.2" cy="1.2" r="1" fill={dotColor} fillOpacity={0.4} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width={w} height={H} fill={`url(#${id})`} rx={3} />
          {fw > 0 && <Rect x={0} y={0} width={fw} height={H} fill={fill} rx={3} />}
        </Svg>
      )}
    </View>
  )
}

export function ScoreWidget({ subscriptions, tasks, monthlyBudget, monthlySpend }: Props) {
  const { colors } = useTheme()
  const [wrapSize, setWrapSize] = useState({ w: 120, h: 89 })

  const score      = computeScore(subscriptions, tasks, monthlyBudget, monthlySpend)
  const ringColor  =
    score.labelColor === 'success' ? colors.success :
    score.labelColor === 'warning' ? colors.warning : colors.danger

  // Scale ring to available space — capped so breakdown bars always fit.
  const R      = Math.max(16, Math.min(Math.round(Math.min(wrapSize.w, wrapSize.h) * 0.22), 44))
  const STROKE = Math.max(4,  Math.round(R * 0.25))
  const dim    = (R + STROKE) * 2 + 4
  const CIRC   = 2 * Math.PI * R
  const dash   = (score.total / 100) * CIRC
  const scoreFontSize = Math.max(12, Math.round(dim * 0.30))

  return (
    <Widget tag="score financeiro" size="square">
      <View
        style={sc.wrap}
        onLayout={e => setWrapSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
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
            <Text style={[sc.score, { color: colors.text, fontSize: scoreFontSize }]}>{score.total}</Text>
          </View>
        </View>

        <Text style={[sc.label, { color: ringColor }]}>{score.label}</Text>
      </View>

      {/* Breakdown mini bars */}
      <View style={sc.breakdown}>
        {([
          { key: 'orçamento', pts: score.budgetPts, max: 40, id: 'sc-p0' },
          { key: 'subs',      pts: score.subsPts,   max: 30, id: 'sc-p1' },
          { key: 'tarefas',   pts: score.tasksPts,  max: 30, id: 'sc-p2' },
        ] as const).map(row => (
          <View key={row.key} style={sc.barRow}>
            <Text style={[sc.barLabel, { color: colors.textFaint }]}>{row.key}</Text>
            <DotBar
              pct={row.pts / row.max}
              fill={ringColor}
              dotColor={ringColor}
              id={row.id}
            />
          </View>
        ))}
      </View>
      </View>
    </Widget>
  )
}

const sc = StyleSheet.create({
  wrap:      { flex: 1, justifyContent: 'space-between' },
  center:    { alignItems: 'center', gap: 3 },
  ringWrap:  { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ringInner: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  score:     { fontSize: 16, fontFamily: theme.fontMonoBold, letterSpacing: -1 },
  label:     { fontSize: 10, fontFamily: theme.fontBold, letterSpacing: 0.2 },
  breakdown: { gap: 3 },
  barRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel:  { fontSize: 9, fontFamily: theme.fontRegular, width: 48 },
})
