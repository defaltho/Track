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
  useWindowDimensions,
} from 'react-native'

const CAL_DAYS   = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function calFirstDay(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1 }
function calDaysIn(y: number, m: number)   { return new Date(y, m + 1, 0).getDate() }
function fmtDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
function displayDate(iso: string) {
  if (!iso) return 'Select date'
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2,'0')} ${CAL_MONTHS[m - 1]?.slice(0,3)} ${y}`
}
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'
import { Button, IconButton } from '../ui/Button'
import { Segmented } from '../ui/Segmented'

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
  const { width: screenWidth } = useWindowDimensions()
  const calWidth = Math.min(310, screenWidth - 48)
  const cellSize = Math.floor((calWidth - theme.sp5 * 2) / 7)

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
  const [showDatePicker, setShowDatePicker]   = useState(false)
  const [calYear, setCalYear]   = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())

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
          {/* Type tabs — Button DNA via Segmented */}
          <Segmented
            options={TYPES as unknown as readonly string[]}
            value={type}
            onChange={v => setType(v as typeof type)}
            layout="equal"
            size="md"
            capitalize
          />

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
                    <IconButton
                      key={c}
                      variant={currency === c ? 'primary' : 'secondary'}
                      size="md"
                      onPress={() => setCurrency(c)}
                      accessibilityLabel={c}
                    >
                      <Text style={[s.currencySymText, { color: currency === c ? '#FFFFFF' : colors.text }]}>
                        {CURRENCY_SYM[c]}
                      </Text>
                    </IconButton>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Date */}
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>{dateLabel} *</Text>
            <TouchableOpacity
              style={[s.input, inputStyle, s.dateTouchable]}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Select date"
            >
              <Text style={{ color: nextDate ? colors.text : colors.textFaint, fontSize: theme.textSm, fontFamily: theme.fontRegular }}>
                {displayDate(nextDate)}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>📅</Text>
            </TouchableOpacity>
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
              <Segmented
                options={CYCLES}
                value={billingCycle}
                onChange={setBillingCycle}
                layout="equal"
                size="sm"
                capitalize
              />
            </View>
          )}

          {/* Category */}
          <View>
            <Text style={[s.label, { color: colors.textMuted }]}>Category</Text>
            <Segmented
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              layout="scroll"
              size="sm"
            />
          </View>

          {/* Payment method — subscription only */}
          {type === 'subscription' && (
            <View>
              <Text style={[s.label, { color: colors.textMuted }]}>Payment</Text>
              <Segmented
                options={PAYMENTS}
                value={payment}
                onChange={setPayment}
                layout="scroll"
                size="sm"
              />
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

      {/* ── Date Picker ── */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={[s.pickerOverlay, s.calOverlay]} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          {/* onStartShouldSetResponder blocks touch from bubbling to the overlay on native */}
          <View onStartShouldSetResponder={() => true} style={[s.calSheet, { backgroundColor: colors.surface, width: calWidth }, theme.shadowMd as any]}>
            {/* Month nav */}
            <View style={s.calHeader}>
              <TouchableOpacity
                onPress={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                style={[s.calNavBtn, { backgroundColor: colors.surfaceEl }]}
              >
                <Text style={{ color: colors.text, fontSize: 18, lineHeight: 20 }}>‹</Text>
              </TouchableOpacity>
              <Text style={[s.calMonthLabel, { color: colors.text }]}>{CAL_MONTHS[calMonth]} {calYear}</Text>
              <TouchableOpacity
                onPress={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                style={[s.calNavBtn, { backgroundColor: colors.surfaceEl }]}
              >
                <Text style={{ color: colors.text, fontSize: 18, lineHeight: 20 }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={s.calDayRow}>
              {CAL_DAYS.map(d => (
                <Text key={d} style={[s.calDayHeader, { color: colors.textMuted, width: cellSize }]}>{d}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={s.calGrid}>
              {Array.from({ length: calFirstDay(calYear, calMonth) }).map((_, i) => (
                <View key={`e${i}`} style={{ width: cellSize, height: cellSize }} />
              ))}
              {Array.from({ length: calDaysIn(calYear, calMonth) }, (_, i) => i + 1).map(day => {
                const iso = fmtDate(calYear, calMonth, day)
                const selected = nextDate === iso
                const today = fmtDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) === iso
                return (
                  <TouchableOpacity
                    key={day}
                    style={[{ width: cellSize, height: cellSize, alignItems: 'center', justifyContent: 'center' },
                      selected && { backgroundColor: colors.accent, borderRadius: theme.radiusMd }]}
                    onPress={() => { setNextDate(iso); setError(''); setShowDatePicker(false) }}
                  >
                    <Text style={[
                      s.calDayText,
                      { color: selected ? colors.accentFg : today ? colors.accent : colors.text },
                      today && !selected && { fontFamily: theme.fontBold },
                    ]}>{day}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Emoji Picker ── */}
      <Modal visible={showEmojiPicker} transparent animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setShowEmojiPicker(false)}>
          <View style={[s.pickerSheet, { backgroundColor: colors.surface }]}>
            <View style={[s.pickerHandle, { backgroundColor: colors.borderStrong }]} />
            <Text style={[s.pickerTitle, { color: colors.text }]}>Choose Icon</Text>

            <View style={s.catScroll}>
              <Segmented
                options={Object.keys(EMOJI_SETS)}
                value={emojiCategory}
                onChange={setEmojiCategory}
                layout="scroll"
                size="sm"
              />
            </View>

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
  dateTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  calSheet:      { borderRadius: theme.radiusXl, padding: theme.sp5, alignSelf: 'center' },
  calHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.sp3 },
  calMonthLabel: { fontSize: theme.textBase, fontFamily: theme.fontBold },
  calNavBtn:     { width: 30, height: 30, borderRadius: theme.radiusMd, alignItems: 'center', justifyContent: 'center' },
  calDayRow:     { flexDirection: 'row', marginBottom: 4 },
  calDayHeader:  { textAlign: 'center', fontSize: 10, fontFamily: theme.fontBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  calGrid:       { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:       { alignItems: 'center', justifyContent: 'center' },
  calDayText:    { fontSize: 13, fontFamily: theme.fontRegular },
  colorRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch:{ width: 28, height: 28, borderRadius: 8, borderWidth: 2 },

  emojiField: { width: 64 },
  emojiInput: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 0 },
  emojiText:  { fontSize: 22 },

  currencyWrap: { flex: 1 },
  currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  currencySymText: { fontSize: 17, fontFamily: theme.fontBold },

  errorText: { fontSize: 12, fontFamily: theme.fontMedium, marginBottom: 8, marginTop: 8 },
  actions: { flexDirection: 'row', gap: theme.sp3, marginTop: theme.sp6 },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  calOverlay:    { justifyContent: 'center', alignItems: 'center', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.25)' } as any : {}) },
  pickerSheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: theme.sp5, paddingBottom: 36 },
  pickerHandle:  { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: theme.sp4 },
  pickerTitle:   { fontSize: theme.textBase, fontFamily: theme.fontBold, marginBottom: theme.sp4, textAlign: 'center' },
  catScroll:     { marginBottom: theme.sp4 },
  emojiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp2, justifyContent: 'center' },
  emojiCell:     { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiCellText: { fontSize: 26 },
})
