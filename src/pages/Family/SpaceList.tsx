import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFamilyStore, Space } from '../../stores/familyData'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'
import { CreateSpace } from './CreateSpace'

const TYPE_EMOJI: Record<string, string> = { family: '🏠', couple: '💑', house: '🏡' }
const TYPE_LABEL: Record<string, string> = { family: 'Família', couple: 'Casal', house: 'Casa' }

export function SpaceList() {
  const { colors } = useTheme()
  const { spaces, members, setActiveSpace, consumeInvite } = useFamilyStore()
  const user = useAuthStore(s => s.user)
  const [creating, setCreating] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode]   = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState(false)

  if (creating) return <CreateSpace onBack={() => setCreating(false)} />

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code) { setJoinError('Introduz um código'); return }
    const displayName = user?.email?.split('@')[0] ?? user?.name ?? 'Convidado'
    const result = consumeInvite(code, displayName)
    if ('error' in result) {
      const msgs = { invalid: 'Código inválido', used: 'Código já utilizado', expired: 'Código expirado' }
      setJoinError(msgs[result.error] ?? 'Erro desconhecido')
      return
    }
    setJoinSuccess(true)
    setJoinError('')
  }

  function closeJoinModal() {
    setShowJoinModal(false)
    setJoinCode('')
    setJoinError('')
    setJoinSuccess(false)
  }

  return (
    <ScrollView
      style={[sl.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={sl.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[sl.title, { color: colors.text }]}>Família</Text>

      {spaces.length === 0 ? (
        <EmptyState colors={colors} onCreate={() => setCreating(true)} onJoin={() => setShowJoinModal(true)} />
      ) : (
        <>
          <View style={sl.list}>
            {spaces.map(space => {
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
          <View style={sl.actions}>
            <Pressable
              style={[sl.addBtn, { borderColor: colors.border }]}
              onPress={() => setCreating(true)}
            >
              <Ionicons name="add" size={18} color={colors.textMuted} />
              <Text style={[sl.addBtnLabel, { color: colors.textMuted }]}>novo espaço</Text>
            </Pressable>
            <Pressable
              style={[sl.addBtn, { borderColor: colors.border }]}
              onPress={() => setShowJoinModal(true)}
            >
              <Ionicons name="key-outline" size={16} color={colors.textMuted} />
              <Text style={[sl.addBtnLabel, { color: colors.textMuted }]}>entrar com código</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Join with code modal */}
      <Modal visible={showJoinModal} transparent animationType="fade" onRequestClose={closeJoinModal}>
        <Pressable style={sl.overlay} onPress={closeJoinModal}>
          <Pressable style={[sl.modal, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {joinSuccess ? (
              <>
                <Text style={sl.modalEmoji}>✅</Text>
                <Text style={[sl.modalTitle, { color: colors.text }]}>Pedido enviado!</Text>
                <Text style={[sl.modalSub, { color: colors.textMuted }]}>
                  Aguarda que o administrador aprove a tua adesão ao espaço.
                </Text>
                <TouchableOpacity style={[sl.joinBtn, { backgroundColor: colors.accent }]} onPress={closeJoinModal}>
                  <Text style={[sl.joinBtnLabel, { color: colors.accentFg }]}>Fechar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[sl.modalTitle, { color: colors.text }]}>Entrar com código</Text>
                <Text style={[sl.modalSub, { color: colors.textMuted }]}>
                  Pede um código ao administrador do espaço (formato TRK-XXXX).
                </Text>
                <TextInput
                  style={[sl.codeInput, {
                    color: colors.text,
                    backgroundColor: colors.surfaceEl,
                    borderColor: joinError ? colors.danger : colors.border,
                  }]}
                  value={joinCode}
                  onChangeText={v => { setJoinCode(v); setJoinError('') }}
                  onSubmitEditing={handleJoin}
                  placeholder="TRK-XXXX"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="characters"
                  maxLength={8}
                  returnKeyType="done"
                  autoFocus
                />
                {!!joinError && (
                  <Text style={[sl.errorText, { color: colors.danger }]}>{joinError}</Text>
                )}
                <View style={sl.modalBtns}>
                  <TouchableOpacity style={[sl.cancelBtn, { borderColor: colors.border }]} onPress={closeJoinModal}>
                    <Text style={[sl.cancelBtnLabel, { color: colors.textMuted }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[sl.joinBtn, { backgroundColor: colors.accent, flex: 1 }]} onPress={handleJoin}>
                    <Text style={[sl.joinBtnLabel, { color: colors.accentFg }]}>Entrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

function EmptyState({ colors, onCreate, onJoin }: { colors: any; onCreate: () => void; onJoin: () => void }) {
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
      <Pressable style={[sl.emptyJoinBtn, { borderColor: colors.border }]} onPress={onJoin}>
        <Ionicons name="key-outline" size={15} color={colors.textMuted} />
        <Text style={[sl.emptyJoinLabel, { color: colors.textMuted }]}>Entrar com código de convite</Text>
      </Pressable>
    </View>
  )
}

const sl = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 130 },

  title: { fontSize: 34, fontFamily: theme.fontBlack, letterSpacing: -1, marginBottom: theme.sp2 },

  list:    { gap: theme.sp2 },
  actions: { gap: theme.sp2 },
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

  empty:         { alignItems: 'center', gap: theme.sp3, paddingTop: 60, paddingHorizontal: theme.sp6 },
  emptyEmoji:    { fontSize: 52, marginBottom: theme.sp2 },
  emptyTitle:    { fontSize: theme.textXl, fontFamily: theme.fontBlack, letterSpacing: -0.8, textAlign: 'center' },
  emptySub:      { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center', lineHeight: 22 },
  emptyBtn:      { marginTop: theme.sp2, paddingVertical: theme.sp3, paddingHorizontal: theme.sp6, borderRadius: theme.radiusFull },
  emptyBtnLabel: { fontSize: theme.textBase, fontFamily: theme.fontBold, letterSpacing: -0.2 },
  emptyJoinBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: theme.sp2, paddingHorizontal: theme.sp4, borderRadius: theme.radiusFull, borderWidth: StyleSheet.hairlineWidth },
  emptyJoinLabel:{ fontSize: theme.textSm, fontFamily: theme.fontMedium },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: {
    width: '100%', maxWidth: 360, borderRadius: theme.radiusXl,
    padding: theme.sp5, gap: theme.sp3,
  },
  modalEmoji:  { fontSize: 40, textAlign: 'center' },
  modalTitle:  { fontSize: theme.textLg, fontFamily: theme.fontBold, letterSpacing: -0.4, textAlign: 'center' },
  modalSub:    { fontSize: theme.textSm, fontFamily: theme.fontRegular, textAlign: 'center', lineHeight: 20 },
  codeInput: {
    borderWidth: 1.5, borderRadius: theme.radiusLg,
    padding: theme.sp3, paddingHorizontal: theme.sp4,
    fontSize: 18, fontFamily: theme.fontMono,
    textAlign: 'center', letterSpacing: 2,
  },
  errorText: { fontSize: theme.textXs, fontFamily: theme.fontMedium, textAlign: 'center', marginTop: -theme.sp2 },
  modalBtns:     { flexDirection: 'row', gap: theme.sp2, marginTop: theme.sp1 },
  cancelBtn:     { borderWidth: 1, borderRadius: theme.radiusFull, paddingVertical: theme.sp3, paddingHorizontal: theme.sp4, alignItems: 'center' },
  cancelBtnLabel:{ fontSize: theme.textSm, fontFamily: theme.fontMedium },
  joinBtn:       { borderRadius: theme.radiusFull, paddingVertical: theme.sp3, paddingHorizontal: theme.sp4, alignItems: 'center' },
  joinBtnLabel:  { fontSize: theme.textSm, fontFamily: theme.fontBold },
})
