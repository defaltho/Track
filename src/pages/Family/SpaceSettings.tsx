import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFamilyStore } from '../../stores/familyData'
import type { Space, Currency } from '../../stores/familyData'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../context/ThemeContext'
import { useToastStore } from '../../stores/toasts'
import { theme, CURRENCY_SYMBOL } from '../../theme'
import { Button } from '../../components/ui/Button'
import { Segmented } from '../../components/ui/Segmented'

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'BRL']

interface Props { space: Space; onBack: () => void }

export function SpaceSettings({ space, onBack }: Props) {
  const { colors }  = useTheme()
  const store       = useFamilyStore()
  const auth        = useAuthStore()
  const toast       = useToastStore()

  const userId    = auth.user?.email ?? 'local'
  const myMember  = store.members.find(m => m.spaceId === space.id && m.userId === userId)
  const isAdmin   = myMember?.role === 'admin'

  const symbol = CURRENCY_SYMBOL[space.currency] ?? '€'

  const [name, setName]         = useState(space.name)
  const [currency, setCurrency] = useState<Currency>(space.currency)
  const [budgetText, setBudget] = useState(space.monthlyBudget != null ? String(space.monthlyBudget) : '')
  const [confirm, setConfirm]   = useState(false)

  function handleSave() {
    const budget = budgetText.trim() ? parseFloat(budgetText.replace(',', '.')) : null
    if (budgetText.trim() && (isNaN(budget!) || budget! <= 0)) {
      toast.push('Valor de orçamento inválido', 'error')
      return
    }
    store.updateSpace(space.id, { name: name.trim() || space.name, currency, monthlyBudget: budget })
    toast.push('Definições guardadas', 'success')
    onBack()
  }

  function handleLeave() {
    store.leaveSpace(space.id, userId)
    toast.push('Saíste do espaço', 'info')
    onBack()
  }

  function handleArchive() {
    store.archiveSpace(space.id)
    toast.push('Espaço eliminado', 'info')
    onBack()
  }

  return (
    <ScrollView
      style={[ss.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={ss.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={ss.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[ss.title, { color: colors.text }]}>Definições</Text>
      </View>

      {/* Space name */}
      {isAdmin && (
        <View style={[ss.card, { backgroundColor: colors.surface }]}>
          <Text style={[ss.cardTag, { color: colors.textMuted }]}>nome do espaço</Text>
          <TextInput
            style={[ss.nameInput, { color: colors.text, borderBottomColor: colors.borderStrong }]}
            value={name}
            onChangeText={setName}
            placeholder={space.name}
            placeholderTextColor={colors.textFaint}
            returnKeyType="done"
            autoCapitalize="words"
          />
        </View>
      )}

      {/* Currency */}
      {isAdmin && (
        <View style={[ss.card, { backgroundColor: colors.surface }]}>
          <Text style={[ss.cardTag, { color: colors.textMuted }]}>moeda</Text>
          <Segmented
            options={CURRENCIES}
            value={currency}
            onChange={c => setCurrency(c as Currency)}
            layout="equal"
          />
        </View>
      )}

      {/* Budget */}
      {isAdmin && (
        <View style={[ss.card, { backgroundColor: colors.surface }]}>
          <Text style={[ss.cardTag, { color: colors.textMuted }]}>orçamento mensal partilhado</Text>
          <View style={ss.budgetRow}>
            <Text style={[ss.budgetSymbol, { color: colors.textMuted }]}>{symbol}</Text>
            <TextInput
              style={[ss.budgetInput, { color: colors.text }]}
              value={budgetText}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              placeholder="sem limite"
              placeholderTextColor={colors.textFaint}
            />
          </View>
        </View>
      )}

      {/* Space info */}
      <View style={[ss.card, { backgroundColor: colors.surface }]}>
        <Text style={[ss.cardTag, { color: colors.textMuted }]}>informação</Text>
        <View style={ss.infoRow}>
          <Text style={[ss.infoLabel, { color: colors.textMuted }]}>membros</Text>
          <Text style={[ss.infoValue, { color: colors.text }]}>
            {store.members.filter(m => m.spaceId === space.id).length}
          </Text>
        </View>
        <View style={[ss.divider, { backgroundColor: colors.border }]} />
        <View style={ss.infoRow}>
          <Text style={[ss.infoLabel, { color: colors.textMuted }]}>tipo</Text>
          <Text style={[ss.infoValue, { color: colors.text }]}>{space.type}</Text>
        </View>
        <View style={[ss.divider, { backgroundColor: colors.border }]} />
        <View style={ss.infoRow}>
          <Text style={[ss.infoLabel, { color: colors.textMuted }]}>moeda</Text>
          <Text style={[ss.infoValue, { color: colors.text }]}>{space.currency}</Text>
        </View>
      </View>

      {/* Save */}
      {isAdmin && (
        <Button label="guardar alterações" variant="primary" size="lg" onPress={handleSave} fullWidth />
      )}

      {/* Danger zone */}
      <View style={[ss.card, { backgroundColor: colors.dangerBg }]}>
        <Text style={[ss.cardTag, { color: colors.danger }]}>zona de perigo</Text>
        {!isAdmin ? (
          !confirm ? (
            <Button label="sair do espaço" variant="danger" size="md" onPress={() => setConfirm(true)} fullWidth />
          ) : (
            <View style={ss.confirmRow}>
              <Text style={[ss.confirmTxt, { color: colors.danger }]}>Tens a certeza?</Text>
              <Button label="cancelar" variant="secondary" size="sm" onPress={() => setConfirm(false)} />
              <Button label="sair" variant="danger" size="sm" onPress={handleLeave} />
            </View>
          )
        ) : (
          !confirm ? (
            <Button label="eliminar espaço" variant="danger" size="md" onPress={() => setConfirm(true)} fullWidth />
          ) : (
            <View style={ss.confirmRow}>
              <Text style={[ss.confirmTxt, { color: colors.danger }]}>Isto é irreversível.</Text>
              <Button label="cancelar" variant="secondary" size="sm" onPress={() => setConfirm(false)} />
              <Button label="eliminar" variant="danger" size="sm" onPress={handleArchive} />
            </View>
          )
        )}
      </View>
    </ScrollView>
  )
}

const ss = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },

  header:  { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, marginBottom: theme.sp2 },
  title:   { fontSize: 22, fontFamily: theme.fontBlack, letterSpacing: -0.6 },

  card:    { borderRadius: theme.radiusXl, padding: theme.sp5, gap: theme.sp3 },
  cardTag: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },

  nameInput:  { fontSize: 20, fontFamily: theme.fontBold, letterSpacing: -0.4, paddingVertical: theme.sp2, borderBottomWidth: StyleSheet.hairlineWidth },

  budgetRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  budgetSymbol: { fontSize: 18, fontFamily: theme.fontMono },
  budgetInput:  { fontSize: 28, fontFamily: theme.fontMonoBold, letterSpacing: -1, minWidth: 100 },

  divider:  { height: StyleSheet.hairlineWidth },
  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  infoLabel:{ fontSize: 12, fontFamily: theme.fontRegular },
  infoValue:{ fontSize: 13, fontFamily: theme.fontMedium },

  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: theme.sp2, flexWrap: 'wrap' },
  confirmTxt: { flex: 1, fontSize: 13, fontFamily: theme.fontMedium },
})
