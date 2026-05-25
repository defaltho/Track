import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { useDataStore } from '../../stores/data'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Segmented'
import { TagInput } from '../ui/TagInput'

const CADENCES = ['daily', 'weekly'] as const
const CATEGORIES = ['Health', 'Fitness', 'Mind', 'Learning', 'Routine', 'Other']
const EMOJIS = ['🏃', '🧘', '📚', '💧', '🥗', '🛌', '✍️', '🪥', '☀️', '🧘‍♀️', '🎯', '🪴']

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialValue?: any
  submitLabel?: string
}

export function AddHabitForm({ onSubmit, onCancel, initialValue, submitLabel }: Props) {
  const { colors } = useTheme()
  const toast = useToastStore()
  const customCategories = useDataStore(s => s.settings.customCategories ?? [])
  const allCategories = [...CATEGORIES, ...customCategories]
  const isEdit = !!initialValue

  const [name, setName] = useState(initialValue?.name ?? '')
  const [nameError, setNameError] = useState('')
  const [emoji, setEmoji] = useState(initialValue?.emoji ?? '🎯')
  const [cadence, setCadence] = useState<typeof CADENCES[number]>(initialValue?.cadence ?? 'daily')
  const [category, setCategory] = useState(initialValue?.category ?? 'Routine')
  const [note, setNote] = useState(initialValue?.note ?? '')
  const [tags, setTags] = useState<string[]>(Array.isArray(initialValue?.tags) ? initialValue.tags : [])

  function submit() {
    if (!name.trim()) {
      setNameError('Habit name is required')
      toast.push('Habit name is required', 'error')
      return
    }
    onSubmit({
      name: name.trim(),
      emoji,
      cadence,
      category,
      note: note.trim(),
      tags: tags.length > 0 ? tags : undefined,
      checkins: initialValue?.checkins ?? [],
      active: initialValue?.active ?? true,
    })
  }

  const inputStyle = [s.input, { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }]

  return (
    <View style={s.root}>
      <View style={s.fields}>
        {/* Emoji + Name */}
        <View style={s.rowFlex}>
          <View style={s.emojiCol}>
            <Text style={[s.label, { color: colors.textMuted }]}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.emojiRow}>
                {EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setEmoji(e)}
                    style={[s.emojiCell, { backgroundColor: emoji === e ? colors.accent : colors.surfaceEl }]}
                  >
                    <Text style={s.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Habit name *</Text>
          <TextInput
            style={[inputStyle, nameError ? { borderColor: colors.danger } : null]}
            value={name}
            onChangeText={v => { setName(v); setNameError('') }}
            placeholder="Drink 2L water"
            placeholderTextColor={colors.textFaint}
          />
          {nameError ? <Text style={[s.errText, { color: colors.danger }]}>{nameError}</Text> : null}
        </View>

        {/* Cadence */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Cadence</Text>
          <Segmented
            options={CADENCES as unknown as readonly string[]}
            value={cadence}
            onChange={v => setCadence(v as typeof cadence)}
            layout="equal"
            size="sm"
            capitalize
          />
        </View>

        {/* Category */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Category</Text>
          <Segmented
            options={allCategories}
            value={category}
            onChange={setCategory}
            layout="scroll"
            size="sm"
          />
        </View>

        {/* Note */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Note</Text>
          <TextInput
            style={inputStyle}
            value={note}
            onChangeText={setNote}
            placeholder="Optional"
            placeholderTextColor={colors.textFaint}
          />
        </View>

        {/* Tags */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Tags</Text>
          <TagInput value={tags} onChange={setTags} />
        </View>
      </View>

      <View style={s.actions}>
        <Button label="Cancel" variant="secondary" size="md" onPress={onCancel} />
        <View style={{ flex: 1 }}>
          <Button label={submitLabel ?? (isEdit ? 'Save' : 'Add Habit')} variant="primary" size="md" onPress={submit} fullWidth />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: theme.sp4 },
  fields: { gap: theme.sp4 },
  rowFlex: { flexDirection: 'row', gap: theme.sp3 },
  emojiCol: { flex: 1 },
  emojiRow: { flexDirection: 'row', gap: 6 },
  emojiCell: { width: 42, height: 42, borderRadius: theme.radiusMd, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 20 },

  label: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.sp1,
  },
  input: {
    paddingHorizontal: theme.sp4,
    paddingVertical: theme.sp3,
    borderWidth: 1,
    borderRadius: theme.radiusLg,
    fontSize: theme.textSm,
    fontFamily: theme.fontRegular,
  },
  errText: { fontSize: 12, fontFamily: theme.fontMedium, marginTop: 6 },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp4 },
})
