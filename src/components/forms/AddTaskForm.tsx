import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { theme } from '../../theme'

const PRIORITIES = ['low', 'medium', 'high'] as const
const CATEGORIES = ['Personal', 'Work', 'Finance', 'Health', 'Travel', 'Other']

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function AddTaskForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueDateError, setDueDateError] = useState('')
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('medium')
  const [category, setCategory] = useState('Other')
  const [note, setNote] = useState('')

  function submit() {
    if (!name.trim()) { setNameError('O nome da tarefa é obrigatório'); return }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setDueDateError('Invalid date format. Use YYYY-MM-DD.')
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

  return (
    <View>
      <View style={s.fields}>
        <View>
          <Text style={s.label}>Task name *</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={v => { setName(v); setNameError('') }}
            placeholder="Cancel gym membership"
            placeholderTextColor={theme.textFaint}
          />
        </View>

        <View>
          <Text style={s.label}>Due date (YYYY-MM-DD)</Text>
          <TextInput
            style={[s.input, dueDateError ? s.inputError : null]}
            value={dueDate}
            onChangeText={v => { setDueDate(v); setDueDateError('') }}
            placeholder="2025-12-31"
            placeholderTextColor={theme.textFaint}
            keyboardType="numeric"
          />
          {dueDateError ? <Text style={s.errorText}>{dueDateError}</Text> : null}
        </View>

        <View>
          <Text style={s.label}>Priority</Text>
          <View style={s.pills}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.pill, priority === p && s.pillActive]}
                onPress={() => setPriority(p)}
              >
                <Text style={[s.pillText, priority === p && s.pillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={s.label}>Category</Text>
          <Picker
            selectedValue={category}
            onValueChange={setCategory}
            style={s.picker}
          >
            {CATEGORIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
          </Picker>
        </View>

        <View>
          <Text style={s.label}>Note</Text>
          <TextInput
            style={s.input}
            value={note}
            onChangeText={setNote}
            placeholder="Optional"
            placeholderTextColor={theme.textFaint}
          />
        </View>
      </View>

      {nameError ? <Text style={s.nameErrorText}>{nameError}</Text> : null}
      <View style={s.actions}>
        <TouchableOpacity style={s.btnSecondary} onPress={onCancel}>
          <Text style={s.btnSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnPrimary} onPress={submit}>
          <Text style={s.btnPrimaryText}>Add Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  fields: { gap: theme.sp4 },
  label: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    color: theme.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.sp1,
  },
  input: {
    paddingHorizontal: theme.sp3,
    paddingVertical: theme.sp3,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    fontSize: theme.textSm,
    fontFamily: theme.fontRegular,
    backgroundColor: theme.surfaceEl,
    color: theme.text,
  },
  inputError: {
    borderColor: theme.danger,
  },
  errorText: {
    fontSize: theme.textXs,
    fontFamily: theme.fontMedium,
    color: theme.danger,
    marginTop: theme.sp1,
  },
  picker: {
    backgroundColor: theme.surfaceEl,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    height: 44,
    color: theme.text,
  },
  pills: { flexDirection: 'row', gap: theme.sp2 },
  pill: {
    flex: 1,
    paddingVertical: theme.sp2,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.surfaceEl,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  pillText: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: theme.textMuted },
  pillTextActive: { color: theme.accentFg },
  nameErrorText: { color: theme.danger, fontSize: 12, fontFamily: theme.fontMedium, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.accent,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  btnPrimaryText: { fontSize: 15, fontFamily: theme.fontBold, color: theme.accentFg },
  btnSecondary: {
    paddingVertical: 14,
    paddingHorizontal: theme.sp5,
    borderRadius: 14,
    backgroundColor: theme.surfaceEl,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: theme.textMuted },
})
