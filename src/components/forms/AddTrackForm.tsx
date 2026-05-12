import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { theme } from '../../theme'

const TYPES = ['subscription', 'app', 'event'] as const
const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL']
const CYCLES = ['weekly', 'monthly', 'yearly']
const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Cloud', 'Productivity', 'News', 'Fitness', 'Education', 'Other']
const PAYMENTS = ['Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other']

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function AddTrackForm({ onSubmit, onCancel }: Props) {
  const [type, setType] = useState<typeof TYPES[number]>('subscription')
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💳')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [nextDate, setNextDate] = useState('')
  const [category, setCategory] = useState('Other')
  const [payment, setPayment] = useState('Card')
  const [note, setNote] = useState('')

  function submit() {
    if (!name.trim() || !price || !nextDate) return
    onSubmit({
      type,
      name: name.trim(),
      emoji,
      color: '#000000',
      price: parseFloat(price),
      currency,
      billingCycle,
      nextChargeDate: nextDate,
      purchaseDate: nextDate,
      date: nextDate,
      category,
      paymentMethod: payment,
      note: note.trim(),
      active: true,
    })
  }

  const dateLabel = type === 'event' ? 'Date' : type === 'app' ? 'Purchase date' : 'Next charge'

  return (
    <View>
      <View style={s.typeTabs}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tab, type === t && s.tabActive]}
            onPress={() => setType(t)}
          >
            <Text style={[s.tabText, type === t && s.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.fields}>
        <View style={s.row}>
          <View style={s.emojiField}>
            <Text style={s.label}>Icon</Text>
            <TextInput
              style={[s.input, s.emojiInput]}
              value={emoji}
              onChangeText={setEmoji}
              maxLength={2}
            />
          </View>
          <View style={s.grow}>
            <Text style={s.label}>Name *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Netflix"
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={s.grow}>
            <Text style={s.label}>Price *</Text>
            <TextInput
              style={s.input}
              value={price}
              onChangeText={setPrice}
              placeholder="9.99"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={s.pickerWrap}>
            <Text style={s.label}>Currency</Text>
            <Picker
              selectedValue={currency}
              onValueChange={setCurrency}
              style={s.picker}
            >
              {CURRENCIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
        </View>

        {type === 'subscription' && (
          <View>
            <Text style={s.label}>Billing cycle</Text>
            <View style={s.pills}>
              {CYCLES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.pill, billingCycle === c && s.pillActive]}
                  onPress={() => setBillingCycle(c)}
                >
                  <Text style={[s.pillText, billingCycle === c && s.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={s.label}>{dateLabel} * (YYYY-MM-DD)</Text>
          <TextInput
            style={s.input}
            value={nextDate}
            onChangeText={setNextDate}
            placeholder="2025-12-31"
            keyboardType="numeric"
          />
        </View>

        <View style={s.row}>
          <View style={s.grow}>
            <Text style={s.label}>Category</Text>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={s.picker}
            >
              {CATEGORIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
          {type === 'subscription' && (
            <View style={s.grow}>
              <Text style={s.label}>Payment</Text>
              <Picker
                selectedValue={payment}
                onValueChange={setPayment}
                style={s.picker}
              >
                {PAYMENTS.map(m => <Picker.Item key={m} label={m} value={m} />)}
              </Picker>
            </View>
          )}
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
          <Text style={s.btnPrimaryText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  typeTabs: {
    flexDirection: 'row',
    gap: theme.sp2,
    marginBottom: theme.sp5,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.sp2,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.bg,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: theme.accent },
  tabText: { fontSize: theme.textSm, fontWeight: '600', color: theme.textMuted },
  tabTextActive: { color: theme.accentFg },

  fields: { gap: theme.sp4 },
  row: { flexDirection: 'row', gap: theme.sp3, alignItems: 'flex-end' },
  grow: { flex: 1 },

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
  emojiField: { width: 64 },
  emojiInput: { textAlign: 'center', fontSize: 18 },

  pickerWrap: { flex: 1 },
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
