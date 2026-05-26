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

const CATEGORIES = ['Health', 'Finance', 'Fitness', 'Learning', 'Personal', 'Other']
const EMOJIS = ['🎯', '🏃', '📚', '💰', '🏋️', '🧠', '✍️', '🌍', '🎨', '💤', '🎓', '🎸']

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialValue?: any
  submitLabel?: string
}

export function AddGoalForm({ onSubmit, onCancel, initialValue, submitLabel }: Props) {
  const { colors } = useTheme()
  const toast = useToastStore()
  const customCategories = useDataStore(s => s.settings.customCategories ?? [])
  const allCategories = [...CATEGORIES, ...customCategories]
  const isEdit = !!initialValue

  const [name, setName] = useState(initialValue?.name ?? '')
  const [nameError, setNameError] = useState('')
  const [emoji, setEmoji] = useState(initialValue?.emoji ?? '🎯')
  const [targetValue, setTargetValue] = useState(String(initialValue?.targetValue ?? ''))
  const [targetError, setTargetError] = useState('')
  const [unit, setUnit] = useState(initialValue?.unit ?? '')
  const [deadline, setDeadline] = useState(initialValue?.deadline ?? '')
  const [category, setCategory] = useState(initialValue?.category ?? 'Personal')
  const [note, setNote] = useState(initialValue?.note ?? '')
  const [tags, setTags] = useState<string[]>(Array.isArray(initialValue?.tags) ? initialValue.tags : [])

  function submit() {
    let valid = true
    if (!name.trim()) {
      setNameError('Goal name is required')
      toast.push('Goal name is required', 'error')
      valid = false
    }
    const tv = parseFloat(targetValue)
    if (isNaN(tv) || tv <= 0) {
      setTargetError('Target must be a positive number')
      toast.push('Target must be a positive number', 'error')
      valid = false
    }
    if (!valid) return
    onSubmit({
      name: name.trim(),
      emoji,
      targetValue: tv,
      unit: unit.trim(),
      entries: initialValue?.entries ?? [],
      deadline: deadline.trim() || undefined,
      category,
      note: note.trim(),
      tags: tags.length > 0 ? tags : undefined,
      active: initialValue?.active ?? true,
    })
  }

  const inputStyle = [s.input, { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }]

  return (
    <View style={s.root}>
      <View style={s.fields}>
        {/* Emoji */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.emojiRow}>
              {EMOJIS.map(e => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[s.emojiCell, { backgroundColor: emoji === e ? colors.accent : colors.surfaceEl }]}
                >
                  <Text style={[s.emojiText, { color: emoji === e ? colors.accentFg : colors.text }]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Name */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Goal name *</Text>
          <TextInput
            style={[inputStyle, nameError ? { borderColor: colors.danger } : null]}
            value={name}
            onChangeText={v => { setName(v); setNameError('') }}
            placeholder="Read 12 books"
            placeholderTextColor={colors.textFaint}
          />
          {nameError ? <Text style={[s.errText, { color: colors.danger }]}>{nameError}</Text> : null}
        </View>

        {/* Target + Unit */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Target *</Text>
          <View style={s.targetRow}>
            <TextInput
              style={[inputStyle, s.targetInput, targetError ? { borderColor: colors.danger } : null]}
              value={targetValue}
              onChangeText={v => { setTargetValue(v); setTargetError('') }}
              placeholder="100"
              placeholderTextColor={colors.textFaint}
              keyboardType="numeric"
            />
            <TextInput
              style={[inputStyle, s.unitInput]}
              value={unit}
              onChangeText={setUnit}
              placeholder="km, books, €…"
              placeholderTextColor={colors.textFaint}
            />
          </View>
          {targetError ? <Text style={[s.errText, { color: colors.danger }]}>{targetError}</Text> : null}
        </View>

        {/* Deadline */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Deadline (optional)</Text>
          <TextInput
            style={inputStyle}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="yyyy-mm-dd"
            placeholderTextColor={colors.textFaint}
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
          <Button label={submitLabel ?? (isEdit ? 'Save' : 'Add Goal')} variant="primary" size="md" onPress={submit} fullWidth />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: theme.sp4 },
  fields: { gap: theme.sp4 },
  emojiRow: { flexDirection: 'row', gap: 6 },
  emojiCell: { width: 42, height: 42, borderRadius: theme.radiusMd, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 20 },
  targetRow: { flexDirection: 'row', gap: theme.sp3 },
  targetInput: { flex: 1 },
  unitInput: { flex: 2 },
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
