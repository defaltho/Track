import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, Keyboard,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { useDataStore } from '../../stores/data'
import { theme } from '../../theme'

interface Result {
  id: string
  label: string
  sub?: string
  emoji?: string
  icon?: string
  route: string
  type: 'nav' | 'subscription' | 'app' | 'event' | 'task' | 'habit'
}

const NAV_RESULTS: Result[] = [
  { id: 'nav-home',      label: 'Dashboard',  icon: 'home-outline',        route: '/',          type: 'nav' },
  { id: 'nav-calendar',  label: 'Calendar',   icon: 'calendar-outline',    route: '/calendar',  type: 'nav' },
  { id: 'nav-analytics', label: 'Analytics',  icon: 'stats-chart-outline', route: '/analytics', type: 'nav' },
  { id: 'nav-family',    label: 'Family',     icon: 'people-outline',      route: '/family',    type: 'nav' },
  { id: 'nav-settings',  label: 'Settings',   icon: 'cog-outline',         route: '/settings',  type: 'nav' },
  { id: 'nav-trackers',  label: 'Trackers',   icon: 'grid-outline',        route: '/trackers',  type: 'nav' },
  { id: 'nav-errorlog',  label: 'Error Log',  icon: 'bug-outline',         route: '/error-log', type: 'nav' },
]

type BadgeStyle = { bg: string; text: string }
const TYPE_BADGE: Record<string, BadgeStyle> = {
  nav:          { bg: '#E5E7EB', text: '#374151' },
  subscription: { bg: '#DBEAFE', text: '#1D4ED8' },
  app:          { bg: '#EDE9FE', text: '#6D28D9' },
  event:        { bg: '#FEF3C7', text: '#B45309' },
  task:         { bg: '#DCFCE7', text: '#166534' },
  habit:        { bg: '#FCE7F3', text: '#9D174D' },
}

interface Props {
  visible: boolean
  onClose: () => void
}

export function CommandPalette({ visible, onClose }: Props) {
  const { colors, isDark } = useTheme()
  const router = useRouter()
  const store  = useDataStore()
  const inputRef = useRef<TextInput>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (visible) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [visible])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV_RESULTS

    const out: Result[] = []

    // Nav
    NAV_RESULTS.forEach(r => {
      if (r.label.toLowerCase().includes(q)) out.push(r)
    })

    // Subscriptions
    store.subscriptions.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q))
        out.push({ id: `sub-${s.id}`, label: s.name, sub: s.category, emoji: s.emoji, route: '/', type: 'subscription' })
    })

    // Apps
    store.apps.forEach(a => {
      if (a.name.toLowerCase().includes(q))
        out.push({ id: `app-${a.id}`, label: a.name, sub: a.category, emoji: a.emoji, route: '/', type: 'app' })
    })

    // Events
    store.events.forEach(e => {
      if (e.name.toLowerCase().includes(q))
        out.push({ id: `ev-${e.id}`, label: e.name, sub: e.date, emoji: e.emoji, route: '/calendar', type: 'event' })
    })

    // Tasks
    store.tasks.forEach(t => {
      if (t.name.toLowerCase().includes(q))
        out.push({ id: `task-${t.id}`, label: t.name, sub: t.category, emoji: '✅', route: '/', type: 'task' })
    })

    // Habits
    ;(store.habits ?? []).forEach(h => {
      if (h.name.toLowerCase().includes(q))
        out.push({ id: `habit-${h.id}`, label: h.name, sub: h.category, emoji: h.emoji, route: '/', type: 'habit' })
    })

    return out.slice(0, 12)
  }, [query, store.subscriptions, store.apps, store.events, store.tasks, store.habits])

  function select(r: Result) {
    onClose()
    router.push(r.route as any)
  }

  const badgeColors = (type: string) => TYPE_BADGE[type] ?? TYPE_BADGE.nav

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={cp.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[cp.panel, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            ...(Platform.OS === 'web' ? { boxShadow: '0 24px 48px rgba(0,0,0,0.24), 0 4px 12px rgba(0,0,0,0.10)' } as any : {}),
          }]}
          onPress={() => {}}
        >
          {/* Search row */}
          <View style={[cp.searchRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search pages and items…"
              placeholderTextColor={colors.textFaint}
              style={[cp.input, { color: colors.text }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null]}
              returnKeyType="search"
              autoCorrect={false}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Escape') onClose()
                if (nativeEvent.key === 'Enter' && results.length > 0) select(results[0])
              }}
            />
            <View style={[cp.escBadge, { backgroundColor: colors.surfaceEl, borderColor: colors.border }]}>
              <Text style={[cp.escText, { color: colors.textMuted }]}>esc</Text>
            </View>
          </View>

          {/* Results */}
          {results.length === 0 ? (
            <View style={cp.empty}>
              <Text style={[cp.emptyText, { color: colors.textFaint }]}>No results for "{query}"</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={r => r.id}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 360 }}
              renderItem={({ item: r }) => {
                const badge = badgeColors(r.type)
                return (
                  <TouchableOpacity
                    style={[cp.result, { borderBottomColor: colors.border }]}
                    onPress={() => select(r)}
                    activeOpacity={0.7}
                  >
                    <View style={cp.resultLeft}>
                      {r.emoji ? (
                        <Text style={cp.resultEmoji}>{r.emoji}</Text>
                      ) : r.icon ? (
                        <Ionicons name={r.icon as any} size={16} color={colors.textMuted} style={cp.resultIcon} />
                      ) : null}
                      <View style={cp.resultText}>
                        <Text style={[cp.resultLabel, { color: colors.text }]} numberOfLines={1}>{r.label}</Text>
                        {r.sub ? <Text style={[cp.resultSub, { color: colors.textMuted }]} numberOfLines={1}>{r.sub}</Text> : null}
                      </View>
                    </View>
                    <View style={[cp.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[cp.badgeText, { color: badge.text }]}>{r.type}</Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          )}

          <View style={[cp.footer, { borderTopColor: colors.border }]}>
            <Text style={[cp.footerText, { color: colors.textFaint }]}>↑↓ navigate · enter select · esc close</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const cp = StyleSheet.create({
  overlay:     { flex: 1, alignItems: 'center', paddingTop: '15%', backgroundColor: 'rgba(0,0,0,0.45)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } as any : {}) },
  panel:       { width: '90%', maxWidth: 560, borderRadius: theme.radiusXl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },

  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, padding: theme.sp4, borderBottomWidth: StyleSheet.hairlineWidth },
  input:       { flex: 1, fontSize: 16, fontFamily: theme.fontRegular },
  escBadge:    { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  escText:     { fontSize: 11, fontFamily: theme.fontMono },

  result:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.sp4, paddingVertical: theme.sp3, borderBottomWidth: StyleSheet.hairlineWidth },
  resultLeft:  { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, flex: 1, minWidth: 0 },
  resultEmoji: { fontSize: 18, width: 24, textAlign: 'center' },
  resultIcon:  { width: 24, textAlign: 'center' },
  resultText:  { flex: 1 },
  resultLabel: { fontSize: theme.textSm, fontFamily: theme.fontMedium },
  resultSub:   { fontSize: 11, fontFamily: theme.fontRegular, marginTop: 1 },

  badge:       { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:   { fontSize: 10, fontFamily: theme.fontBold, textTransform: 'lowercase' },

  empty:       { padding: theme.sp6, alignItems: 'center' },
  emptyText:   { fontSize: theme.textSm, fontFamily: theme.fontRegular },

  footer:      { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: theme.sp4, paddingVertical: theme.sp2 },
  footerText:  { fontSize: 11, fontFamily: theme.fontMono },
})
