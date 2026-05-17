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
  differenceInCalendarDays, getWeek, getDayOfYear,
} from 'date-fns'
import { useDataStore } from '../stores/data'
import { Modal } from '../components/ui/Modal'
import { IconButton } from '../components/ui/Button'
import { useTheme } from '../context/ThemeContext'
import { theme, Colors, CURRENCY_SYMBOL } from '../theme'
import { buildForecast } from '../utils/forecast'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// ── Day cell with hover + press scale ─────────────────────────────────
function DayCell({
  day, isCurrentMonth, isToday, isPast, isPinned, emojis, dotColors, hasActivity, monthTag, onPress, onHoverIn, onHoverOut, colors,
}: {
  day: Date
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  isPinned: boolean
  emojis: string[]
  dotColors: string[]
  hasActivity: boolean
  monthTag: string | null
  onPress: () => void
  onHoverIn?: () => void
  onHoverOut?: () => void
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
      onHoverIn={()  => { if (isWeb) { setHovered(true);  scale.value = withSpring(1.04, { damping: 22, stiffness: 360 }); onHoverIn?.() } }}
      onHoverOut={() => { if (isWeb) { setHovered(false); scale.value = withSpring(1, { damping: 22, stiffness: 360 }); onHoverOut?.() } }}
    >
      <Animated.View
        style={[
          cs.card,
          {
            backgroundColor: cellBg,
            borderColor: !isCurrentMonth ? 'transparent' : (isPinned ? colors.text : colors.border),
            borderWidth: isPinned ? 1.5 : StyleSheet.hairlineWidth,
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
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')

  // Day shown in the side panel: hover (preview) > selected (pinned) > today
  const panelDay = hoveredDay ?? selectedDay ?? todayStr
  const panelMode: 'today' | 'pinned' | 'preview' =
    hoveredDay ? 'preview' : (selectedDay && selectedDay !== todayStr ? 'pinned' : 'today')

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

  // Panel data (for the desktop side panel — uses panelDay)
  const panelEvents = useMemo(
    () => (store.events as any[]).filter(e => e.date === panelDay),
    [store.events, panelDay]
  )
  const panelSubs = useMemo(
    () => (store.subscriptions as any[]).filter(s => s.active !== false && s.nextChargeDate === panelDay),
    [store.subscriptions, panelDay]
  )
  const panelTotal = useMemo(
    () => panelSubs.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0),
    [panelSubs]
  )
  const panelCurrency = panelSubs[0]?.currency as string | undefined

  // Saldo previsional: forecast for next 30 days from today, cumulative total
  const forecastItems = useMemo(() =>
    (store.subscriptions as any[])
      .filter(s => s.active !== false && s.nextChargeDate)
      .map(s => ({
        name:           s.name,
        emoji:          s.emoji ?? '💳',
        price:          s.price ?? 0,
        billingCycle:   s.billingCycle ?? 'monthly',
        nextChargeDate: s.nextChargeDate,
        active:         true,
      })),
    [store.subscriptions]
  )

  const forecast30 = useMemo(() => buildForecast(forecastItems, 30), [forecastItems])

  // Days with charges in current month, not yet passed
  const forecastThisMonth = useMemo(() => {
    const monthStr = format(current, 'yyyy-MM')
    return forecast30.filter(d => d.total > 0 && d.date.startsWith(monthStr))
  }, [forecast30, current])

  const forecastMonthTotal = useMemo(
    () => forecastThisMonth.reduce((s, d) => s + d.total, 0),
    [forecastThisMonth]
  )

  const defaultCurrency = store.settings.defaultCurrency ?? 'EUR'
  const defaultSymbol   = CURRENCY_SYMBOL[defaultCurrency] ?? ''

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
    <View style={[cs.page, { backgroundColor: colors.bg }]}>
      {isDesktop && (
        <SidePanel
          colors={colors}
          panelDay={panelDay}
          panelMode={panelMode}
          events={panelEvents}
          subs={panelSubs}
          total={panelTotal}
          currency={panelCurrency}
          isPinned={selectedDay !== null && selectedDay !== todayStr}
          onUnpin={() => setSelectedDay(null)}
        />
      )}
      <ScrollView
        style={cs.page}
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
                isPinned={selectedDay === str}
                emojis={emojis}
                dotColors={info?.colors ?? []}
                hasActivity={hasActivity}
                monthTag={monthTag}
                onPress={() => setSelectedDay(prev => prev === str ? null : str)}
                onHoverIn={isDesktop ? () => setHoveredDay(str) : undefined}
                onHoverOut={isDesktop ? () => setHoveredDay(prev => prev === str ? null : prev) : undefined}
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
            // Payment status color: overdue = danger, today = warning, ≤3d = warning, future = muted
            const statusColor =
              item.kind !== 'charge' ? colors.textMuted :
              diff < 0              ? colors.danger  :
              diff === 0            ? colors.warning :
              diff <= 3             ? colors.warning :
              colors.textMuted
            return (
              <View key={i} style={cs.upRow}>
                <Text style={cs.upEmoji}>{item.emoji}</Text>
                <View style={cs.upBody}>
                  <Text style={[cs.upName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[cs.upMeta, { color: statusColor }]}>{format(dt, 'EEE · d MMM').toLowerCase()} · {when}</Text>
                </View>
                {item.kind === 'charge' && item.price != null ? (
                  <Text style={[cs.upPrice, { color: diff < 0 ? colors.danger : colors.text }]}>{symFor(item.currency)}{item.price.toFixed(2)}</Text>
                ) : (
                  <View style={[cs.upPill, { backgroundColor: colors.surfaceEl }]}>
                    <Text style={[cs.upPillText, { color: colors.textMuted }]}>event</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* Saldo previsional */}
        {forecastThisMonth.length > 0 && (
          <>
            <View style={[cs.rule, { backgroundColor: colors.border }]} />
            <View style={cs.section}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={[cs.sectionTag, { color: colors.textMuted }]}>saldo previsional</Text>
                <Text style={[cs.forecastTotal, { color: colors.text }]}>
                  {defaultSymbol}{forecastMonthTotal.toFixed(2)} comprometido
                </Text>
              </View>
              {forecastThisMonth.slice(0, 5).map(d => (
                <View key={d.date} style={cs.upRow}>
                  <Text style={cs.upEmoji}>{d.charges[0]?.emoji ?? '💳'}</Text>
                  <View style={cs.upBody}>
                    <Text style={[cs.upName, { color: colors.text }]} numberOfLines={1}>
                      {d.charges[0]?.name}{d.charges.length > 1 ? ` +${d.charges.length - 1}` : ''}
                    </Text>
                    <Text style={[cs.upMeta, { color: colors.textMuted }]}>
                      {format(parseISO(d.date), 'EEE · d MMM').toLowerCase()}
                    </Text>
                  </View>
                  <Text style={[cs.upPrice, { color: colors.text }]}>
                    {defaultSymbol}{d.total.toFixed(2)}
                  </Text>
                </View>
              ))}
              {forecastThisMonth.length > 5 && (
                <Text style={[cs.empty, { color: colors.textFaint }]}>
                  + {forecastThisMonth.length - 5} dias com cobranças
                </Text>
              )}
            </View>
          </>
        )}
      </View>

      <Modal
        open={!isDesktop && selectedDay !== null}
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
    </View>
  )
}

// ── Side panel (Cal.com-style summary, desktop only) ──────────────────
function SidePanel({
  colors, panelDay, panelMode, events, subs, total, currency, isPinned, onUnpin,
}: {
  colors: Colors
  panelDay: string
  panelMode: 'today' | 'pinned' | 'preview'
  events: any[]
  subs: any[]
  total: number
  currency?: string
  isPinned: boolean
  onUnpin: () => void
}) {
  const dt = parseISO(panelDay)
  const weekdayLabel = format(dt, 'EEEE')
  const monthDay     = format(dt, 'd MMM').toLowerCase()
  const yearLabel    = format(dt, 'yyyy')
  const monthFull    = format(dt, 'MMMM yyyy').toLowerCase()
  const week         = getWeek(dt)
  const doy          = getDayOfYear(dt)
  const kicker =
    panelMode === 'preview' ? 'previewing' :
    panelMode === 'pinned'  ? 'pinned day'  :
                              'today'
  const kickerDotColor =
    panelMode === 'preview' ? colors.textFaint :
    panelMode === 'pinned'  ? colors.accent    :
                              colors.success
  const headerEmoji =
    panelMode === 'preview' ? '👀' :
    panelMode === 'pinned'  ? '📌' :
                              '✨'
  const isEmpty = events.length === 0 && subs.length === 0
  const totalLabel = total > 0 ? `${symFor(currency)}${total.toFixed(2)}` : '—'
  const itemCount = subs.length + events.length

  return (
    <View style={sp.root} pointerEvents="box-none">
      <View style={[sp.card, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
        {/* Kicker row */}
        <View style={sp.kickerRow}>
          <View style={[sp.kickerDot, { backgroundColor: kickerDotColor }]} />
          <Text style={[sp.kicker, { color: colors.textMuted }]}>{kicker}</Text>
        </View>

        {/* Title with emoji prefix (Cal.com style: bold heading + meta line) */}
        <Text style={[sp.title, { color: colors.text }]}>
          {headerEmoji}  {weekdayLabel},{'\n'}{monthDay} {yearLabel}
        </Text>

        {/* Meta subtitle with extra context */}
        <View style={sp.metaRow}>
          <Text style={[sp.metaTag, { color: colors.textMuted, backgroundColor: colors.surfaceEl, borderColor: colors.border }]}>
            week {week}
          </Text>
          <Text style={[sp.metaTag, { color: colors.textMuted, backgroundColor: colors.surfaceEl, borderColor: colors.border }]}>
            day {doy}/365
          </Text>
        </View>

        {/* Body — Cal.com style description text with emoji + bold */}
        <View style={[sp.bodyDivider, { backgroundColor: colors.border }]} />
        <ScrollView style={sp.body} contentContainerStyle={sp.bodyContent} showsVerticalScrollIndicator={false}>
          {isEmpty ? (
            <View style={sp.list}>
              <Text style={[sp.summary, { color: colors.text }]}>
                🌿  <Text style={sp.bold}>Nothing tracking today.</Text> No charges, no events — your wallet and calendar both get a breather.
              </Text>
              <Text style={[sp.summary, { color: colors.text }]}>
                ☕  Use the quiet to plan ahead. Browse what's coming this month, set a new subscription to track, or just close the tab and enjoy the day.
              </Text>
              <Text style={[sp.summary, { color: colors.text }]}>
                ✨  Quiet days are still data — they tell you when life slows down. Track wisely, rest well.
              </Text>
            </View>
          ) : (
            <View style={sp.list}>
              {/* Summary paragraph */}
              <Text style={[sp.summary, { color: colors.text }]}>
                💬  You have <Text style={sp.bold}>{itemCount} {itemCount === 1 ? 'thing' : 'things'}</Text> on this day
                {total > 0 ? <> totalling <Text style={sp.bold}>{symFor(currency)}{total.toFixed(2)}</Text>.</> : '.'}{' '}
                Here's the breakdown — a quick look at what's coming up so nothing slips through the cracks. 🧭
              </Text>

              {/* Subscriptions with descriptive prose */}
              {subs.map((s: any) => (
                <Text key={`s-${s.id}`} style={[sp.line, { color: colors.text }]}>
                  {s.emoji ?? '💳'}  <Text style={sp.bold}>{s.name}</Text> will charge <Text style={sp.bold}>{symFor(s.currency)}{Number(s.price ?? 0).toFixed(2)}</Text> today. Auto-renewal is on — make sure the card on file is still valid. 💳
                </Text>
              ))}

              {/* Events with descriptive prose */}
              {events.map((e: any) => (
                <Text key={`e-${e.id}`} style={[sp.line, { color: colors.text }]}>
                  {e.emoji ?? '📅'}  <Text style={sp.bold}>{e.name}</Text> is on the books for today. Add a reminder if you need a nudge — it's the small things that compound. ✨
                </Text>
              ))}

              {/* Closing wisdom line */}
              <Text style={[sp.summary, { color: colors.text, marginTop: 4 }]}>
                <Text style={sp.bold}>Track wisely</Text> — small habits become freedom. Every charge logged, every event noted, brings clarity to where your time and money actually go. 🚀
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer — Cal.com style icon rows */}
        <View style={[sp.bodyDivider, { backgroundColor: colors.border }]} />
        <View style={sp.footer}>
          <View style={sp.footerRow}>
            <Text style={sp.footerEmoji}>🕐</Text>
            <Text style={[sp.footerLabel, { color: colors.text }]}>{subs.length} {subs.length === 1 ? 'charge' : 'charges'}</Text>
          </View>
          <View style={sp.footerRow}>
            <Text style={sp.footerEmoji}>📅</Text>
            <Text style={[sp.footerLabel, { color: colors.text }]}>{events.length} {events.length === 1 ? 'event' : 'events'}</Text>
          </View>
          <View style={sp.footerRow}>
            <Text style={sp.footerEmoji}>💳</Text>
            <Text style={[sp.footerLabel, { color: colors.text }]}>{totalLabel}</Text>
          </View>
          <View style={sp.footerRow}>
            <Text style={sp.footerEmoji}>🌍</Text>
            <Text style={[sp.footerLabel, { color: colors.text }]}>{monthFull}</Text>
          </View>
        </View>

        {isPinned && (
          <Pressable onPress={onUnpin} style={({ hovered }: any) => [sp.unpin, { backgroundColor: hovered && Platform.OS === 'web' ? colors.surfaceEl : 'transparent', borderColor: colors.border }]}>
            <Ionicons name="arrow-back-outline" size={13} color={colors.textMuted} />
            <Text style={[sp.unpinLabel, { color: colors.textMuted }]}>back to today</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

// ── Nav button (chevron) — Button DNA via IconButton ──────────────────
function NavBtn({ icon, onPress, colors }: { icon: any; onPress: () => void; colors: Colors }) {
  return (
    <IconButton variant="surface" size="sm" onPress={onPress} accessibilityLabel={String(icon)}>
      <Ionicons name={icon} size={16} color={colors.text} />
    </IconButton>
  )
}

const symFor = (c?: string) => {
  if (!c) return ''
  const map: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', BRL: 'R$' }
  return map[c] ?? c + ' '
}

const cs = StyleSheet.create({
  page:           { flex: 1 },
  scroll:         { padding: theme.sp4, gap: theme.sp4, paddingBottom: 130 },
  scrollDesktop:  { paddingVertical: 56, paddingLeft: 420, paddingRight: 32, alignItems: 'center' },

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
  upPillText:    { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 0.6 },
  forecastTotal: { fontSize: 12, fontFamily: theme.fontMonoBold, letterSpacing: -0.3 },

  dayEmpty: { fontSize: theme.textSm, paddingVertical: theme.sp2, fontFamily: theme.fontRegular },
  dayRow:   { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  dayEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  dayName:  { fontSize: 14, fontFamily: theme.fontBold, flex: 1, letterSpacing: -0.2 },
  dayPrice: { fontSize: 14, fontFamily: theme.fontMono, letterSpacing: -0.3 },
  dayPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  dayPillText: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 0.6 },
})

const sp = StyleSheet.create({
  root: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 56,
        left: 280,
        bottom: 56,
        width: 360,
        zIndex: 5,
      },
      default: { width: 360 },
    }),
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },

  kickerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  kickerDot:  { width: 8, height: 8, borderRadius: 4 },
  kicker:     { fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: 0.2, textTransform: 'lowercase' },

  title:      { fontSize: 26, fontFamily: theme.fontBold, letterSpacing: -0.8, lineHeight: 32, textTransform: 'capitalize' },

  metaRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 12 },
  metaTag:    { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 0.6, textTransform: 'lowercase', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },

  bodyDivider:{ height: StyleSheet.hairlineWidth, width: '100%', marginVertical: 16 },
  body:       { flex: 1 },
  bodyContent:{ paddingBottom: 4, gap: 12 },

  emptyBox:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 6 },
  emptyEmoji: { fontSize: 32 },
  empty:      { fontSize: 14, fontFamily: theme.fontBold, letterSpacing: -0.2 },
  emptySub:   { fontSize: 12, fontFamily: theme.fontMedium, letterSpacing: 0.1 },

  list:       { gap: 14 },
  summary:    { fontSize: 14, fontFamily: theme.fontRegular, lineHeight: 22, letterSpacing: -0.1 },
  line:       { fontSize: 14, fontFamily: theme.fontRegular, lineHeight: 22, letterSpacing: -0.1 },
  bold:       { fontFamily: theme.fontBold },

  footer:     { gap: 10, marginTop: 4 },
  footerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerEmoji:{ fontSize: 14, width: 18, textAlign: 'center' },
  footerLabel:{ fontSize: 13, fontFamily: theme.fontMedium, letterSpacing: -0.1 },

  unpin:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, marginTop: 16 },
  unpinLabel: { fontSize: 11, fontFamily: theme.fontMedium, letterSpacing: 0.2 },
})
