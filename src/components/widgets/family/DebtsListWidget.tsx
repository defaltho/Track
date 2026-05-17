import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../../theme'
import { useTheme } from '../../../context/ThemeContext'
import { Widget } from '../../ui/Widget'
import { Button } from '../../ui/Button'
import type { Member } from '../../../stores/familyData'

interface Transfer { from: string; to: string; amount: number }

interface Props {
  transfers:  Transfer[]
  members:    Member[]
  symbol:     string
  onSettle:   () => void
}

export function DebtsListWidget({ transfers, members, symbol, onSettle }: Props) {
  const { colors } = useTheme()
  const byId = Object.fromEntries(members.map(m => [m.id, m]))

  const action = transfers.length > 0
    ? <Button label="liquidar tudo" variant="secondary" size="sm" onPress={onSettle} />
    : undefined

  return (
    <Widget
      tag="quem deve a quem · em aberto"
      size="rectangle"
      action={action}
    >
      {transfers.length === 0 ? (
        <Text style={[dl.empty, { color: colors.textFaint }]}>nenhuma dívida em aberto ✓</Text>
      ) : (
        <View style={dl.list}>
          {transfers.map((t, i) => {
            const from = byId[t.from]
            const to   = byId[t.to]
            if (!from || !to) return null
            return (
              <View key={i} style={dl.row}>
                {/* From avatar */}
                <View style={[dl.avatar, { backgroundColor: from.color }]}>
                  <Text style={dl.avatarInitial}>{from.initial}</Text>
                </View>
                <Text style={[dl.name, { color: colors.text }]}>{from.displayName}</Text>
                <Text style={[dl.arrow, { color: colors.textFaint }]}>→</Text>
                <Text style={[dl.name, { color: colors.text }]}>{to.displayName}</Text>
                {/* Dotted leader */}
                <View style={dl.leader} />
                <Text style={[dl.amount, { color: colors.text }]}>
                  {symbol}{t.amount.toFixed(2)}
                </Text>
                {/* To avatar */}
                <View style={[dl.avatar, { backgroundColor: to.color }]}>
                  <Text style={dl.avatarInitial}>{to.initial}</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}
      {transfers.length > 0 && (
        <View style={[dl.pill, { backgroundColor: colors.surfaceEl }]}>
          <Text style={[dl.pillText, { color: colors.textMuted }]}>
            {transfers.length} {transfers.length === 1 ? 'transferência' : 'transferências'}
          </Text>
        </View>
      )}
    </Widget>
  )
}

const dl = StyleSheet.create({
  empty:   { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic' },
  list:    { gap: theme.sp3 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'nowrap' },
  avatar:  { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 9, fontFamily: theme.fontBold },
  name:    { fontSize: 13, fontFamily: theme.fontMedium, letterSpacing: -0.2 },
  arrow:   { fontSize: 13, fontFamily: theme.fontRegular },
  leader:  { flex: 1, height: StyleSheet.hairlineWidth, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' as any, borderColor: 'transparent', borderBottomColor: '#aaa' },
  amount:  { fontSize: 13, fontFamily: theme.fontMonoBold, letterSpacing: -0.4 },
  pill:    { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText:{ fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: 0.4 },
})
