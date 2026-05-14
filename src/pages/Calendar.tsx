import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  parseISO,
} from 'date-fns'
import { useDataStore } from '../stores/data'
import { Modal } from '../components/ui/Modal'
import { useTheme } from '../context/ThemeContext'
import { theme } from '../theme'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function Calendar() {
  const { colors } = useTheme()
  const store = useDataStore()
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const label = format(current, 'MMMM yyyy')
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) }),
    [current]
  )
  const padCount = useMemo(() => {
    const dow = getDay(days[0])
    return dow === 0 ? 6 : dow - 1
  }, [days])

  const eventDates = useMemo(
    () => new Set(store.events.map((e: any) => e.date)),
    [store.events]
  )
  const subDates = useMemo(
    () => new Set(store.subscriptions.filter((s: any) => s.active !== false).map((s: any) => s.nextChargeDate)),
    [store.subscriptions]
  )
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const upcoming = useMemo(
    () =>
      store.events
        .filter((e: any) => e.date?.startsWith(format(current, 'yyyy-MM')))
        .sort((a: any, b: any) => a.date.localeCompare(b.date)),
    [store.events, current]
  )

  const dayEvents = useMemo(
    () => (selectedDay ? store.events.filter((e: any) => e.date === selectedDay) : []),
    [store.events, selectedDay]
  )
  const daySubs = useMemo(
    () => (selectedDay ? store.subscriptions.filter((s: any) => s.active !== false && s.nextChargeDate === selectedDay) : []),
    [store.subscriptions, selectedDay]
  )

  function prev() { setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function next() { setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  const CELL_W = `${100 / 7}%` as any

  return (
    <ScrollView
      style={[s.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.text }]}>Calendar</Text>

      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.calHeader}>
          <TouchableOpacity
            style={[s.navBtn, { backgroundColor: colors.surfaceEl }]}
            onPress={prev}
            accessibilityLabel="Previous month"
          >
            <Text style={[s.navText, { color: colors.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.monthLabel, { color: colors.text }]}>{label}</Text>
          <TouchableOpacity
            style={[s.navBtn, { backgroundColor: colors.surfaceEl }]}
            onPress={next}
            accessibilityLabel="Next month"
          >
            <Text style={[s.navText, { color: colors.text }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.calGrid}>
          {WEEKDAYS.map(d => (
            <View key={d} style={[s.cell, { width: CELL_W }]}>
              <Text style={[s.weekday, { color: colors.textMuted }]}>{d}</Text>
            </View>
          ))}

          {Array(padCount).fill(null).map((_, i) => (
            <View key={`pad-${i}`} style={{ width: CELL_W }} />
          ))}

          {days.map(day => {
            const str = format(day, 'yyyy-MM-dd')
            const isToday = str === todayStr
            const hasEv = eventDates.has(str)
            const hasSub = subDates.has(str)
            return (
              <TouchableOpacity
                key={str}
                style={[s.dayCell, { width: CELL_W }]}
                onPress={() => setSelectedDay(str)}
              >
                <View style={[s.dayNum, isToday && { backgroundColor: colors.accent }]}>
                  <Text style={[s.dayNumText, { color: isToday ? colors.accentFg : colors.text }]}>
                    {format(day, 'd')}
                  </Text>
                </View>
                <View style={s.dayDots}>
                  {hasEv && <View style={[s.dayDot, { backgroundColor: colors.accent }]} />}
                  {hasSub && <View style={[s.dayDot, { backgroundColor: colors.textMuted }]} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {upcoming.length > 0 ? (
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          <View style={s.sectionRow}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>This month</Text>
            <View style={[s.countBadge, { backgroundColor: colors.accent }]}>
              <Text style={[s.countText, { color: colors.accentFg }]}>{upcoming.length}</Text>
            </View>
          </View>
          {upcoming.map((ev: any) => (
            <View key={ev.id} style={[s.eventItem, { borderBottomColor: colors.border }]}>
              <Text style={[s.eventDate, { color: colors.textMuted }]}>{format(parseISO(ev.date), 'd MMM')}</Text>
              <Text style={[s.eventName, { color: colors.text }]}>{ev.emoji ?? '•'} {ev.name}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={[s.card, s.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No events this month</Text>
        </View>
      )}

      <Modal
        open={selectedDay !== null}
        title={selectedDay ? format(parseISO(selectedDay), 'EEEE, d MMMM') : ''}
        onClose={() => setSelectedDay(null)}
      >
        {selectedDay && (
          <View>
            {dayEvents.length === 0 && daySubs.length === 0 && (
              <Text style={[s.dayEmpty, { color: colors.textMuted }]}>Nothing on this day</Text>
            )}
            {dayEvents.map((ev: any) => (
              <View key={ev.id} style={[s.dayRow, { borderBottomColor: colors.border }]}>
                <View style={[s.dayTag, { backgroundColor: colors.accent }]}>
                  <Text style={[s.dayTagText, { color: colors.accentFg }]}>Event</Text>
                </View>
                <Text style={[s.dayName, { color: colors.text }]}>{ev.emoji ?? '📅'} {ev.name}</Text>
              </View>
            ))}
            {daySubs.map((sub: any) => (
              <View key={sub.id} style={[s.dayRow, { borderBottomColor: colors.border }]}>
                <View style={[s.dayTag, { backgroundColor: colors.surfaceEl }]}>
                  <Text style={[s.dayTagText, { color: colors.textMuted }]}>Charge</Text>
                </View>
                <Text style={[s.dayName, { color: colors.text }]}>{sub.emoji ?? '💳'} {sub.name} — {sub.currency} {sub.price}</Text>
              </View>
            ))}
          </View>
        )}
      </Modal>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp4, paddingBottom: 110 },

  pageTitle: {
    fontSize: 34,
    fontFamily: theme.fontBlack,
    letterSpacing: -1,
    marginBottom: theme.sp4,
  },

  card: {
    borderRadius: theme.radiusXl,
    padding: theme.sp5,
    ...theme.shadow,
  },

  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.sp5 },
  monthLabel: { fontSize: theme.textLg, fontFamily: theme.fontBold },
  navBtn: { padding: theme.sp2, borderRadius: theme.radiusFull },
  navText: { fontSize: 22, fontFamily: theme.fontBold },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', paddingBottom: theme.sp2 },
  weekday: { fontSize: theme.textXs, fontFamily: theme.fontMedium },

  dayCell: { alignItems: 'center', paddingVertical: theme.sp2, minHeight: 38 },
  dayNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dayNumText: { fontSize: theme.textXs, fontFamily: theme.fontMedium },
  dayDots: { flexDirection: 'row', gap: 2, minHeight: 6 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: theme.sp2, marginBottom: theme.sp4 },
  sectionTitle: { fontSize: theme.textSm, fontFamily: theme.fontBold },
  countBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: theme.textXs, fontFamily: theme.fontBold },

  eventItem: {
    flexDirection: 'row',
    gap: theme.sp4,
    alignItems: 'center',
    paddingVertical: theme.sp2,
    borderBottomWidth: 1,
  },
  eventDate: { fontSize: theme.textXs, width: 40, fontFamily: theme.fontRegular },
  eventName: { fontSize: theme.textSm, fontFamily: theme.fontMedium },

  dayEmpty: { fontSize: theme.textSm, paddingVertical: theme.sp2, fontFamily: theme.fontRegular },
  emptyCard: { alignItems: 'center', padding: theme.sp8 },
  emptyText: { fontSize: theme.textSm, fontFamily: theme.fontRegular },
  dayRow: {
    flexDirection: 'row',
    gap: theme.sp3,
    alignItems: 'center',
    paddingVertical: theme.sp3,
    borderBottomWidth: 1,
  },
  dayTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayTagText: { fontSize: theme.textXs, fontFamily: theme.fontBold, textTransform: 'uppercase' },
  dayName: { fontSize: theme.textSm, fontFamily: theme.fontMedium, flex: 1 },
})
