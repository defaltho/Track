import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'

// ── CategoryRingsWidget ───────────────────────────────────────────────
// Square widget — 2×2 grid of progress rings with an emoji/glyph centered
// in each. Inspired by iOS' "Batteries" widget pattern, translated into
// Track's DNA (Roboto + Space Mono + lowercase tag + ink/category palette).
//
// For Track: top 4 spending categories this month, ring fill = each
// category's share of total monthly spend. Empty slots render the muted
// background ring only.

export interface RingItem {
  label: string         // category name (used as fallback letter if no emoji)
  pct: number           // 0..1 — fill percentage
  color: string         // ring foreground stroke
  emoji?: string        // optional glyph in center; falls back to first letter
}

interface Props {
  tag: string
  items: RingItem[]     // up to 4; extra entries are dropped, missing are padded
}

export function CategoryRingsWidget({ tag, items }: Props) {
  const { colors } = useTheme()
  const filled = items.slice(0, 4)
  // Pad to 4 cells so the grid stays balanced when fewer categories exist
  const cells: (RingItem | null)[] = [...filled]
  while (cells.length < 4) cells.push(null)

  return (
    <Widget tag={tag} size="square">
      <View style={cr.grid}>
        {cells.map((it, i) => (
          <View key={i} style={cr.cell}>
            <RingCell item={it} colors={colors} />
          </View>
        ))}
      </View>
    </Widget>
  )
}

// ── Individual ring cell ──────────────────────────────────────────────
function RingCell({ item, colors }: { item: RingItem | null; colors: any }) {
  const size = 58
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = item ? Math.min(Math.max(item.pct, 0), 1) : 0
  // Empty slot: gray ring + no glyph. Active: colored arc + emoji/letter.
  const glyph = item?.emoji ?? (item?.label ? item.label.charAt(0).toUpperCase() : '')

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {/* Background ring — always visible, muted */}
        <Circle cx={size/2} cy={size/2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        {/* Foreground arc — only when there's a value */}
        {item && pct > 0 && (
          <Circle
            cx={size/2} cy={size/2} r={r}
            stroke={item.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
            strokeLinecap="round"
          />
        )}
      </Svg>
      {item && (
        item.emoji
          ? <Text style={cr.glyphEmoji}>{glyph}</Text>
          : <Text style={[cr.glyphLetter, { color: colors.text }]}>{glyph}</Text>
      )}
    </View>
  )
}

const cr = StyleSheet.create({
  // 2×2 grid — fills the widget body, equal spacing between cells
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    justifyContent: 'space-between',
  },
  cell: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphEmoji:  { fontSize: 22, lineHeight: 26 },
  glyphLetter: { fontSize: 18, fontFamily: theme.fontMonoBold, letterSpacing: -0.5 },
})
