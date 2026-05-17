import React, { useState, useMemo } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { useFamilyStore } from '../../stores/familyData'
import type { Member, Currency, SplitMode } from '../../stores/familyData'
import { useTheme } from '../../context/ThemeContext'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'
import { Button } from '../../components/ui/Button'

const CATEGORIES = [
  'Alimentação', 'Restaurante', 'Transporte', 'Renda', 'Streaming',
  'Saúde', 'Lazer', 'Utilities', 'Outro',
]

interface Props {
  spaceId:  string
  members:  Member[]
  currency: Currency
  symbol:   string
  onBack:   () => void
}

const SPLIT_TABS: { key: SplitMode; label: string }[] = [
  { key: 'equal',   label: 'Igual' },
  { key: 'percent', label: '%' },
  { key: 'exact',   label: 'Exato' },
  { key: 'single',  label: 'Só 1' },
]

export function AddSharedExpense({ spaceId, members, currency, symbol, onBack }: Props) {
  const { colors } = useTheme()
  const { addSharedExpense } = useFamilyStore()
  const toast = useToastStore()

  const [amountText, setAmountText]   = useState('')
  const [name, setName]               = useState('')
  const [category, setCategory]       = useState('Alimentação')
  const [paidBy, setPaidBy]           = useState(members[0]?.id ?? '')
  const [splitMode, setSplitMode]     = useState<SplitMode>('equal')
  const [percentShares, setPercent]   = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map(m => [m.id, String(Math.round(100 / (members.length || 1)))]))
  )
  const [exactShares, setExact]       = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map(m => [m.id, '']))
  )
  const [singleMember, setSingle]     = useState(members[0]?.id ?? '')

  const amount = parseFloat(amountText.replace(',', '.')) || 0

  // ── Validation ────────────────────────────────────────────────────────────
  const { valid, remainder, validationLabel } = useMemo(() => {
    if (splitMode === 'equal') {
      return { valid: amount > 0, remainder: 0, validationLabel: amount > 0 ? `${symbol}${(amount / members.length).toFixed(2)} p/pessoa ✓` : '' }
    }
    if (splitMode === 'percent') {
      const sum = members.reduce((s, m) => s + (parseFloat(percentShares[m.id]) || 0), 0)
      const rem = Math.round((100 - sum) * 100) / 100
      return { valid: Math.abs(rem) < 0.01 && amount > 0, remainder: rem, validationLabel: `${rem === 0 ? '✓' : `resto ${rem.toFixed(0)}%`}` }
    }
    if (splitMode === 'exact') {
      const sum = members.reduce((s, m) => s + (parseFloat(exactShares[m.id].replace(',', '.')) || 0), 0)
      const rem = Math.round((amount - sum) * 100) / 100
      return { valid: Math.abs(rem) < 0.005 && amount > 0, remainder: rem, validationLabel: rem === 0 ? '✓' : `resto ${symbol}${Math.abs(rem).toFixed(2)}` }
    }
    // single
    return { valid: amount > 0 && !!singleMember, remainder: 0, validationLabel: amount > 0 ? '✓' : '' }
  }, [splitMode, amount, members, percentShares, exactShares, singleMember, symbol])

  function buildSplit() {
    if (splitMode === 'equal')   return { mode: 'equal' as const,   members: members.map(m => m.id) }
    if (splitMode === 'percent') return { mode: 'percent' as const,  shares: Object.fromEntries(members.map(m => [m.id, parseFloat(percentShares[m.id]) || 0])) }
    if (splitMode === 'exact')   return { mode: 'exact' as const,    shares: Object.fromEntries(members.map(m => [m.id, parseFloat(exactShares[m.id].replace(',', '.')) || 0])) }
    return { mode: 'single' as const, member: singleMember }
  }

  function handleSave() {
    if (!valid || !name.trim()) return
    addSharedExpense({
      spaceId, kind: 'expense', name: name.trim(), emoji: null,
      amount, currency, category, date: format(new Date(), 'yyyy-MM-dd'),
      paidBy, split: buildSplit(), note: '',
    })
    toast.push('Gasto adicionado!', 'success')
    onBack()
  }

  return (
    <ScrollView
      style={[ae.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={ae.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={ae.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[ae.title, { color: colors.text }]}>Novo gasto</Text>
      </View>

      {/* Amount */}
      <View style={[ae.card, { backgroundColor: colors.surface }]}>
        <Text style={[ae.cardTag, { color: colors.textMuted }]}>valor</Text>
        <View style={ae.amountRow}>
          <Text style={[ae.symbol, { color: colors.textMuted }]}>{symbol}</Text>
          <TextInput
            style={[ae.amountInput, { color: colors.text }]}
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor={colors.textFaint}
          />
        </View>
      </View>

      {/* Name + Category */}
      <View style={[ae.card, { backgroundColor: colors.surface }]}>
        <Text style={[ae.cardTag, { color: colors.textMuted }]}>descrição</Text>
        <TextInput
          style={[ae.nameInput, { color: colors.text, borderBottomColor: colors.borderStrong }]}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Supermercado Continente"
          placeholderTextColor={colors.textFaint}
          returnKeyType="next"
        />
        <View style={ae.catWrap}>
          {CATEGORIES.map(c => {
            const active = category === c
            return (
              <Pressable
                key={c}
                style={[ae.catChip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : 'transparent' }]}
                onPress={() => setCategory(c)}
              >
                <Text style={[ae.catLabel, { color: active ? colors.accentFg : colors.textMuted }]}>{c}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Pago por */}
      <View style={[ae.card, { backgroundColor: colors.surface }]}>
        <Text style={[ae.cardTag, { color: colors.textMuted }]}>pago por</Text>
        <View style={ae.memberRow}>
          {members.map(m => {
            const active = paidBy === m.id
            return (
              <Pressable
                key={m.id}
                style={[ae.memberChip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : 'transparent' }]}
                onPress={() => setPaidBy(m.id)}
              >
                <View style={[ae.miniAvatar, { backgroundColor: m.color }]}>
                  <Text style={ae.miniInitial}>{m.initial}</Text>
                </View>
                <Text style={[ae.memberName, { color: active ? colors.accentFg : colors.text }]}>{m.displayName}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Split mode */}
      <View style={[ae.card, { backgroundColor: colors.surface }]}>
        <Text style={[ae.cardTag, { color: colors.textMuted }]}>divisão</Text>

        {/* Tabs */}
        <View style={[ae.tabBar, { backgroundColor: colors.surfaceEl }]}>
          {SPLIT_TABS.map(t => {
            const active = splitMode === t.key
            return (
              <Pressable
                key={t.key}
                style={[ae.tab, active && { backgroundColor: colors.surface }]}
                onPress={() => setSplitMode(t.key)}
              >
                <Text style={[ae.tabLabel, { color: active ? colors.text : colors.textMuted }]}>{t.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {/* Split detail */}
        <View style={ae.splitBody}>
          {splitMode === 'equal' && (
            <Text style={[ae.splitHint, { color: colors.textMuted }]}>
              Dividido igualmente entre {members.length} {members.length === 1 ? 'pessoa' : 'pessoas'}.
            </Text>
          )}

          {splitMode === 'percent' && members.map(m => (
            <View key={m.id} style={ae.shareRow}>
              <View style={[ae.miniAvatar, { backgroundColor: m.color }]}>
                <Text style={ae.miniInitial}>{m.initial}</Text>
              </View>
              <Text style={[ae.shareName, { color: colors.text }]}>{m.displayName}</Text>
              <TextInput
                style={[ae.shareInput, { color: colors.text, borderColor: colors.border }]}
                value={percentShares[m.id]}
                onChangeText={v => setPercent(prev => ({ ...prev, [m.id]: v }))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textFaint}
              />
              <Text style={[ae.shareUnit, { color: colors.textMuted }]}>%</Text>
            </View>
          ))}

          {splitMode === 'exact' && members.map(m => (
            <View key={m.id} style={ae.shareRow}>
              <View style={[ae.miniAvatar, { backgroundColor: m.color }]}>
                <Text style={ae.miniInitial}>{m.initial}</Text>
              </View>
              <Text style={[ae.shareName, { color: colors.text }]}>{m.displayName}</Text>
              <Text style={[ae.shareUnit, { color: colors.textMuted }]}>{symbol}</Text>
              <TextInput
                style={[ae.shareInput, { color: colors.text, borderColor: colors.border }]}
                value={exactShares[m.id]}
                onChangeText={v => setExact(prev => ({ ...prev, [m.id]: v }))}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor={colors.textFaint}
              />
            </View>
          ))}

          {splitMode === 'single' && (
            <View style={ae.memberRow}>
              {members.map(m => {
                const active = singleMember === m.id
                return (
                  <Pressable
                    key={m.id}
                    style={[ae.memberChip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : 'transparent' }]}
                    onPress={() => setSingle(m.id)}
                  >
                    <View style={[ae.miniAvatar, { backgroundColor: m.color }]}>
                      <Text style={ae.miniInitial}>{m.initial}</Text>
                    </View>
                    <Text style={[ae.memberName, { color: active ? colors.accentFg : colors.text }]}>{m.displayName}</Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        {/* Validation pill */}
        {validationLabel ? (
          <View style={[ae.validRow, { backgroundColor: valid ? colors.successBg : colors.dangerBg }]}>
            <Text style={[ae.validLabel, { color: valid ? colors.success : colors.danger }]}>{validationLabel}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer */}
      <View style={ae.footer}>
        <View style={{ flex: 1 }}>
          <Button label="cancelar" variant="secondary" size="lg" onPress={onBack} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="guardar →"
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={!valid || !name.trim()}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  )
}

const ae = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },

  header: { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, marginBottom: theme.sp2 },
  title:  { fontSize: 22, fontFamily: theme.fontBlack, letterSpacing: -0.6 },

  card:    { borderRadius: theme.radiusXl, padding: theme.sp5, gap: theme.sp3 },
  cardTag: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },

  amountRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  symbol:      { fontSize: 26, fontFamily: theme.fontMono },
  amountInput: { fontSize: 40, fontFamily: theme.fontMonoBold, letterSpacing: -1.6, minWidth: 120 },

  nameInput: { fontSize: 18, fontFamily: theme.fontBold, letterSpacing: -0.4, paddingVertical: theme.sp2, borderBottomWidth: StyleSheet.hairlineWidth },

  catWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  catLabel: { fontSize: 12, fontFamily: theme.fontMedium, letterSpacing: 0.2 },

  memberRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  memberName:  { fontSize: 13, fontFamily: theme.fontMedium },
  miniAvatar:  { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  miniInitial: { fontSize: 9, fontFamily: theme.fontBold },

  tabBar:   { flexDirection: 'row', borderRadius: theme.radiusMd, overflow: 'hidden', padding: 3 },
  tab:      { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: theme.radiusSm },
  tabLabel: { fontSize: 13, fontFamily: theme.fontBold },

  splitBody:  { gap: theme.sp2 },
  splitHint:  { fontSize: 13, fontFamily: theme.fontRegular, fontStyle: 'italic' },

  shareRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareName:  { flex: 1, fontSize: 13, fontFamily: theme.fontMedium },
  shareInput: { width: 72, textAlign: 'right', fontSize: 14, fontFamily: theme.fontMonoBold, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  shareUnit:  { fontSize: 12, fontFamily: theme.fontMono, width: 16 },

  validRow:   { borderRadius: theme.radiusMd, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  validLabel: { fontSize: 12, fontFamily: theme.fontMedium },

  footer: { flexDirection: 'row', gap: theme.sp2, marginTop: theme.sp2 },
})
