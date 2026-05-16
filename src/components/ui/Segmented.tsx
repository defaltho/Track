import React from 'react'
import { View, ScrollView } from 'react-native'
import { Button, ButtonSize } from './Button'

// ── Segmented control ─────────────────────────────────────────────────
// Built on the Button DNA: active option = primary (dark gradient + shadow),
// inactive options = secondary (white outlined). Used for type tabs,
// billing cycle, category pills, payment method, currency pills, etc.

export type SegmentOption<T extends string = string> = T | { value: T; label: string }

type Layout =
  | 'equal'    // each segment takes equal flex (Subscription/App/Event)
  | 'fit'      // each segment hugs content, wraps to next line
  | 'scroll'   // each segment hugs content, horizontal scroll (long lists)

interface Props<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>
  value: T
  onChange: (v: T) => void
  size?: ButtonSize
  layout?: Layout
  capitalize?: boolean
  gap?: number
}

export function Segmented<T extends string>({
  options, value, onChange, size = 'sm', layout = 'fit', capitalize, gap = 6,
}: Props<T>) {
  const items = options.map((o): { value: T; label: string } =>
    typeof o === 'string'
      ? { value: o as T, label: capitalize ? o.charAt(0).toUpperCase() + o.slice(1) : o }
      : o
  )

  const buttons = items.map(item => {
    const isActive = value === item.value
    const variant = isActive ? 'primary' as const : 'secondary' as const
    if (layout === 'equal') {
      return (
        <View key={item.value} style={{ flex: 1 }}>
          <Button label={item.label} variant={variant} size={size} onPress={() => onChange(item.value)} fullWidth />
        </View>
      )
    }
    return (
      <Button
        key={item.value}
        label={item.label}
        variant={variant}
        size={size}
        onPress={() => onChange(item.value)}
      />
    )
  })

  if (layout === 'scroll') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap, paddingVertical: 2 }}>
        {buttons}
      </ScrollView>
    )
  }

  return (
    <View style={{ flexDirection: 'row', gap, flexWrap: layout === 'fit' ? 'wrap' : 'nowrap' }}>
      {buttons}
    </View>
  )
}
