import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

// ── ClockWidget ───────────────────────────────────────────────────────
// Square analog clock ticking with the device's local time.
// Visual cue: Braun quartz — minute ticks around the rim, 1–12 numerals,
// black hour + minute hands, single yellow second hand, yellow hub.
// Adapted to Track's palette: ink hands, paper bg, yellow accent kept.

const VB = 200          // virtual canvas for the SVG viewBox
const CX = VB / 2
const CY = VB / 2
const R  = VB / 2 - 8   // outer radius (room for padding)

const YELLOW = '#F2C200' // Braun second-hand yellow

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function polar(angleDeg: number, length: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + Math.cos(rad) * length, y: CY + Math.sin(rad) * length }
}

export function ClockWidget({ tag = 'now' }: { tag?: string }) {
  const { colors } = useTheme()
  const now = useNow()

  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hourAngle   = ((h + m / 60) / 12) * 360
  const minuteAngle = ((m + s / 60) / 60) * 360
  const secondAngle = (s / 60) * 360

  const hourEnd   = polar(hourAngle,   R * 0.50)
  const minuteEnd = polar(minuteAngle, R * 0.74)
  const secEnd    = polar(secondAngle, R * 0.80)
  const secTail   = polar(secondAngle + 180, R * 0.18)

  // 60 ticks — every 5th is a long/bold hour tick
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 360
    const isHour = i % 5 === 0
    const outer = polar(angle, R)
    const inner = polar(angle, R - (isHour ? 10 : 5))
    return { ...inner, x2: outer.x, y2: outer.y, isHour }
  })

  // 12 numerals
  const numerals = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1
    const angle = (n / 12) * 360
    const p = polar(angle, R - 22)
    return { x: p.x, y: p.y, label: String(n) }
  })

  return (
    <Widget tag={tag} size="square">
      <View style={c.center}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VB} ${VB}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ticks */}
          {ticks.map((t, i) => (
            <Line
              key={i}
              x1={t.x} y1={t.y}
              x2={t.x2} y2={t.y2}
              stroke={colors.text}
              strokeWidth={t.isHour ? 2.5 : 1}
              strokeLinecap="round"
            />
          ))}
          {/* Numerals */}
          {numerals.map((n, i) => (
            <SvgText
              key={i}
              x={n.x}
              y={n.y + 6}
              fontSize={16}
              fontFamily={theme.fontMedium}
              fontWeight="500"
              fill={colors.text}
              textAnchor="middle"
            >
              {n.label}
            </SvgText>
          ))}
          {/* Hour hand */}
          <Line
            x1={CX} y1={CY}
            x2={hourEnd.x} y2={hourEnd.y}
            stroke={colors.text}
            strokeWidth={5}
            strokeLinecap="round"
          />
          {/* Minute hand */}
          <Line
            x1={CX} y1={CY}
            x2={minuteEnd.x} y2={minuteEnd.y}
            stroke={colors.text}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Second hand — yellow */}
          <Line
            x1={secTail.x} y1={secTail.y}
            x2={secEnd.x}  y2={secEnd.y}
            stroke={YELLOW}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Center hub */}
          <Circle cx={CX} cy={CY} r={5} fill={YELLOW} />
          <Circle cx={CX} cy={CY} r={1.5} fill={colors.text} />
        </Svg>
      </View>
    </Widget>
  )
}

const c = StyleSheet.create({
  center: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
})
