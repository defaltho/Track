import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>('medium')
  const [category, setCategory] = useState('Other')
  const [note, setNote] = useState('')

  function submit() {
    if (!name.trim()) return
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
            onChangeText={setName}
            placeholder="Cancel gym membership"
          />
        </View>

        <View>
          <Text style={s.label}>Due date (YYYY-MM-DD)</Text>
          <TextInput
            style={s.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-12-31"
            keyboardType="numeric"
          />
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
          />
        </View>
      </View>

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
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.sp1,
  },
  input: {
    paddingHorizontal: theme.sp3,
    paddingVertical: theme.sp3,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    fontSize: theme.textSm,
    backgroundColor: theme.bg,
    color: theme.text,
  },
  picker: {
    backgroundColor: theme.bg,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radiusMd,
    height: 44,
  },
  pills: { flexDirection: 'row', gap: theme.sp2 },
  pill: {
    flex: 1,
    paddingVertical: theme.sp2,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bg,
    borderWidth: 1.5,
    borderColor: theme.border,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  pillText: { fontSize: theme.textXs, fontWeight: '600', color: theme.textMuted },
  pillTextActive: { color: theme.accentFg },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },
  btnPrimary: {
    flex: 1,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.accent,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: theme.textSm, fontWeight: '700', color: theme.accentFg },
  btnSecondary: {
    paddingVertical: theme.sp3,
    paddingHorizontal: theme.sp5,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bg,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontWeight: '600', color: theme.textMuted },
})
