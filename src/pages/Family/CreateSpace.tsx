import React, { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFamilyStore, SpaceType, Currency } from '../../stores/familyData'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toasts'
import { useTheme } from '../../context/ThemeContext'
import { theme, CURRENCY_SYMBOL } from '../../theme'
import { Button } from '../../components/ui/Button'
import { Segmented } from '../../components/ui/Segmented'

const SPACE_TYPES: { key: SpaceType; label: string; emoji: string; desc: string }[] = [
  { key: 'family', label: 'Família',  emoji: '🏠', desc: 'até 8 membros' },
  { key: 'couple', label: 'Casal',    emoji: '💑', desc: '2 membros' },
  { key: 'house',  label: 'Casa',     emoji: '🏡', desc: 'até 6 membros' },
]

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'BRL']
const DEFAULT_NAMES: Record<SpaceType, string> = {
  family: 'A Nossa Família',
  couple: 'Nós Dois',
  house:  'A Nossa Casa',
}

interface Props { onBack: () => void }

export function CreateSpace({ onBack }: Props) {
  const { colors } = useTheme()
  const { createSpace } = useFamilyStore()
  const auth = useAuthStore()
  const toast = useToastStore()

  const [type, setType]       = useState<SpaceType>('family')
  const [name, setName]       = useState(DEFAULT_NAMES['family'])
  const [currency, setCurrency] = useState<Currency>('EUR')

  function handleTypeChange(t: SpaceType) {
    setType(t)
    setName(DEFAULT_NAMES[t])
  }

  function handleCreate() {
    if (!name.trim()) return
    const user = auth.user
    const displayName = user?.name ?? 'Admin'
    const initial     = displayName.charAt(0).toUpperCase()
    const userId      = user?.email ?? 'local'

    createSpace({ name: name.trim(), type, currency, userId, displayName, initial })
    toast.push('Espaço criado!', 'success')
    // FamilyIndex will re-render with the new activeSpaceId → SpaceDashboard
  }

  return (
    <ScrollView
      style={[cs.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={cs.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back button */}
      <Pressable onPress={onBack} style={cs.backBtn} hitSlop={8}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>

      <Text style={[cs.title, { color: colors.text }]}>Novo espaço</Text>

      {/* Type selector */}
      <View style={[cs.widget, { backgroundColor: colors.surface }]}>
        <Text style={[cs.widgetTag, { color: colors.textMuted }]}>tipo de espaço</Text>
        <View style={cs.typeList}>
          {SPACE_TYPES.map(t => {
            const active = type === t.key
            return (
              <Pressable
                key={t.key}
                style={[
                  cs.typeRow,
                  { borderColor: active ? colors.accent : colors.border },
                  active && { backgroundColor: colors.accent },
                ]}
                onPress={() => handleTypeChange(t.key)}
              >
                <Text style={cs.typeEmoji}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[cs.typeLabel, { color: active ? colors.accentFg : colors.text }]}>
                    {t.label}
                  </Text>
                  <Text style={[cs.typeDesc, { color: active ? colors.accentFg + 'bb' : colors.textMuted }]}>
                    {t.desc}
                  </Text>
                </View>
                {active && <Ionicons name="checkmark" size={18} color={colors.accentFg} />}
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Name input */}
      <View style={[cs.widget, { backgroundColor: colors.surface }]}>
        <Text style={[cs.widgetTag, { color: colors.textMuted }]}>nome do espaço</Text>
        <TextInput
          style={[cs.nameInput, { color: colors.text, borderBottomColor: colors.borderStrong }]}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Os Silva"
          placeholderTextColor={colors.textFaint}
          returnKeyType="done"
          autoCapitalize="words"
        />
        <Text style={[cs.nameHelper, { color: colors.textFaint }]}>
          aparece no topo do painel partilhado
        </Text>
      </View>

      {/* Currency */}
      <View style={[cs.widget, { backgroundColor: colors.surface }]}>
        <Text style={[cs.widgetTag, { color: colors.textMuted }]}>moeda padrão</Text>
        <Segmented
          options={CURRENCIES}
          value={currency}
          onChange={c => setCurrency(c as Currency)}
          layout="equal"
        />
      </View>

      {/* Footer */}
      <View style={cs.footer}>
        <View style={{ flex: 1 }}>
          <Button label="cancelar" variant="secondary" size="lg" onPress={onBack} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="criar →"
            variant="primary"
            size="lg"
            onPress={handleCreate}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  )
}

const cs = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },

  backBtn: { marginBottom: theme.sp2, alignSelf: 'flex-start', padding: 4 },
  title:   { fontSize: 34, fontFamily: theme.fontBlack, letterSpacing: -1, marginBottom: theme.sp2 },

  widget:    { borderRadius: theme.radiusXl, padding: theme.sp5, gap: theme.sp3 },
  widgetTag: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },

  typeList: { gap: theme.sp2 },
  typeRow:  {
    flexDirection: 'row', alignItems: 'center', gap: theme.sp3,
    padding: theme.sp3, borderRadius: theme.radiusMd, borderWidth: StyleSheet.hairlineWidth,
  },
  typeEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  typeLabel: { fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.3 },
  typeDesc:  { fontSize: theme.textXs, fontFamily: theme.fontRegular, marginTop: 1 },

  nameInput: {
    fontSize: 22, fontFamily: theme.fontBold, letterSpacing: -0.5,
    paddingVertical: theme.sp2, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameHelper: { fontSize: theme.textXs, fontFamily: theme.fontRegular },

  footer: { flexDirection: 'row', gap: theme.sp2, marginTop: theme.sp2 },
})
