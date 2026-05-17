import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useFamilyStore } from '../../stores/familyData'
import type { Member, Currency, Settlement } from '../../stores/familyData'
import { useTheme } from '../../context/ThemeContext'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'
import { Button } from '../../components/ui/Button'

type Method = Settlement['method']

const METHODS: { key: Method; label: string; icon: string }[] = [
  { key: 'mbway',    label: 'MB Way',   icon: 'phone-portrait-outline' },
  { key: 'revolut',  label: 'Revolut',  icon: 'card-outline' },
  { key: 'sepa',     label: 'SEPA',     icon: 'business-outline' },
  { key: 'cash',     label: 'Dinheiro', icon: 'cash-outline' },
  { key: 'marked',   label: 'Marcar',   icon: 'checkmark-circle-outline' },
]

interface Transfer { from: string; to: string; amount: number }

interface Props {
  spaceId:   string
  members:   Member[]
  balances:  Record<string, number>
  transfers: Transfer[]
  symbol:    string
  currency:  Currency
  onBack:    () => void
}

export function Settle({ spaceId, members, transfers, symbol, currency, onBack }: Props) {
  const { colors }  = useTheme()
  const store       = useFamilyStore()
  const toast       = useToastStore()
  const byId        = Object.fromEntries(members.map(m => [m.id, m]))

  const [method, setMethod] = useState<Method>('marked')
  const [done, setDone]     = useState(false)

  function handleSettle() {
    const today = format(new Date(), 'yyyy-MM-dd')
    for (const t of transfers) {
      store.settle({
        spaceId,
        fromMember: t.from,
        toMember:   t.to,
        amount:     t.amount,
        currency,
        method,
        settledExpenseIds: [],
        date: today,
      })
    }
    setDone(true)
    toast.push('Dívidas liquidadas!', 'success')
  }

  if (done) {
    return (
      <View style={[st.page, st.center, { backgroundColor: colors.bg }]}>
        <Text style={[st.doneEmoji]}>✅</Text>
        <Text style={[st.doneTitle, { color: colors.text }]}>Liquidado!</Text>
        <Text style={[st.doneSub, { color: colors.textMuted }]}>Todas as dívidas foram registadas como pagas.</Text>
        <Button label="voltar" variant="secondary" size="lg" onPress={onBack} />
      </View>
    )
  }

  return (
    <ScrollView
      style={[st.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[st.title, { color: colors.text }]}>Liquidar tudo</Text>
      </View>

      {/* Transfer list */}
      <View style={[st.card, { backgroundColor: colors.surface }]}>
        <Text style={[st.cardTag, { color: colors.textMuted }]}>transferências a fazer</Text>
        {transfers.length === 0 ? (
          <Text style={[st.empty, { color: colors.textFaint }]}>nenhuma dívida em aberto ✓</Text>
        ) : (
          transfers.map((t, i) => {
            const from = byId[t.from]
            const to   = byId[t.to]
            if (!from || !to) return null
            return (
              <View key={i}>
                {i > 0 && <View style={[st.divider, { backgroundColor: colors.border }]} />}
                <View style={st.transferRow}>
                  <View style={[st.avatar, { backgroundColor: from.color }]}>
                    <Text style={st.initial}>{from.initial}</Text>
                  </View>
                  <Text style={[st.memberName, { color: colors.text }]}>{from.displayName}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.textFaint} style={{ marginHorizontal: 4 }} />
                  <Text style={[st.memberName, { color: colors.text }]}>{to.displayName}</Text>
                  <View style={[st.avatar, { backgroundColor: to.color }]}>
                    <Text style={st.initial}>{to.initial}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={[st.amount, { color: colors.text }]}>{symbol}{t.amount.toFixed(2)}</Text>
                </View>
              </View>
            )
          })
        )}
      </View>

      {/* Method */}
      {transfers.length > 0 && (
        <View style={[st.card, { backgroundColor: colors.surface }]}>
          <Text style={[st.cardTag, { color: colors.textMuted }]}>método de pagamento</Text>
          <View style={st.methodList}>
            {METHODS.map(m => {
              const active = method === m.key
              return (
                <Pressable
                  key={m.key}
                  style={[st.methodChip, {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accent : 'transparent',
                  }]}
                  onPress={() => setMethod(m.key)}
                >
                  <Ionicons name={m.icon as any} size={16} color={active ? colors.accentFg : colors.textMuted} />
                  <Text style={[st.methodLabel, { color: active ? colors.accentFg : colors.text }]}>{m.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      {/* Total */}
      {transfers.length > 0 && (
        <View style={[st.totalRow, { backgroundColor: colors.surface }]}>
          <Text style={[st.totalLabel, { color: colors.textMuted }]}>total liquidado</Text>
          <Text style={[st.totalAmount, { color: colors.text }]}>
            {symbol}{transfers.reduce((s, t) => s + t.amount, 0).toFixed(2)}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={st.footer}>
        <View style={{ flex: 1 }}>
          <Button label="cancelar" variant="secondary" size="lg" onPress={onBack} fullWidth />
        </View>
        {transfers.length > 0 && (
          <View style={{ flex: 1 }}>
            <Button label="confirmar →" variant="primary" size="lg" onPress={handleSettle} fullWidth />
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const st = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },
  center:  { justifyContent: 'center', alignItems: 'center', gap: theme.sp4, padding: theme.sp6 },

  header:  { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, marginBottom: theme.sp2 },
  title:   { fontSize: 22, fontFamily: theme.fontBlack, letterSpacing: -0.6 },

  card:    { borderRadius: theme.radiusXl, padding: theme.sp5, gap: theme.sp3 },
  cardTag: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },

  empty:   { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },

  transferRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  avatar:  { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 10, fontFamily: theme.fontBold },
  memberName: { fontSize: 13, fontFamily: theme.fontMedium },
  amount:  { fontSize: 14, fontFamily: theme.fontMonoBold, letterSpacing: -0.4 },

  methodList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  methodLabel:{ fontSize: 13, fontFamily: theme.fontMedium },

  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: theme.radiusXl, padding: theme.sp4 },
  totalLabel:  { fontSize: 12, fontFamily: theme.fontMedium, letterSpacing: 0.4 },
  totalAmount: { fontSize: 22, fontFamily: theme.fontMonoBold, letterSpacing: -0.8 },

  footer: { flexDirection: 'row', gap: theme.sp2, marginTop: theme.sp2 },

  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 28, fontFamily: theme.fontBlack, letterSpacing: -0.8 },
  doneSub:   { fontSize: 14, fontFamily: theme.fontRegular, textAlign: 'center', lineHeight: 20 },
})
