import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFamilyStore, Space } from '../../stores/familyData'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'
import { CreateSpace } from './CreateSpace'

const TYPE_EMOJI: Record<string, string> = { family: '🏠', couple: '💑', house: '🏡' }
const TYPE_LABEL: Record<string, string> = { family: 'Família', couple: 'Casal', house: 'Casa' }

export function SpaceList() {
  const { colors } = useTheme()
  const { spaces, members, setActiveSpace } = useFamilyStore()
  const [creating, setCreating] = useState(false)

  if (creating) return <CreateSpace onBack={() => setCreating(false)} />

  const mySpaces = spaces // v1: single-user, all spaces are "mine"

  return (
    <ScrollView
      style={[sl.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={sl.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[sl.title, { color: colors.text }]}>Família</Text>

      {mySpaces.length === 0 ? (
        <EmptyState colors={colors} onCreate={() => setCreating(true)} />
      ) : (
        <>
          <View style={sl.list}>
            {mySpaces.map(space => {
              const memberCount = members.filter(m => m.spaceId === space.id).length
              return (
                <SpaceRow
                  key={space.id}
                  space={space}
                  memberCount={memberCount}
                  colors={colors}
                  onPress={() => setActiveSpace(space.id)}
                />
              )
            })}
          </View>
          <Pressable
            style={[sl.addBtn, { borderColor: colors.border }]}
            onPress={() => setCreating(true)}
          >
            <Ionicons name="add" size={18} color={colors.textMuted} />
            <Text style={[sl.addBtnLabel, { color: colors.textMuted }]}>novo espaço</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}

function SpaceRow({ space, memberCount, colors, onPress }: {
  space: Space; memberCount: number; colors: any; onPress: () => void
}) {
  return (
    <Pressable
      style={[sl.row, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <Text style={sl.rowEmoji}>{TYPE_EMOJI[space.type] ?? '🏠'}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[sl.rowName, { color: colors.text }]}>{space.name}</Text>
        <Text style={[sl.rowMeta, { color: colors.textMuted }]}>
          {TYPE_LABEL[space.type]} · {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  )
}

function EmptyState({ colors, onCreate }: { colors: any; onCreate: () => void }) {
  return (
    <View style={sl.empty}>
      <Text style={sl.emptyEmoji}>👨‍👩‍👧‍👦</Text>
      <Text style={[sl.emptyTitle, { color: colors.text }]}>Nenhum espaço ainda</Text>
      <Text style={[sl.emptySub, { color: colors.textMuted }]}>
        Cria um espaço partilhado para controlar despesas com a família, casal ou casa.
      </Text>
      <Pressable style={[sl.emptyBtn, { backgroundColor: colors.accent }]} onPress={onCreate}>
        <Text style={[sl.emptyBtnLabel, { color: colors.accentFg }]}>Criar espaço</Text>
      </Pressable>
    </View>
  )
}

const sl = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },

  title: { fontSize: 34, fontFamily: theme.fontBlack, letterSpacing: -1, marginBottom: theme.sp2 },

  list:  { gap: theme.sp2 },
  row:   {
    flexDirection: 'row', alignItems: 'center', gap: theme.sp3,
    padding: theme.sp4, borderRadius: theme.radiusXl,
  },
  rowEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  rowName:  { fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.3 },
  rowMeta:  { fontSize: theme.textXs, fontFamily: theme.fontMono },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: theme.sp3, borderRadius: theme.radiusXl,
    borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' as any,
  },
  addBtnLabel: { fontSize: theme.textSm, fontFamily: theme.fontMedium },

  empty:       { alignItems: 'center', gap: theme.sp3, paddingTop: 60, paddingHorizontal: theme.sp6 },
  emptyEmoji:  { fontSize: 52, marginBottom: theme.sp2 },
  emptyTitle:  { fontSize: theme.textXl, fontFamily: theme.fontBlack, letterSpacing: -0.8, textAlign: 'center' },
  emptySub:    { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center', lineHeight: 22 },
  emptyBtn:    { marginTop: theme.sp2, paddingVertical: theme.sp3, paddingHorizontal: theme.sp6, borderRadius: theme.radiusFull },
  emptyBtnLabel:{ fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.2 },
})
