import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'
import { Button } from '../ui/Button'

const PRIORITIES = ['low', 'medium', 'high'] as const
const CATEGORIES = ['Personal', 'Work', 'Finance', 'Health', 'Travel', 'Other']

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function AddTaskForm({ onSubmit, onCancel }: Props) {
  const { colors } = useTheme()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueDateError, setDueDateError] = useState('')
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('medium')
  const [category, setCategory] = useState('Other')
  const [note, setNote] = useState('')

  function submit() {
    if (!name.trim()) { setNameError('Task name is required'); return }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setDueDateError('Use format YYYY-MM-DD')
      return
    }
    setDueDateError('')
    onSubmit({
      name: name.trim(),
      done: false,
      dueDate: dueDate || null,
      priority,
      category,
      note: note.trim(),
      amount: null,
      currency: null,
    })
  }

  const inputStyle = [s.input, { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }]

  return (
    <View style={s.root}>
      <View style={s.fields}>
        {/* Name */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Task name *</Text>
          <TextInput
            style={[inputStyle, nameError ? { borderColor: colors.danger } : null]}
            value={name}
            onChangeText={v => { setName(v); setNameError('') }}
            placeholder="Cancel gym membership"
            placeholderTextColor={colors.textFaint}
          />
          {nameError ? <Text style={[s.errText, { color: colors.danger }]}>{nameError}</Text> : null}
        </View>

        {/* Due date */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Due date</Text>
          <TextInput
            style={[inputStyle, dueDateError ? { borderColor: colors.danger } : null]}
            value={dueDate}
            onChangeText={v => { setDueDate(v); setDueDateError('') }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textFaint}
            keyboardType="numeric"
          />
          {dueDateError ? <Text style={[s.errText, { color: colors.danger }]}>{dueDateError}</Text> : null}
        </View>

        {/* Priority */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Priority</Text>
          <View style={s.pills}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.pill, {
                  backgroundColor: priority === p ? colors.accent : colors.surfaceEl,
                  borderColor: priority === p ? colors.accent : colors.border,
                }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[s.pillText, { color: priority === p ? colors.accentFg : colors.textMuted }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsScroll}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.pill, {
                  backgroundColor: category === c ? colors.accent : colors.surfaceEl,
                  borderColor: category === c ? colors.accent : colors.border,
                }]}
                onPress={() => setCategory(c)}
              >
                <Text style={[s.pillText, { color: category === c ? colors.accentFg : colors.textMuted }]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
      </View>

      <View style={s.actions}>
        <Button label="Cancel" variant="secondary" size="md" onPress={onCancel} />
        <View style={{ flex: 1 }}>
          <Button label="Add Task" variant="primary" size="md" onPress={submit} fullWidth />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: 0 },
  fields: { gap: theme.sp4 },
  label: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.sp1,
  },
  input: {
    paddingHorizontal: theme.sp3,
    paddingVertical: theme.sp3,
    borderWidth: 1,
    borderRadius: theme.radiusMd,
    fontSize: theme.textSm,
    fontFamily: theme.fontRegular,
  },
  errText: {
    fontSize: theme.textXs,
    fontFamily: theme.fontMedium,
    marginTop: theme.sp1,
  },
  pills: { flexDirection: 'row', gap: theme.sp2 },
  pillsScroll: { gap: theme.sp2 },
  pill: {
    flex: 1,
    paddingVertical: theme.sp2,
    paddingHorizontal: theme.sp3,
    borderRadius: theme.radiusMd,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillText: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
  },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    }),
  },
  btnPrimaryText: { fontSize: 15, fontFamily: theme.fontBold },
  btnSecondary: {
    paddingVertical: 14,
    paddingHorizontal: theme.sp5,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold },
})
