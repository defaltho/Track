import React, { useState, useMemo } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  Platform, useWindowDimensions, Pressable,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  parseISO, isBefore, isSameMonth, isSameDay, startOfDay, addMonths, subMonths,
  differenceInCalendarDays,
} from 'date-fns'
import { useDataStore } from '../stores/data'
import { Modal } from '../components/ui/Modal'
import { useTheme } from '../context/ThemeContext'
import { theme, Colors } from '../theme'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// ── Day cell with hover + press scale ─────────────────────────────────
function DayCell({
  day, isCurrentMonth, isToday, isPast, emojis, dotColors, hasActivity, monthTag, onPress, colors,
}: {
  day: Date
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  emojis: string[]
  dotColors: string[]
  hasActivity: boolean
  monthTag: string | null
  onPress: () => void
  colors: Colors
}) {
  const scale = useSharedValue(1)
  const [hovered, setHovered] = useState(false)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isWeb = Platform.OS === 'web'

  // Tone: out-of-month is the dimmest, past is dim, current is normal
  const cellBg =
    !isCurrentMonth ? 'transparent' :
    isPast ? colors.surfaceEl :
    colors.surfaceEl
  const numColor =
    isToday ? colors.text :
    !isCurrentMonth ? colors.textFaint :
    isPast ? colors.textMuted :
    colors.text
  const numWeight = isToday ? 'Roboto_700Bold' : 'Roboto_500Medium'

  return (
    <Pressable
      style={cs.cellSlot}
      onPress={onPress}
      onPressIn={()  => { scale.value = withSpring(0.94, { damping: 18, stiffness: 420 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 420 }) }}
      onHoverIn={()  => { if (isWeb) { setHovered(true);  scale.value = withSpring(1.04, { damping: 22, stiffness: 360 }) } }}
      onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }) } }}
    >
      <Animated.View
        style={[
          cs.card,
          {
            backgroundColor: cellBg,
            borderColor: !isCurrentMonth ? 'transparent' : colors.border,
            opacity: !isCurrentMonth ? 0.45 : 1,
          },
          hovered && isWeb && isCurrentMonth && { backgroundColor: colors.surfaceHigh },
          animStyle,
        ]}
      >
        {/* Top-right activity dot */}
        {hasActivity && (
          <View style={[cs.topDot, { backgroundColor: dotColors[0] || colors.accent }]} />
        )}

        {/* Month tag (when foreign month's day = 1) */}
        {monthTag ? <Text style={[cs.monthTag, { color: colors.textFaint }]}>{monthTag}</Text> : null}

        {/* Center icon — first emoji of the day */}
        <View style={cs.cellCenter}>
          {emojis.length > 0 ? <Text style={cs.centerEmoji}>{emojis[0]}</Text> : null}
        </View>

        {/* Number bottom */}
        <Text style={[cs.cardNum, { color: numColor, fontFamily: numWeight }]}>
          {format(day, 'd')}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function Calendar() {
  const { colors } = useTheme()
  const store = useDataStore()
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= 768

  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')

  // 7-column grid covering the full visible weeks (week starts Monday)
  const grid = useMemo(() => {
    const monthStart = startOfMonth(current)
    const monthEnd   = endOfMonth(current)
    const lead       = (getDay(monthStart) + 6) % 7  // Mon = 0, Sun = 6
    const monthDays  = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const total      = lead + monthDays.length
    const trail      = (7 - (total % 7)) % 7

    const cells: Date[] = []
    for (let i = lead; i > 0; i--) {
      const d = new Date(monthStart); d.setDate(d.getDate() - i)
      cells.push(d)
    }
    cells.push(...monthDays)
    for (let i = 1; i <= trail; i++) {
      const d = new Date(monthEnd); d.setDate(d.getDate() + i)
      cells.push(d)
    }
    return cells
  }, [current])

  // Emojis + colors + activity per day
  const dayInfo = useMemo(() => {
    const map = new Map<string, { emojis: string[]; colors: string[]; hasActivity: boolean }>()
    function push(date: string, emoji?: string, color?: string) {
      const cur = map.get(date) ?? { emojis: [], colors: [], hasActivity: false }
      cur.hasActivity = true
      if (emoji) cur.emojis.push(emoji)
      if (color) cur.colors.push(color)
      map.set(date, cur)
    }
    for (const e of store.events as any[]) if (e.date) push(e.date, e.emoji, e.color)
    for (const s of store.subscriptions as any[]) {
      if (s.active === false || !s.nextChargeDate) continue
      push(s.nextChargeDate, s.emoji, s.color)
    }
    return map
  }, [store.events, store.subscriptions])

  const dayEvents = useMemo(
    () => (selectedDay ? (store.events as any[]).filter(e => e.date === selectedDay) : []),
    [store.events, selectedDay]
  )
  const daySubs = useMemo(
    () => (selectedDay ? (store.subscriptions as any[]).filter(s => s.active !== false && s.nextChargeDate === selectedDay) : []),
    [store.subscriptions, selectedDay]
  )

  function prev() { setCurrent(d => subMonths(d, 1)) }
  function next() { setCurrent(d => addMonths(d, 1)) }
  function jumpToday() { setCurrent(new Date()) }

  const monthLabel = format(current, 'MMMM')
  const yearLabel  = format(current, 'yyyy')

  // Build "this month" upcoming list (events + sub charges in current month, future-only)
  const upcoming = useMemo(() => {
    const out: { date: string; name: string; emoji: string; kind: 'event' | 'charge'; price?: number; currency?: string }[] = []
    for (const e of store.events as any[]) {
      if (!e.date) continue
      if (!isSameMonth(parseISO(e.date), current)) continue
      out.push({ date: e.date, name: e.name, emoji: e.emoji ?? '📅', kind: 'event' })
    }
    for (const s of store.subscriptions as any[]) {
      if (s.active === false || !s.nextChargeDate) continue
      if (!isSameMonth(parseISO(s.nextChargeDate), current)) continue
      out.push({ date: s.nextChargeDate, name: s.name, emoji: s.emoji ?? '💳', kind: 'charge', price: s.price, currency: s.currency })
    }
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }, [store.events, store.subscriptions, current])

  return (
    <ScrollView
      style={[cs.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={[cs.scroll, isDesktop && cs.scrollDesktop]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[cs.container, isDesktop && cs.containerDesktop]}>
        {/* Header */}
        <View style={cs.header}>
          <View style={{ flex: 1 }}>
            <View style={cs.titleRow}>
              <Text style={[cs.title, { color: colors.text }]}>{monthLabel}</Text>
              <Text style={[cs.year, { color: colors.textMuted }]}>{yearLabel}</Text>
            </View>
            <Pressable onPress={jumpToday} hitSlop={6}>
              <Text style={[cs.todayLink, { color: colors.textMuted }]}>↺ today</Text>
            </Pressable>
          </View>
          <View style={cs.navRow}>
            <NavBtn onPress={prev} icon="chevron-back"    colors={colors} />
            <NavBtn onPress={next} icon="chevron-forward" colors={colors} />
          </View>
        </View>

        {/* Weekday row — pill style, today's weekday highlighted */}
        <View style={cs.weekRow}>
          {WEEKDAYS.map(w => {
            const todayDow = format(today, 'EEE').toUpperCase().slice(0, 3)
            const active = w === todayDow
            return (
              <View key={w} style={cs.weekCell}>
                <View style={[cs.weekPill, { backgroundColor: active ? colors.surface : colors.surfaceEl, borderColor: colors.border }]}>
                  <Text style={[cs.weekText, { color: active ? colors.text : colors.textMuted, fontFamily: active ? 'Roboto_700Bold' : 'Roboto_500Medium' }]}>{w}</Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Grid */}
        <View style={cs.grid}>
          {grid.map((day, i) => {
            const str = format(day, 'yyyy-MM-dd')
            const isCurrentMonth = isSameMonth(day, current)
            const isToday = isSameDay(day, today)
            const isPast  = isBefore(day, today) && !isToday
            const info    = dayInfo.get(str)
            const emojis  = info?.emojis ?? []
            const hasActivity = !!info?.hasActivity
            const isFirstOfMonth = day.getDate() === 1 && !isCurrentMonth
            const monthTag = isFirstOfMonth ? format(day, 'MMM').toUpperCase() : null

            return (
              <DayCell
                key={i}
                day={day}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isPast={isPast}
                emojis={emojis}
                dotColors={info?.colors ?? []}
                hasActivity={hasActivity}
                monthTag={monthTag}
                onPress={() => setSelectedDay(str)}
                colors={colors}
              />
            )
          })}
        </View>

        {/* This month list */}
        <View style={[cs.rule, { backgroundColor: colors.border }]} />
        <View style={cs.section}>
          <Text style={[cs.sectionTag, { color: colors.textMuted }]}>this month</Text>
          {upcoming.length === 0 ? (
            <Text style={[cs.empty, { color: colors.textFaint }]}>nothing scheduled in {monthLabel.toLowerCase()}</Text>
          ) : upcoming.map((item, i) => {
            const dt   = parseISO(item.date)
            const diff = differenceInCalendarDays(dt, today)
            const when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : diff > 0 ? `in ${diff}d` : `${Math.abs(diff)}d ago`
            return (
              <View key={i} style={cs.upRow}>
                <Text style={cs.upEmoji}>{item.emoji}</Text>
                <View style={cs.upBody}>
                  <Text style={[cs.upName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[cs.upMeta, { color: colors.textMuted }]}>{format(dt, 'EEE · d MMM').toLowerCase()} · {when}</Text>
                </View>
                {item.kind === 'charge' && item.price != null ? (
                  <Text style={[cs.upPrice, { color: colors.text }]}>{symFor(item.currency)}{item.price.toFixed(2)}</Text>
                ) : (
                  <View style={[cs.upPill, { backgroundColor: colors.surfaceEl }]}>
                    <Text style={[cs.upPillText, { color: colors.textMuted }]}>event</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </View>

      <Modal
        open={selectedDay !== null}
        title={selectedDay ? format(parseISO(selectedDay), 'EEEE, d MMMM') : ''}
        onClose={() => setSelectedDay(null)}
      >
        {selectedDay && (
          <View>
            {dayEvents.length === 0 && daySubs.length === 0 && (
              <Text style={[cs.dayEmpty, { color: colors.textMuted }]}>Nothing on this day</Text>
            )}
            {dayEvents.map((ev: any) => (
              <View key={ev.id} style={[cs.dayRow, { borderBottomColor: colors.border }]}>
                <Text style={cs.dayEmoji}>{ev.emoji ?? '📅'}</Text>
                <Text style={[cs.dayName, { color: colors.text }]}>{ev.name}</Text>
                <View style={[cs.dayPill, { backgroundColor: colors.surfaceEl }]}>
                  <Text style={[cs.dayPillText, { color: colors.textMuted }]}>event</Text>
                </View>
              </View>
            ))}
            {daySubs.map((sub: any) => (
              <View key={sub.id} style={[cs.dayRow, { borderBottomColor: colors.border }]}>
                <Text style={cs.dayEmoji}>{sub.emoji ?? '💳'}</Text>
                <Text style={[cs.dayName, { color: colors.text }]}>{sub.name}</Text>
                <Text style={[cs.dayPrice, { color: colors.text }]}>{symFor(sub.currency)}{sub.price?.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </Modal>
    </ScrollView>
  )
}

// ── Nav button (chevron with hover) ───────────────────────────────────
function NavBtn({ icon, onPress, colors }: { icon: any; onPress: () => void; colors: Colors }) {
  const scale = useSharedValue(1)
  const [hovered, setHovered] = useState(false)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const isWeb = Platform.OS === 'web'
  return (
    <Pressable
      onPress={onPress}
      onPressIn={()  => { scale.value = withSpring(0.94, { damping: 18, stiffness: 420 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 18, stiffness: 420 }) }}
      onHoverIn={()  => { if (isWeb) { setHovered(true);  scale.value = withSpring(1.06, { damping: 22, stiffness: 360 }) } }}
      onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }) } }}
    >
      <Animated.View style={[
        cs.navBtn,
        { borderColor: colors.border, backgroundColor: hovered && isWeb ? colors.surfaceEl : 'transparent' },
        animStyle,
      ]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </Animated.View>
    </Pressable>
  )
}

const symFor = (c?: string) => {
  if (!c) return ''
  const map: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', BRL: 'R$' }
  return map[c] ?? c + ' '
}

const cs = StyleSheet.create({
  page:           { flex: 1 },
  scroll:         { padding: theme.sp4, gap: theme.sp4, paddingBottom: 110 },
  scrollDesktop:  { paddingVertical: 56, paddingHorizontal: 32, alignItems: 'center' },
  container:      { width: '100%', gap: 24 },
  containerDesktop:{ maxWidth: 760 },

  header: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.sp4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  title:   { fontSize: 36, fontFamily: theme.fontBlack, letterSpacing: -1.4, textTransform: 'capitalize' },
  year:    { fontSize: 16, fontFamily: theme.fontMono, letterSpacing: -0.2 },
  todayLink:{ fontSize: 11, fontFamily: theme.fontMono, marginTop: 4 },
  navRow:  { flexDirection: 'row', gap: 8 },
  navBtn:  { width: 34, height: 34, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },

  weekRow:  { flexDirection: 'row', gap: 4, paddingBottom: 6 },
  weekCell: { flex: 1, alignItems: 'stretch' },
  weekPill: { paddingVertical: 6, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  weekText: { fontSize: 10, letterSpacing: 1.4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cellSlot: {
    width: `${(100 - 6) / 7}%`,  // compensate the 4px gap × 6 internal gaps
    aspectRatio: 1,
    marginBottom: 4,
  },
  monthTag: { fontSize: 8, fontFamily: theme.fontMedium, letterSpacing: 1.0, position: 'absolute', top: 6, left: 6 },

  card: {
    width: '100%', height: '100%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 6,
    position: 'relative',
  },
  cellCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerEmoji: { fontSize: 22, lineHeight: 26 },
  cardNum: {
    fontSize: 13,
    fontFamily: theme.fontMono,
    letterSpacing: -0.4,
    textAlign: 'left',
    paddingLeft: 2,
  },
  topDot: {
    position: 'absolute',
    top: 6, right: 6,
    width: 6, height: 6, borderRadius: 3,
  },

  rule:    { height: StyleSheet.hairlineWidth, width: '100%' },
  section: { gap: 12 },
  sectionTag:{ fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },
  empty:   { fontSize: 13, fontFamily: theme.fontMono, fontStyle: 'italic', paddingVertical: 12 },

  upRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  upEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  upBody:  { flex: 1, minWidth: 0, gap: 2 },
  upName:  { fontSize: 14, fontFamily: theme.fontBold, letterSpacing: -0.2 },
  upMeta:  { fontSize: 11, fontFamily: theme.fontMono, letterSpacing: 0.1 },
  upPrice: { fontSize: 14, fontFamily: theme.fontMono, letterSpacing: -0.3 },
  upPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  upPillText: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 0.6 },

  dayEmpty: { fontSize: theme.textSm, paddingVertical: theme.sp2, fontFamily: theme.fontRegular },
  dayRow:   { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  dayEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  dayName:  { fontSize: 14, fontFamily: theme.fontBold, flex: 1, letterSpacing: -0.2 },
  dayPrice: { fontSize: 14, fontFamily: theme.fontMono, letterSpacing: -0.3 },
  dayPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  dayPillText: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 0.6 },
})
