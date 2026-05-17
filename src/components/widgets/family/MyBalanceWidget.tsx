import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../../../theme'
import { useTheme } from '../../../context/ThemeContext'
import { Widget } from '../../ui/Widget'
import type { Member } from '../../../stores/familyData'

interface Props {
  balance:    number
  symbol:     string
  members:    Member[]
  balances:   Record<string, number>
  myMemberId: string
}

export function MyBalanceWidget({ balance, symbol, members, balances, myMemberId }: Props) {
  const { colors } = useTheme()
  const sign = balance >= 0 ? '+' : ''

  // Who owes me / who I owe
  const creditors: { name: string; amount: number }[] = []  // I owe them
  const debtors:   { name: string; amount: number }[] = []  // they owe me

  if (myMemberId) {
    for (const m of members) {
      if (m.id === myMemberId) continue
      const theirBal = balances[m.id] ?? 0
      // If my balance is positive, others owe me → find who owes
      // For a simple sub-line: compare pairwise not implemented yet in v1
      // Show net creditors/debtors based on who's negative vs positive
      if (theirBal < -0.01) debtors.push({ name: m.displayName, amount: -theirBal })
      else if (theirBal > 0.01) creditors.push({ name: m.displayName, amount: theirBal })
    }
  }

  const subNames = balance >= 0
    ? debtors.slice(0, 2).map(d => d.name).join(', ')
    : creditors.slice(0, 2).map(c => c.name).join(', ')
  const subLabel = balance >= 0
    ? (subNames ? `deves receber de ${subNames}` : 'saldo a teu favor')
    : (subNames ? `deves a ${subNames}` : 'saldo negativo')

  return (
    <Widget tag="teu saldo" size="square">
      <View style={mb.center}>
        <Text style={[mb.sign, { color: colors.textMuted }]}>{sign}</Text>
        <View>
          <Text style={[mb.amount, { color: colors.text }]}>
            {symbol}{Math.abs(balance).toFixed(0)}
          </Text>
        </View>
      </View>
      <Text style={[mb.sub, { color: colors.textMuted }]} numberOfLines={2}>
        {subLabel}
      </Text>
    </Widget>
  )
}

const mb = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  sign:   { fontSize: 22, fontFamily: theme.fontMono, letterSpacing: -0.5, paddingBottom: 4 },
  amount: { fontSize: 36, fontFamily: theme.fontMonoBold, letterSpacing: -1.6 },
  sub:    { fontSize: 11, fontFamily: theme.fontRegular, lineHeight: 16 },
})
