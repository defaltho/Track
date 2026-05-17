import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format, parseISO, isSameMonth } from 'date-fns'
import { useFamilyStore } from '../../stores/familyData'
import { useAuthStore } from '../../stores/auth'
import { memberBalances, simplifyDebts } from '../../utils/family'
import { useTheme } from '../../context/ThemeContext'
import { theme, CURRENCY_SYMBOL } from '../../theme'
import { MyBalanceWidget }    from '../../components/widgets/family/MyBalanceWidget'
import { DebtsListWidget }    from '../../components/widgets/family/DebtsListWidget'
import { SharedLedgerWidget } from '../../components/widgets/family/SharedLedgerWidget'
import { AddSharedExpense }   from './AddSharedExpense'
import { Members }            from './Members'
import { Settle }             from './Settle'
import { SpaceSettings }      from './SpaceSettings'

export function SpaceDashboard() {
  const { colors } = useTheme()
  const auth = useAuthStore()
  const store = useFamilyStore()

  const [showAdd, setShowAdd]           = useState(false)
  const [showMembers, setShowMembers]   = useState(false)
  const [showSettle, setShowSettle]     = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const space   = useMemo(() => store.spaces.find(s => s.id === store.activeSpaceId), [store.spaces, store.activeSpaceId])
  const members = useMemo(() => store.members.filter(m => m.spaceId === store.activeSpaceId), [store.members, store.activeSpaceId])
  const expenses = useMemo(() => store.sharedExpenses.filter(e => e.spaceId === store.activeSpaceId), [store.sharedExpenses, store.activeSpaceId])

  const userId    = auth.user?.email ?? 'local'
  const myMember  = members.find(m => m.userId === userId)
  const symbol    = CURRENCY_SYMBOL[space?.currency ?? 'EUR'] ?? '€'
  const now       = new Date()
  const month     = format(now, 'yyyy-MM')

  // ── Ledger stats ────────────────────────────────────────────────────────
  const thisMonthSpend = useMemo(
    () => expenses
      .filter(e => e.kind === 'expense' && e.date.startsWith(month))
      .reduce((s, e) => s + e.amount, 0),
    [expenses, month]
  )
  const monthExpenses  = useMemo(() => expenses.filter(e => e.kind === 'expense' && e.date.startsWith(month)), [expenses, month])
  const activeSubs     = useMemo(() => store.sharedExpenses.filter(e => e.spaceId === store.activeSpaceId && e.kind === 'expense'), [store.sharedExpenses, store.activeSpaceId])

  const balances   = useMemo(() => memberBalances(members, expenses.filter(e => e.kind === 'expense')), [members, expenses])
  const myBalance  = myMember ? (balances[myMember.id] ?? 0) : 0
  const transfers  = useMemo(() => simplifyDebts(balances), [balances])

  if (!space) return null

  const stats: { label: string; value: string; sub?: string }[] = [
    { label: 'este mês',  value: `${symbol}${thisMonthSpend.toFixed(0)}` },
    { label: 'teu saldo', value: `${myBalance >= 0 ? '+' : ''}${symbol}${Math.abs(myBalance).toFixed(0)}` },
    { label: 'gastos',    value: String(monthExpenses.length) },
    { label: 'subs',      value: String(activeSubs.length) },
  ]

  if (showAdd)      return <AddSharedExpense spaceId={space.id} members={members} currency={space.currency} symbol={symbol} onBack={() => setShowAdd(false)} />
  if (showMembers)  return <Members spaceId={space.id} onBack={() => setShowMembers(false)} />
  if (showSettle)   return <Settle spaceId={space.id} members={members} balances={balances} transfers={transfers} symbol={symbol} currency={space.currency} onBack={() => setShowSettle(false)} />
  if (showSettings) return <SpaceSettings space={space} onBack={() => setShowSettings(false)} />

  return (
    <ScrollView
      style={[sd.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={sd.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={sd.header}>
        <View style={{ flex: 1 }}>
          <Text style={[sd.title, { color: colors.text }]}>{space.name}</Text>
        </View>
        {/* Member avatars */}
        <Pressable style={sd.avatarRow} onPress={() => setShowMembers(true)}>
          {members.slice(0, 4).map((m, i) => (
            <View key={m.id} style={[sd.avatar, { backgroundColor: m.color, marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }]}>
              <Text style={sd.avatarInitial}>{m.initial}</Text>
            </View>
          ))}
          {members.length > 4 && (
            <View style={[sd.avatar, { backgroundColor: colors.surfaceHigh, marginLeft: -8 }]}>
              <Text style={[sd.avatarInitial, { color: colors.textMuted }]}>+{members.length - 4}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={() => setShowAdd(true)} style={[sd.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color={colors.accentFg} />
        </Pressable>
        <Pressable onPress={() => setShowSettings(true)} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* 4-cell ledger stat row */}
      <View style={[sd.statRow, { backgroundColor: colors.surface }]}>
        {stats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={[sd.statDivider, { backgroundColor: colors.border }]} />}
            <View style={sd.statCell}>
              <Text style={[sd.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[sd.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Widgets */}
      <MyBalanceWidget
        balance={myBalance}
        symbol={symbol}
        members={members}
        balances={balances}
        myMemberId={myMember?.id ?? ''}
      />

      <DebtsListWidget
        transfers={transfers}
        members={members}
        symbol={symbol}
        onSettle={() => setShowSettle(true)}
      />

      <SharedLedgerWidget
        tag="este mês · gastos partilhados"
        expenses={monthExpenses}
        members={members}
        symbol={symbol}
        maxRows={5}
      />
    </ScrollView>
  )
}

const sd = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },

  header:   { flexDirection: 'row', alignItems: 'center', gap: theme.sp2, marginBottom: theme.sp1 },
  title:    { fontSize: 26, fontFamily: theme.fontBlack, letterSpacing: -0.8 },

  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
  avatarInitial: { fontSize: 11, fontFamily: theme.fontBold },

  addBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  statRow:     { flexDirection: 'row', borderRadius: theme.radiusXl, padding: theme.sp4 },
  statCell:    { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },
  statValue:   { fontSize: 18, fontFamily: theme.fontMonoBold, letterSpacing: -0.8 },
  statLabel:   { fontSize: 9, fontFamily: theme.fontMedium, letterSpacing: 1.2, textTransform: 'lowercase' },
})
