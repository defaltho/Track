import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'

const TYPES = ['subscription', 'app', 'event'] as const
const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL']
const CYCLES = ['weekly', 'monthly', 'yearly']
const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Cloud', 'Productivity', 'News', 'Fitness', 'Education', 'Other']
const PAYMENTS = ['Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other']

const EMOJI_SETS: Record<string, string[]> = {
  Finance:   ['💳', '💰', '💵', '💴', '💶', '💷', '🏦', '📈', '📉', '🪙', '💎', '🏧'],
  Tech:      ['📱', '💻', '🖥️', '⌨️', '🖱️', '🎮', '🕹️', '📡', '🔌', '🔋', '💾', '📀'],
  Media:     ['🎬', '🎵', '🎧', '📺', '🎙️', '🎤', '📻', '🎷', '🎸', '🎹', '🎺', '🥁'],
  Cloud:     ['☁️', '🌐', '🔐', '🔒', '🗄️', '📂', '📁', '🗃️', '📊', '📋', '🗂️', '📌'],
  Lifestyle: ['🏋️', '🧘', '🚴', '🏃', '🍎', '🥗', '🧴', '✂️', '🛍️', '👗', '🎓', '📚'],
  Travel:    ['✈️', '🚗', '🚀', '🚂', '🛳️', '🗺️', '🏖️', '⛺', '🌍', '🏕️', '🎒', '🧳'],
  Food:      ['☕', '🍕', '🍣', '🍔', '🥤', '🍺', '🍷', '🧃', '🍜', '🥐', '🍰', '🍫'],
  Home:      ['🏠', '🛋️', '💡', '🔑', '🛁', '🪴', '🧹', '🔧', '🏗️', '🛏️', '📦', '🧺'],
  Health:    ['🏥', '💊', '🩺', '🦷', '👁️', '🩻', '🩹', '🏃', '🧬', '💉', '🧪', '🫀'],
  Other:     ['⭐', '✨', '🎯', '🎁', '🎉', '🌟', '🔔', '❤️', '🌈', '🧲', '🔮', '🪄'],
}

interface Props {
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function AddTrackForm({ onSubmit, onCancel }: Props) {
  const { colors } = useTheme()
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
    if (!name.trim()) { setError('Name is required'); return }
    if (type !== 'event' && !price) { setError('Price is required'); return }
    if (!nextDate) { setError('Date is required'); return }
    setError('')
    const base = { type, name: name.trim(), emoji, color: '#000000', currency, category, note: note.trim(), active: true }
    if (type === 'event') {
      onSubmit({ ...base, date: nextDate })
    } else {
      onSubmit({ ...base, price: parseFloat(price), billingCycle, nextChargeDate: nextDate, purchaseDate: nextDate, date: nextDate, paymentMethod: payment })
    }
  }

  const dateLabel = type === 'event' ? 'Date' : type === 'app' ? 'Purchase date' : 'Next charge'
  const inputStyle = { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }

