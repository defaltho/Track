import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import { Widget } from '../ui/Widget'
import { useDataStore, type Habit } from '../../stores/data'

interface Props {
  habits: Habit[]
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function lastNDays(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function currentStreak(checkins: string[]): number {
  if (checkins.length === 0) return 0
  const set = new Set(checkins)
  let streak = 0
  const d = new Date()
  // If today not checked, streak starts from yesterday (so streak doesn't reset every morning)
  if (!set.has(d.toISOString().slice(0, 10))) {
    d.setDate(d.getDate() - 1)
  }
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function HabitStreakWidget({ habits }: Props) {
  const { colors } = useTheme()
  const toggle = useDataStore(s => s.toggleHabitCheckin)
  const today = todayISO()
  const days = useMemo(() => lastNDays(7), [])

  const active = habits.filter(h => h.active !== false)

  if (active.length === 0) {
    return (
      <Widget tag="habits" size="rectangle">
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: colors.textFaint }]}>
            No habits yet — add one from the + button
          </Text>
        </View>
      </Widget>
    )
  }

  // Show top 3 habits (by recent activity = checkins count last 7 days)
  const scored = active.map(h => {
    const recentCount = days.filter(d => h.checkins.includes(d)).length
    return { habit: h, recentCount, streak: currentStreak(h.checkins) }
  }).sort((a, b) => b.streak - a.streak || b.recentCount - a.recentCount)

  const top = scored.slice(0, 3)

  return (
    <Widget tag="habits" size="rectangle">
      <View style={s.list}>
        {top.map(({ habit, streak }) => (
          <View key={habit.id} style={s.row}>
            <Text style={s.icon}>{habit.emoji || '🎯'}</Text>
            <View style={s.middle}>
              <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
              <Text style={[s.streak, { color: colors.textMuted }]}>
                {streak > 0 ? `🔥 ${streak}-day streak` : 'Start your streak'}
              </Text>
            </View>
            <View style={s.dots}>
              {days.map(d => {
                const done = habit.checkins.includes(d)
                const isToday = d === today
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={isToday ? () => toggle(habit.id, d) : undefined}
                    disabled={!isToday}
                    style={[
                      s.dot,
                      {
                        backgroundColor: done ? colors.success : colors.surfaceEl,
                        borderColor: isToday ? colors.accent : colors.border,
                        borderWidth: isToday ? 2 : 1,
                      },
                    ]}
                    accessibilityLabel={`${habit.name} ${d} ${done ? 'done' : 'not done'}`}
                  />
                )
              })}
            </View>
          </View>
        ))}
        {active.length > 3 && (
          <Text style={[s.more, { color: colors.textFaint }]}>+{active.length - 3} more</Text>
        )}
      </View>
    </Widget>
  )
}

const s = StyleSheet.create({
  list: { flex: 1, justifyContent: 'space-around', paddingVertical: theme.sp1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.sp3 },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
  middle: { flex: 1 },
  name: { fontSize: theme.textSm, fontFamily: theme.fontMedium },
  streak: { fontSize: theme.textXs, fontFamily: theme.fontRegular, marginTop: 2 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  more: { fontSize: theme.textXs, fontFamily: theme.fontRegular, textAlign: 'center', marginTop: theme.sp2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.sp4 },
  emptyText: { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center' },
})
