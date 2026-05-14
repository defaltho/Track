import React from 'react'
import Svg, { Circle } from 'react-native-svg'
import { View } from 'react-native'

interface Props {
  color?: string
  opacity?: number
  dotSize?: number
  gap?: number
  cols?: number
  rows?: number
}

export function DotGrid({
  color = '#888888',
  opacity = 0.06,
  dotSize = 2.5,
  gap = 14,
  cols = 8,
  rows = 6,
}: Props) {
  const w = cols * gap
  const h = rows * gap

  const dots: React.ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <Circle
          key={`${r}-${c}`}
          cx={c * gap + gap / 2}
          cy={r * gap + gap / 2}
          r={dotSize / 2}
          fill={color}
        />
      )
    }
  }

  return (
    <View
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" opacity={opacity} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMaxYMin slice">
        {dots}
      </Svg>
    </View>
  )
}
