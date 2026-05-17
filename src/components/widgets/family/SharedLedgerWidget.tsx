import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { format, parseISO } from 'date-fns'
import { theme } from '../../../theme'
import { useTheme } from '../../../context/ThemeContext'
import { Widget } from '../../ui/Widget'
import type { Member, SharedExpense } from '../../../stores/familyData'

interface Props {
  tag:      string
  expenses: SharedExpense[]
  members:  Member[]
  symbol:   string
  maxRows?: number
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Alimentação': '🛒', 'Renda': '🏠', 'Streaming': '📺',
  'Restaurante': '🍽️', 'Transporte': '🚗', 'Liquidação': '💸',
  'Saúde': '⚕️', 'Lazer': '🎉', 'Utilities': '💡',
}

export function SharedLedgerWidget({ tag, expenses, members, symbol, maxRows = 5 }: Props) {
  const { colors } = useTheme()
  const byId = Object.fromEntries(members.map(m => [m.id, m]))
  const rows = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, maxRows)

  return (
    <Widget tag={tag} size="rectangle">
      {rows.length === 0 ? (
        <Text style={[sl.empty, { color: colors.textFaint }]}>nenhum gasto ainda este mês</Text>
      ) : (
        <View style={sl.list}>
          {rows.map((e, i) => {
            const payer  = byId[e.paidBy]
            const catEmoji = CATEGORY_EMOJI[e.category] ?? e.emoji ?? '💳'
            const isLast = i === rows.length - 1
            return (
              <View key={e.id}>
                <View style={sl.row}>
                  {/* Payer avatar */}
                  {payer && (
                    <View style={[sl.avatar, { backgroundColor: payer.color }]}>
                      <Text style={sl.avatarInitial}>{payer.initial}</Text>
                    </View>
                  )}
                  <View style={sl.body}>
                    <Text style={[sl.name, { color: colors.text }]} numberOfLines={1}>{e.name}</Text>
                    <Text style={[sl.meta, { color: colors.textMuted }]}>
                      {e.category} · {format(parseISO(e.date), 'd MMM').toLowerCase()}
                    </Text>
                  </View>
                  {/* Dotted leader */}
                  <View style={[sl.leader, { borderBottomColor: colors.border }]} />
                  <Text style={[sl.amount, { color: colors.text }]}>
                    {symbol}{e.amount.toFixed(2)}
                  </Text>
                </View>
                {!isLast && <View style={[sl.divider, { backgroundColor: colors.border }]} />}
              </View>
            )
          })}
        </View>
      )}
      {expenses.length > maxRows && (
        <View style={[sl.pill, { backgroundColor: colors.surfaceEl }]}>
          <Text style={[sl.pillText, { color: colors.textMuted }]}>{expenses.length} itens</Text>
        </View>
      )}
    </Widget>
  )
}

const sl = StyleSheet.create({
  empty:  { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic' },
  list:   { gap: 0 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitial: { fontSize: 10, fontFamily: theme.fontBold },
  body:   { minWidth: 0 },
  name:   { fontSize: 13, fontFamily: theme.fontBold, letterSpacing: -0.2 },
  meta:   { fontSize: 10, fontFamily: theme.fontMono, letterSpacing: 0.1 },
  leader: { flex: 1, height: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' as any },
  amount: { fontSize: 13, fontFamily: theme.fontMonoBold, letterSpacing: -0.4, flexShrink: 0 },
  divider:{ height: StyleSheet.hairlineWidth },
  pill:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText:{ fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: 0.4 },
})
