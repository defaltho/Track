import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../context/ThemeContext'
import { useDataStore } from '../stores/data'
import { theme } from '../theme'

interface TrackerCard {
  key: string
  label: string
  emoji: string
  count: number
  sub: string
  accent: string
  route: string
}

export default function Trackers() {
  const { colors } = useTheme()
  const store  = useDataStore()
  const router = useRouter()

  const cards: TrackerCard[] = [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      emoji: '💳',
      count: store.subscriptions.filter(s => s.active !== false).length,
      sub: `${store.subscriptions.length} total`,
      accent: '#0EA5E9',
      route: '/',
    },
    {
      key: 'apps',
      label: 'One-time Apps',
      emoji: '📱',
      count: store.apps.filter(a => a.active !== false).length,
      sub: `${store.apps.length} total`,
      accent: '#6366F1',
      route: '/',
    },
    {
      key: 'events',
      label: 'Events',
      emoji: '📅',
      count: store.events.length,
      sub: 'upcoming',
      accent: '#F59E0B',
      route: '/calendar',
    },
    {
      key: 'tasks',
      label: 'Tasks',
      emoji: '✅',
      count: store.tasks.filter(t => !t.done).length,
      sub: `${store.tasks.filter(t => t.done).length} done`,
      accent: '#22C55E',
      route: '/',
    },
    {
      key: 'habits',
      label: 'Habits',
      emoji: '🔥',
      count: (store.habits ?? []).filter(h => h.active !== false).length,
      sub: `${(store.habits ?? []).length} total`,
      accent: '#EC4899',
      route: '/',
    },
  ]

  const totalActive = cards.reduce((s, c) => s + c.count, 0)

  return (
    <ScrollView
      style={[t.root, { backgroundColor: colors.bg }]}
      contentContainerStyle={t.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={t.header}>
        <Text style={[t.title, { color: colors.text }]}>Trackers</Text>
        <Text style={[t.sub, { color: colors.textMuted }]}>{totalActive} active items</Text>
      </View>

      <View style={t.grid}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.key}
            style={[t.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push(card.route as any)}
            activeOpacity={0.75}
          >
            <View style={[t.cardIcon, { backgroundColor: card.accent + '22' }]}>
              <Text style={t.cardEmoji}>{card.emoji}</Text>
            </View>
            <Text style={[t.count, { color: card.accent }]}>{card.count}</Text>
            <Text style={[t.cardLabel, { color: colors.text }]}>{card.label}</Text>
            <Text style={[t.cardSub, { color: colors.textMuted }]}>{card.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[t.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[t.summaryTitle, { color: colors.textMuted }]}>overview</Text>
        {cards.map((card, i) => (
          <View key={card.key}>
            {i > 0 && <View style={[t.divider, { backgroundColor: colors.border }]} />}
            <View style={t.summaryRow}>
              <Text style={t.summaryEmoji}>{card.emoji}</Text>
              <Text style={[t.summaryLabel, { color: colors.text }]}>{card.label}</Text>
              <View style={[t.countPill, { backgroundColor: card.accent + '22' }]}>
                <Text style={[t.countPillText, { color: card.accent }]}>{card.count}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const t = StyleSheet.create({
  root:        { flex: 1 },
  content:     { padding: theme.sp4, gap: theme.sp4, paddingBottom: 120 },

  header:      { gap: 4 },
  title:       { fontSize: 28, fontFamily: theme.fontBlack, letterSpacing: -1 },
  sub:         { fontSize: theme.textSm, fontFamily: theme.fontRegular },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: theme.sp3 },
  card:        { width: '47%', borderRadius: theme.radiusXl, borderWidth: StyleSheet.hairlineWidth, padding: theme.sp4, gap: theme.sp2 },
  cardIcon:    { width: 40, height: 40, borderRadius: theme.radiusMd, alignItems: 'center', justifyContent: 'center' },
  cardEmoji:   { fontSize: 20 },
  count:       { fontSize: 28, fontFamily: theme.fontBlack, letterSpacing: -1, lineHeight: 32 },
  cardLabel:   { fontSize: theme.textSm, fontFamily: theme.fontBold },
  cardSub:     { fontSize: theme.textXs, fontFamily: theme.fontRegular },

  summaryCard:  { borderRadius: theme.radiusXl, borderWidth: StyleSheet.hairlineWidth, padding: theme.sp5, gap: theme.sp3 },
  summaryTitle: { fontSize: 10, fontFamily: theme.fontBold, textTransform: 'uppercase', letterSpacing: 1.5 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, paddingVertical: 4 },
  summaryEmoji: { fontSize: 18, width: 28, textAlign: 'center' },
  summaryLabel: { flex: 1, fontSize: theme.textSm, fontFamily: theme.fontMedium },
  countPill:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  countPillText:{ fontSize: 12, fontFamily: theme.fontBold },
  divider:      { height: StyleSheet.hairlineWidth, marginVertical: 4 },
})