  return (
    <View>
      {/* Type tabs */}
      <View style={s.typeTabs}>
        {TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tab, { backgroundColor: type === t ? colors.accent : colors.surfaceEl, borderColor: type === t ? colors.accent : colors.border }]}
            onPress={() => setType(t)}
          >
            <Text style={[s.tabText, { color: type === t ? colors.accentFg : colors.textMuted }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.fields}>
        {/* Emoji + Name */}
        <View style={s.row}>
          <View style={s.emojiField}>
            <Text style={[s.label, { color: colors.textMuted }]}>Icon</Text>
            <TouchableOpacity
              style={[s.input, s.emojiInput, inputStyle]}
              onPress={() => setShowEmojiPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose icon"
            >
              <Text style={s.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.grow}>
            <Text style={[s.label, { color: colors.textMuted }]}>Name *</Text>
            <TextInput
              style={[s.input, inputStyle]}
              value={name}
              onChangeText={v => { setName(v); setError('') }}
              placeholder="Netflix"
              placeholderTextColor={colors.textFaint}
            />
          </View>
        </View>

        {/* Price + Currency */}
        {type !== 'event' && (
          <View style={s.row}>
            <View style={s.grow}>
              <Text style={[s.label, { color: colors.textMuted }]}>Price *</Text>
              <TextInput
                style={[s.input, inputStyle]}
                value={price}
                onChangeText={v => { setPrice(v); setError('') }}
                placeholder="9.99"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.currencyWrap}>
              <Text style={[s.label, { color: colors.textMuted }]}>Currency</Text>
              <View style={s.currencyPills}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.currencyPill, {
                      backgroundColor: currency === c ? colors.accent : colors.surfaceEl,
                      borderColor: currency === c ? colors.accent : colors.border,
                    }]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={[s.currencyPillText, { color: currency === c ? colors.accentFg : colors.textMuted }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Billing cycle */}
        {type === 'subscription' && (
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>Billing cycle</Text>
            <View style={s.pills}>
              {CYCLES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.pill, {
                    backgroundColor: billingCycle === c ? colors.accent : colors.surfaceEl,
                    borderColor: billingCycle === c ? colors.accent : colors.border,
                  }]}
                  onPress={() => setBillingCycle(c)}
                >
                  <Text style={[s.pillText, { color: billingCycle === c ? colors.accentFg : colors.textMuted }]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Date */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>{dateLabel} * (YYYY-MM-DD)</Text>
          <TextInput
            style={[s.input, inputStyle]}
            value={nextDate}
            onChangeText={v => { setNextDate(v); setError('') }}
            placeholder="2025-12-31"
            placeholderTextColor={colors.textFaint}
            keyboardType="numeric"
          />
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

        {/* Payment */}
        {type === 'subscription' && (
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>Payment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillsScroll}>
              {PAYMENTS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.pill, {
                    backgroundColor: payment === m ? colors.accent : colors.surfaceEl,
                    borderColor: payment === m ? colors.accent : colors.border,
                  }]}
                  onPress={() => setPayment(m)}
                >
                  <Text style={[s.pillText, { color: payment === m ? colors.accentFg : colors.textMuted }]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Note */}
        <View>
          <Text style={[s.label, { color: colors.textMuted }]}>Note</Text>
          <TextInput
            style={[s.input, inputStyle]}
            value={note}
            onChangeText={setNote}
            placeholder="Optional"
            placeholderTextColor={colors.textFaint}
          />
        </View>
      </View>

      {error ? <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text> : null}

      <View style={s.actions}>
        <TouchableOpacity
          style={[s.btnSecondary, { backgroundColor: colors.surfaceEl, borderColor: colors.border }]}
          onPress={onCancel}
        >
          <Text style={[s.btnSecondaryText, { color: colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnPrimary, { backgroundColor: colors.accent }]}
          onPress={submit}
        >
          <Text style={[s.btnPrimaryText, { color: colors.accentFg }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Emoji Picker */}
      <Modal visible={showEmojiPicker} transparent animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowEmojiPicker(false)}>
          <View style={[s.pickerSheet, { backgroundColor: colors.surface }]}>
            <View style={[s.pickerHandle, { backgroundColor: colors.borderStrong }]} />
            <Text style={[s.pickerTitle, { color: colors.text }]}>Choose Icon</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catScrollContent}>
              {Object.keys(EMOJI_SETS).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catPill, {
                    backgroundColor: emojiCategory === cat ? colors.accent : colors.surfaceEl,
                    borderColor: emojiCategory === cat ? colors.accent : colors.border,
                  }]}
                  onPress={() => setEmojiCategory(cat)}
                >
                  <Text style={[s.catPillText, { color: emojiCategory === cat ? colors.accentFg : colors.textMuted }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={s.emojiGrid}>
              {(EMOJI_SETS[emojiCategory] ?? []).map(e => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiCell, { backgroundColor: emoji === e ? colors.accent : colors.surfaceEl }]}
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
  typeTabs: { flexDirection: 'row', gap: theme.sp2, marginBottom: theme.sp5 },
  tab: { flex: 1, paddingVertical: theme.sp2, borderRadius: theme.radiusMd, borderWidth: 1, alignItems: 'center' },
  tabText: { fontSize: theme.textSm, fontFamily: theme.fontBold },

  fields: { gap: theme.sp4 },
  row: { flexDirection: 'row', gap: theme.sp3, alignItems: 'flex-end' },
  grow: { flex: 1 },

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
  emojiField: { width: 64 },
  emojiInput: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 0 },
  emojiText: { fontSize: 22 },

  currencyWrap: { flex: 1 },
  currencyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  currencyPill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 7, borderWidth: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  currencyPillText: { fontSize: 10, fontFamily: theme.fontBold },

  pills: { flexDirection: 'row', gap: theme.sp2 },
  pillsScroll: { gap: theme.sp2, paddingVertical: 2 },
  pill: { flex: 1, paddingVertical: theme.sp2, paddingHorizontal: theme.sp3, borderRadius: theme.radiusMd, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: theme.textXs, fontFamily: theme.fontBold },

  errorText: { fontSize: 12, fontFamily: theme.fontMedium, marginBottom: 8, marginTop: 8 },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },
  btnPrimary: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    }),
  },
  btnPrimaryText: { fontSize: 15, fontFamily: theme.fontBold },
  btnSecondary: { paddingVertical: 14, paddingHorizontal: theme.sp5, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: theme.sp5, paddingBottom: 36 },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: theme.sp4 },
  pickerTitle: { fontSize: theme.textBase, fontFamily: theme.fontBold, marginBottom: theme.sp4, textAlign: 'center' },
  catScroll: { marginBottom: theme.sp4 },
  catScrollContent: { gap: theme.sp2, paddingHorizontal: theme.sp1 },
  catPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  catPillText: { fontSize: theme.textXs, fontFamily: theme.fontBold },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2, justifyContent: 'center' },
  emojiCell: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiCellText: { fontSize: 26 },
})
