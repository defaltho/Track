import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder }: Props) {
  const { colors } = useTheme()
  const [draft, setDraft] = useState('')

  function addTag() {
    const t = draft.trim().replace(/^#/, '')
    if (!t) return
    if (value.includes(t)) { setDraft(''); return }
    onChange([...value, t])
    setDraft('')
  }

  function removeTag(t: string) {
    onChange(value.filter(x => x !== t))
  }

  return (
    <View style={s.root}>
      {value.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} keyboardShouldPersistTaps="handled">
          {value.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.chip, { backgroundColor: colors.accent }]}
              onPress={() => removeTag(t)}
              accessibilityLabel={`Remove tag ${t}`}
            >
              <Text style={[s.chipText, { color: colors.accentFg }]}>#{t}</Text>
              <Text style={[s.chipX, { color: colors.accentFg }]}>×</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TextInput
        style={[s.input, { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }]}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={addTag}
        onBlur={addTag}
        placeholder={placeholder ?? 'Add a tag and press Enter'}
        placeholderTextColor={colors.textFaint}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: theme.sp2 },
  chips: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.sp3,
    paddingVertical: 6,
    borderRadius: theme.radiusFull,
  },
  chipText: { fontSize: theme.textXs, fontFamily: theme.fontMedium },
  chipX: { fontSize: 14, fontFamily: theme.fontBold, marginLeft: 2 },
  input: {
    paddingHorizontal: theme.sp4,
    paddingVertical: theme.sp3,
    borderWidth: 1,
    borderRadius: theme.radiusLg,
    fontSize: theme.textSm,
    fontFamily: theme.fontRegular,
  },
})
