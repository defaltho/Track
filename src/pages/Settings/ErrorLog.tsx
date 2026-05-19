import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLoggerStore, LogLevel } from '../../stores/logger'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'

const FILTERS: Array<{ key: LogLevel | 'all'; label: string }> = [
  { key: 'all',   label: 'All'   },
  { key: 'error', label: 'Error' },
  { key: 'warn',  label: 'Warn'  },
  { key: 'info',  label: 'Info'  },
]

const LEVEL_COLOR: Record<LogLevel, string> = {
  error: '#DC2626',
  warn:  '#D97706',
  info:  '#3B82F6',
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toTimeString().slice(0, 8)
  } catch {
    return iso.slice(0, 19).replace('T', ' ')
  }
}

function LogRow({ entry, colors }: { entry: { id: string; timestamp: string; level: LogLevel; message: string; context?: string }; colors: any }) {
  const [expanded, setExpanded] = useState(false)
  const hasContext = !!entry.context

  return (
    <Pressable
      style={[el.row, { backgroundColor: colors.surfaceEl }]}
      onPress={hasContext ? () => setExpanded(v => !v) : undefined}
    >
      <View style={[el.badge, { backgroundColor: LEVEL_COLOR[entry.level] }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[el.msg, { color: colors.text }]} numberOfLines={expanded ? undefined : 2}>
          {entry.message}
        </Text>
        {expanded && entry.context ? (
          <Text style={[el.ctx, { color: colors.textMuted, backgroundColor: colors.surfaceHigh }]}>
            {entry.context}
          </Text>
        ) : null}
      </View>
      <View style={el.right}>
        <Text style={[el.time, { color: colors.textFaint }]}>{formatTime(entry.timestamp)}</Text>
        {hasContext ? (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.textFaint}
          />
        ) : null}
      </View>
    </Pressable>
  )
}

interface Props {
  onBack: () => void
}

export function ErrorLog({ onBack }: Props) {
  const { colors } = useTheme()
  const entries = useLoggerStore(s => s.entries)
  const clear   = useLoggerStore(s => s.clear)
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')

  const visible = filter === 'all' ? entries : entries.filter(e => e.level === filter)

  return (
    <View style={[el.page, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[el.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={el.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[el.title, { color: colors.text }]}>Error Log</Text>
        {entries.length > 0 ? (
          <TouchableOpacity onPress={clear} hitSlop={12}>
            <Text style={[el.clearBtn, { color: colors.danger }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Filter pills */}
      <View style={[el.pills, { borderBottomColor: colors.border }]}>
        {FILTERS.map(f => {
          const active = filter === f.key
          const count  = f.key === 'all' ? entries.length : entries.filter(e => e.level === f.key).length
          return (
            <Pressable
              key={f.key}
              style={[el.pill, active && { backgroundColor: colors.accent }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[el.pillLabel, { color: active ? colors.accentFg : colors.textMuted }]}>
                {f.label}
                {count > 0 ? ` ${count}` : ''}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={el.list}
        showsVerticalScrollIndicator={false}
      >
        {visible.length === 0 ? (
          <View style={el.empty}>
            <Text style={el.emptyEmoji}>✅</Text>
            <Text style={[el.emptyTitle, { color: colors.text }]}>No errors logged</Text>
            <Text style={[el.emptySub, { color: colors.textMuted }]}>
              {filter === 'all'
                ? 'The log is empty. Errors and warnings will appear here.'
                : `No ${filter} entries.`}
            </Text>
          </View>
        ) : (
          visible.map(entry => (
            <LogRow key={entry.id} entry={entry} colors={colors} />
          ))
        )}
      </ScrollView>
    </View>
  )
}

const el = StyleSheet.create({
  page:  { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.sp4, paddingVertical: theme.sp3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:   { width: 44, alignItems: 'flex-start' },
  title:     { fontSize: theme.textLg, fontFamily: theme.fontBold, letterSpacing: -0.4 },
  clearBtn:  { fontSize: theme.textSm, fontFamily: theme.fontMedium },

  pills: {
    flexDirection: 'row', gap: theme.sp2,
    paddingHorizontal: theme.sp4, paddingVertical: theme.sp3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pill:      { paddingHorizontal: theme.sp3, paddingVertical: 6, borderRadius: theme.radiusFull },
  pillLabel: { fontSize: theme.textSm, fontFamily: theme.fontMedium },

  list:  { padding: theme.sp4, gap: theme.sp2, paddingBottom: 60 },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: theme.sp3,
    borderRadius: theme.radiusLg, padding: theme.sp3,
  },
  badge:  { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  msg:    { fontSize: theme.textSm, fontFamily: theme.fontRegular, lineHeight: 18 },
  ctx: {
    fontSize: 11, fontFamily: theme.fontMono, lineHeight: 16,
    marginTop: 4, padding: 8, borderRadius: 6,
  },
  right:  { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  time:   { fontSize: 10, fontFamily: theme.fontMono },

  empty:      { alignItems: 'center', gap: theme.sp3, paddingTop: 80, paddingHorizontal: theme.sp6 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: theme.textLg, fontFamily: theme.fontBold, letterSpacing: -0.4 },
  emptySub:   { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center', lineHeight: 20 },
})
