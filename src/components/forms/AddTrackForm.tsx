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
import { Button } from '../ui/Button'

const TYPES = ['subscription', 'app', 'event'] as const
const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL']
const CURRENCY_SYM: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', BRL: 'R$' }
const CYCLES = ['weekly', 'monthly', 'yearly']
const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Cloud', 'Productivity', 'News', 'Fitness', 'Education', 'Other']
const PAYMENTS = ['Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other']

const COLOR_PALETTE = [
  '#111111', '#FF2B2B', '#E50914', '#FF6B35', '#F59E0B', '#84CC16',
  '#22C55E', '#10B981', '#0EA5E9', '#1E88E5', '#0071E3', '#6366F1',
  '#9333EA', '#EC4899', '#A0522D', '#171515',
]

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

  // Form state
  const [step, setStep]               = useState(1)
  const [type, setType]               = useState<typeof TYPES[number]>('subscription')
  const [name, setName]               = useState('')
  const [emoji, setEmoji]             = useState('💳')
  const [price, setPrice]             = useState('')
  const [currency, setCurrency]       = useState('EUR')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [nextDate, setNextDate]       = useState('')
  const [category, setCategory]       = useState('Other')
  const [payment, setPayment]         = useState('Card')
  const [note, setNote]               = useState('')
  const [color, setColor]             = useState<string>(COLOR_PALETTE[0])
  const [customColor, setCustomColor] = useState('')
  const [error, setError]             = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiCategory, setEmojiCategory]     = useState('Finance')

  function goNext() {
    if (!name.trim()) { setError('Name is required'); return }
    if (type !== 'event' && !price) { setError('Price is required'); return }
    if (!nextDate) { setError('Date is required'); return }
    setError('')
    setStep(2)
  }

  function submit() {
    setError('')
    const finalColor = customColor.trim() || color
    const base = { type, name: name.trim(), emoji, color: finalColor, currency, category, note: note.trim(), active: true }
    if (type === 'event') {
      onSubmit({ ...base, date: nextDate })
    } else {
      onSubmit({ ...base, price: parseFloat(price), billingCycle, nextChargeDate: nextDate, purchaseDate: nextDate, date: nextDate, paymentMethod: payment })
    }
  }

  const inputStyle = { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }
  const dateLabel  = type === 'event' ? 'Date' : type === 'app' ? 'Purchase date' : 'Next charge'

  return (
    <View>
      {/* ── Step indicator ── */}
      <View style={si.row}>
        <View style={si.dots}>
          {[1, 2].map(n => (
            <View key={n} style={[si.dot, { backgroundColor: n <= step ? colors.accent : colors.border }]} />
          ))}
        </View>
        <Text style={[si.label, { color: colors.textMuted }]}>
          {step === 1 ? 'Essentials' : 'Details'}
        </Text>
      </View>

      {/* ════════════ STEP 1 ════════════ */}
      {step === 1 && (
        <View style={s.fields}>
          {/* Type tabs */}
          <View style={[s.segmented, { backgroundColor: colors.surfaceEl }]}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.segment, type === t && { backgroundColor: colors.accent }]}
                onPress={() => setType(t)}
              >
                <Text style={[s.segmentText, { color: type === t ? colors.accentFg : colors.textMuted }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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

          {/* Price + Currency symbols */}
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
                <View style={s.currencyGrid}>
                  {CURRENCIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[s.currencyBtn, {
                        backgroundColor: currency === c ? colors.accent : colors.surfaceEl,
                        borderColor: currency === c ? colors.accent : colors.border,
                      }]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text style={[s.currencySymText, { color: currency === c ? colors.accentFg : colors.text }]}>
                        {CURRENCY_SYM[c]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
        </View>
      )}

      {/* ════════════ STEP 2 ════════════ */}
      {step === 2 && (
        <View style={s.fields}>
          {/* Billing cycle — subscription only */}
          {type === 'subscription' && (
            <View>
              <Text style={[s.label, { color: colors.textMuted }]}>Billing cycle</Text>
              <View style={[s.segmented, { backgroundColor: colors.surfaceEl }]}>
                {CYCLES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.segment, billingCycle === c && { backgroundColor: colors.accent }]}
                    onPress={() => setBillingCycle(c)}
                  >
                    <Text style={[s.segmentText, { color: billingCycle === c ? colors.accentFg : colors.textMuted }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Category */}
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={Platform.OS === 'web'}
              contentContainerStyle={s.pillsScroll}
              style={Platform.OS === 'web' ? s.hScrollWeb : undefined}
            >
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

          {/* Payment method — subscription only */}
          {type === 'subscription' && (
            <View>
              <Text style={[s.label, { color: colors.textMuted }]}>Payment</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={Platform.OS === 'web'}
                contentContainerStyle={s.pillsScroll}
                style={Platform.OS === 'web' ? s.hScrollWeb : undefined}
            >
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

          {/* Color */}
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>Color</Text>
            <View style={s.colorRow}>
              {COLOR_PALETTE.map(c => {
                const selected = (customColor.trim() || color) === c
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      s.colorSwatch,
                      { backgroundColor: c, borderColor: selected ? colors.text : 'transparent' },
                    ]}
                    onPress={() => { setColor(c); setCustomColor('') }}
                    accessibilityLabel={`Color ${c}`}
                  />
                )
              })}
            </View>
            <TextInput
              style={[s.input, inputStyle, { marginTop: 8 }]}
              value={customColor}
              onChangeText={setCustomColor}
              placeholder="Or custom hex (e.g. #FF00AA)"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="characters"
            />
          </View>

          {/* Note */}
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>Note</Text>
            <TextInput
              style={[s.input, s.noteInput, inputStyle]}
              value={note}
              onChangeText={setNote}
              placeholder="Optional"
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      )}

      {error ? <Text style={[s.errorText, { color: colors.danger }]}>{error}</Text> : null}

      {/* ── Actions ── */}
      <View style={s.actions}>
        <Button
          label={step === 1 ? 'Cancel' : '← Back'}
          variant="secondary"
          size="md"
          onPress={step === 1 ? onCancel : () => setStep(1)}
        />
        <View style={{ flex: 1 }}>
          <Button
            label={step === 1 ? 'Next →' : 'Add'}
            variant="primary"
            size="md"
            onPress={step === 1 ? goNext : submit}
            fullWidth
          />
        </View>
      </View>

      {/* ── Emoji Picker ── */}
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

// Step indicator styles
const si = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: theme.sp5 },
  dots:  { flexDirection: 'row', gap: 6 },
  dot:   { width: 28, height: 3, borderRadius: 2 },
  label: { fontSize: 12, fontFamily: theme.fontRegular, marginLeft: 'auto' },
})

const s = StyleSheet.create({
  fields: { gap: theme.sp4 },
  row:    { flexDirection: 'row', gap: theme.sp3, alignItems: 'flex-end' },
  grow:   { flex: 1 },

  segmented:   { flexDirection: 'row', borderRadius: theme.radiusFull, padding: 4, marginBottom: theme.sp5, gap: 2 },
  segment:     { flex: 1, paddingVertical: 9, borderRadius: theme.radiusFull, alignItems: 'center' },
  segmentText: { fontSize: theme.textSm, fontFamily: theme.fontBold },

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
  noteInput: { minHeight: 72, paddingTop: theme.sp3 },
  colorRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch:{ width: 28, height: 28, borderRadius: 8, borderWidth: 2 },

  emojiField: { width: 64 },
  emojiInput: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 0 },
  emojiText:  { fontSize: 22 },

  currencyWrap: { flex: 1 },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  currencyBtn: {
    width: 42, height: 42,
    borderRadius: theme.radiusMd,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymText: { fontSize: 17, fontFamily: theme.fontBold },

  pillsScroll: { gap: theme.sp2, paddingVertical: 2 },
  hScrollWeb:  { paddingBottom: 6 } as any,
  pill: {
    paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: theme.radiusFull, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  pillText: { fontSize: theme.textXs, fontFamily: theme.fontBold, textAlign: 'center' },

  errorText: { fontSize: 12, fontFamily: theme.fontMedium, marginBottom: 8, marginTop: 8 },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },
  btnPrimary: {
    flex: 1, paddingVertical: 14, borderRadius: theme.radiusFull, alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    }),
  },
  btnPrimaryText:  { fontSize: 15, fontFamily: theme.fontBold },
  btnSecondary:    { paddingVertical: 14, paddingHorizontal: theme.sp5, borderRadius: theme.radiusFull, borderWidth: 1, alignItems: 'center' },
  btnSecondaryText: { fontSize: theme.textSm, fontFamily: theme.fontBold },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: theme.sp5, paddingBottom: 36 },
  pickerHandle:  { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: theme.sp4 },
  pickerTitle:   { fontSize: theme.textBase, fontFamily: theme.fontBold, marginBottom: theme.sp4, textAlign: 'center' },
  catScroll:        { marginBottom: theme.sp4 },
  catScrollContent: { gap: theme.sp2, paddingHorizontal: theme.sp1 },
  catPill:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  catPillText: { fontSize: theme.textXs, fontFamily: theme.fontBold },
  emojiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2, justifyContent: 'center' },
  emojiCell:     { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiCellText: { fontSize: 26 },
})
