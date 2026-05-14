import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { theme } from '../../theme'

const TYPES = ['subscription', 'app', 'event'] as const
const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL']
const CYCLES = ['weekly', 'monthly', 'yearly']
const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Cloud', 'Productivity', 'News', 'Fitness', 'Education', 'Other']
const PAYMENTS = ['Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other']

const EMOJI_SETS: Record<string, string[]> = {
  Finance:  ['💳', '💰', '💵', '💴', '💶', '💷', '🏦', '📈', '📉', '🪙', '💎', '🏧'],
  Tech:     ['📱', '💻', '🖥️', '⌨️', '🖱️', '🎮', '🕹️', '📡', '🔌', '🔋', '💾', '📀'],
  Media:    ['🎬', '🎵', '🎧', '📺', '🎙️', '🎤', '📻', '🎷', '🎸', '🎹', '🎺', '🥁'],
  Cloud:    ['☁️', '🌐', '🔐', '🔒', '🗄️', '📂', '📁', '🗃️', '📊', '📋', '🗂️', '📌'],
  Lifestyle:['🏋️', '🧘', '🚴', '🏃', '🍎', '🥗', '🧴', '✂️', '🛍️', '👗', '🎓', '📚'],
  Travel:   ['✈️', '🚗', '🚀', '🚂', '🛳️', '🗺️', '🏖️', '⛺', '🌍', '🏕️', '🎒', '🧳'],
  Food:     ['☕', '🍕', '🍣', '🍔', '🥤', '🍺', '🍷', '🧃', '🍜', '🥐', '🍰', '🍫'],
  Home:     ['🏠', '🛋️', '💡', '🔑', '🛁', '🪴', '🧹', '🔧', '🏗️', '🛏️', '📦', '🧺'],
  Health:   ['🏥', '💊', '🩺', '🦷', '👁️', '🩻', '🩹', '🏃', '🧬', '💉', '🧪', '🫀'],
  Other:    ['⭐', '✨', '🎯', '🎁', '🎉', '🌟', '🔔', '❤️', '🌈', '🧲', '🔮', '🪄'],
}

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
  const [error, setError] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiCategory, setEmojiCategory] = useState('Finance')

  function submit() {
    if (!name.trim()) { setError('O nome é obrigatório'); return }
    if (type !== 'event' && !price) { setError('O preço é obrigatório'); return }
    if (!nextDate) { setError('A data é obrigatória'); return }

    const base = {
      type,
      name: name.trim(),
      emoji,
      color: '#000000',
      currency,
      category,
      note: note.trim(),
      active: true,
    }

    if (type === 'event') {
      onSubmit({ ...base, date: nextDate })
    } else {
      onSubmit({
        ...base,
        price: parseFloat(price),
        billingCycle,
        nextChargeDate: nextDate,
        purchaseDate: nextDate,
        date: nextDate,
        paymentMethod: payment,
      })
    }
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
          {/* Emoji picker trigger */}
          <View style={s.emojiField}>
            <Text style={s.label}>Icon</Text>
            <TouchableOpacity
              style={[s.input, s.emojiInput]}
              onPress={() => setShowEmojiPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose icon"
            >
              <Text style={s.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.grow}>
            <Text style={s.label}>Name *</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={v => { setName(v); setError('') }}
              placeholder="Netflix"
              placeholderTextColor={theme.textFaint}
            />
          </View>
        </View>

        {type !== 'event' && (
          <View style={s.row}>
            <View style={s.grow}>
              <Text style={s.label}>Price *</Text>
              <TextInput
                style={s.input}
                value={price}
                onChangeText={v => { setPrice(v); setError('') }}
                placeholder="9.99"
                placeholderTextColor={theme.textFaint}
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
        )}

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
            onChangeText={v => { setNextDate(v); setError('') }}
            placeholder="2025-12-31"
            placeholderTextColor={theme.textFaint}
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
            placeholderTextColor={theme.textFaint}
          />
        </View>
      </View>

      {error ? <Text style={s.errorText}>{error}</Text> : null}
      <View style={s.actions}>
        <TouchableOpacity style={s.btnSecondary} onPress={onCancel}>
          <Text style={s.btnSecondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnPrimary} onPress={submit}>
          <Text style={s.btnPrimaryText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Emoji Picker ── */}
      <Modal visible={showEmojiPicker} transparent animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowEmojiPicker(false)}>
          <View style={s.pickerSheet}>
            <View style={s.pickerHandle} />
            <Text style={s.pickerTitle}>Choose Icon</Text>

            {/* Category tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catScrollContent}>
              {Object.keys(EMOJI_SETS).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catPill, emojiCategory === cat && s.catPillActive]}
                  onPress={() => setEmojiCategory(cat)}
                >
                  <Text style={[s.catPillText, emojiCategory === cat && s.catPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Emoji grid */}
            <View style={s.emojiGrid}>
              {(EMOJI_SETS[emojiCategory] ?? []).map(e => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiCell, emoji === e && s.emojiCellActive]}
                  onPress={() => { setEmoji(e); setShowEmojiPicker(false) }}
                >
                  <Text style={s.emojiCellText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: theme.accent },
  tabText: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: theme.textMuted },
  tabTextActive: { color: theme.accentFg },

  fields: { gap: theme.sp4 },
  row: { flexDirection: 'row', gap: theme.sp3, alignItems: 'flex-end' },
  grow: { flex: 1 },

  label: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
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
    fontFamily: theme.fontRegular,
    backgroundColor: theme.bg,
    color: theme.text,
  },
  emojiField: { width: 64 },
  emojiInput: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  emojiText: { fontSize: 22 },

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
    backgroundColor: theme.surfaceEl,
    borderWidth: 1.5,
    borderColor: theme.border,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  pillText: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: theme.textMuted },
  pillTextActive: { color: theme.accentFg },

  errorText: { color: theme.danger, fontSize: 12, fontFamily: theme.fontMedium, marginBottom: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },
  btnPrimary: {
    flex: 1,
    paddingVertical: theme.sp3,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.accent,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold, color: theme.accentFg },
  btnSecondary: {
    paddingVertical: theme.sp3,
    paddingHorizontal: theme.sp5,
    borderRadius: theme.radiusMd,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontMedium, color: theme.textMuted },

  // ── Emoji picker sheet ──
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.sp5,
    paddingBottom: 36,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginBottom: theme.sp4,
  },
  pickerTitle: {
    fontSize: theme.textBase,
    fontFamily: theme.fontBold,
    color: theme.text,
    marginBottom: theme.sp4,
    textAlign: 'center',
  },
  catScroll: { marginBottom: theme.sp4 },
  catScrollContent: { gap: theme.sp2, paddingHorizontal: theme.sp1 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.surfaceEl,
  },
  catPillActive: { backgroundColor: theme.accent },
  catPillText: { fontSize: theme.textXs, fontFamily: theme.fontBold, color: theme.textMuted },
  catPillTextActive: { color: theme.accentFg },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sp2,
    justifyContent: 'center',
  },
  emojiCell: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellActive: {
    backgroundColor: theme.accent,
  },
  emojiCellText: { fontSize: 26 },
})
