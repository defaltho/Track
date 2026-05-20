import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform,
} from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useLoggerStore, type LogEntry, type LogLevel } from '../stores/logger'
import { theme } from '../theme'

const FILTERS: { label: string; value: LogLevel | 'all' }[] = [
  { label: 'All',   value: 'all' },
  { label: 'Error', value: 'error' },
  { label: 'Warn',  value: 'warn' },
  { label: 'Info',  value: 'info' },
]

function levelColor(level: LogLevel, colors: any): string {
  if (level === 'error') return colors.danger
  if (level === 'warn')  return '#F2C200'
  return colors.accent
}

function levelLabel(level: LogLevel): string {
  if (level === 'error') return 'ERR'
  if (level === 'warn')  return 'WRN'
  return 'INF'
}

function formatTime(iso: string): string {
  return iso.replace('T', ' ').slice(0, 19)
}

function EntryRow({ entry }: { entry: LogEntry }) {
  const { colors } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const lc = levelColor(entry.level, colors)

  return (
    <TouchableOpacity
      onPress={entry.context ? () => setExpanded(v => !v) : undefined}
      activeOpacity={entry.context ? 0.7 : 1}
      style={[s.entry, { backgroundColor: colors.surfaceEl, borderLeftColor: lc }]}
    >
      <View style={s.entryTop}>
        <View style={[s.badge, { backgroundColor: lc }]}>
          <Text style={s.badgeText}>{levelLabel(entry.level)}</Text>
        </View>
        <View style={s.entryBody}>
          <Text style={[s.msg, { color: colors.text }]} numberOfLines={expanded ? undefined : 2}>
            {entry.message}
          </Text>
          {expanded && entry.context ? (
            <Text style={[s.ctx, { color: colors.textMuted }]}>{entry.context}</Text>
          ) : null}
        </View>
        <Text style={[s.time, { color: colors.textFaint }]}>{formatTime(entry.timestamp)}</Text>
      </View>
      {!expanded && entry.context ? (
        <Text style={[s.expand, { color: colors.accent }]}>···</Text>
      ) : null}
    </TouchableOpacity>
  )
}

export default function ErrorLog() {
  const { colors } = useTheme()
  const entries = useLoggerStore(s => s.entries)
  const clearAll = useLoggerStore(s => s.clear)
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')

  const visible = filter === 'all' ? entries : entries.filter(e => e.level === filter)

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>Error Log</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
            <Text style={[s.clearBtn, { color: colors.danger }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={[s.filterRow, { borderBottomColor: colors.border }]}>
        {FILTERS.map(f => {
          const count = f.value === 'all' ? entries.length : entries.filter(e => e.level === f.value).length
          const active = filter === f.value
          return (
            <TouchableOpacity key={f.value} onPress={() => setFilter(f.value)} style={s.filterTab}>
              <Text style={[s.filterLabel, { color: active ? colors.accent : colors.textMuted }]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[s.filterBadge, { backgroundColor: active ? colors.accent : colors.surfaceEl }]}>
                  <Text style={[s.filterCount, { color: active ? '#fff' : colors.textMuted }]}>{count}</Text>
                </View>
              )}
              {active && <View style={[s.filterBar, { backgroundColor: colors.accent }]} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {visible.length === 0 ? (
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: colors.textFaint }]}>
            {entries.length === 0 ? 'No log entries yet.' : 'No entries for this filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={e => e.id}
          renderItem={({ item }) => <EntryRow entry={item} />}
          contentContainerStyle={s.list}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.sp5, paddingVertical: theme.sp4, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 20, fontFamily: theme.fontBlack, letterSpacing: -0.5 },
  clearBtn:    { fontSize: theme.textSm, fontFamily: theme.fontBold },

  filterRow:   { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  filterTab:   { flex: 1, alignItems: 'center', paddingVertical: theme.sp3, gap: 4, position: 'relative' },
  filterLabel: { fontSize: theme.textXs, fontFamily: theme.fontBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterCount: { fontSize: 10, fontFamily: theme.fontBold },
  filterBar:   { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },

  list:        { padding: theme.sp4, gap: 8 },
  entry:       { borderRadius: theme.radiusMd, borderLeftWidth: 3, padding: theme.sp3, gap: 4 },
  entryTop:    { flexDirection: 'row', gap: theme.sp3, alignItems: 'flex-start' },
  badge:       { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText:   { fontSize: 9, fontFamily: theme.fontBold, color: '#fff', letterSpacing: 0.5 },
  entryBody:   { flex: 1, gap: 4 },
  msg:         { fontSize: theme.textSm, fontFamily: theme.fontMono, lineHeight: 18 },
  ctx:         { fontSize: 11, fontFamily: theme.fontMono, opacity: 0.7, marginTop: 4 },
  time:        { fontSize: 10, fontFamily: theme.fontMono, marginTop: 2 },
  expand:      { fontSize: 14, fontFamily: theme.fontBold, textAlign: 'center', marginTop: 2 },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.sp8 },
  emptyText:   { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center' },
})
