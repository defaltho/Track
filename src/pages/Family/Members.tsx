import React, { useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFamilyStore } from '../../stores/familyData'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../context/ThemeContext'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'
import { Button } from '../../components/ui/Button'

interface Props { spaceId: string; onBack: () => void }

export function Members({ spaceId, onBack }: Props) {
  const { colors } = useTheme()
  const store      = useFamilyStore()
  const auth       = useAuthStore()
  const toast      = useToastStore()

  const members    = useMemo(() => store.members.filter(m => m.spaceId === spaceId), [store.members, spaceId])
  const userId     = auth.user?.email ?? 'local'
  const myMember   = members.find(m => m.userId === userId)
  const isAdmin    = myMember?.role === 'admin'

  // Pending invites (consumed but not yet approved/rejected)
  const pending    = useMemo(() =>
    store.invites.filter(i => i.spaceId === spaceId && i.usedAt && !i.approvedAt && !i.rejectedAt),
    [store.invites, spaceId]
  )

  // Active invite (not yet used, not expired, not rejected)
  const activeInvite = useMemo(() =>
    store.invites.find(i =>
      i.spaceId === spaceId && !i.usedAt && !i.rejectedAt &&
      new Date(i.expiresAt) > new Date()
    ),
    [store.invites, spaceId]
  )

  const [showInviteCode, setShowInviteCode] = useState(false)
  const [inviteCode, setInviteCode]         = useState('')
  const [joinCode, setJoinCode]             = useState('')
  const [joinError, setJoinError]           = useState('')

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    const displayName = auth.user?.email?.split('@')[0] ?? 'Convidado'
    const result = store.consumeInvite(code, displayName)
    if ('error' in result) {
      setJoinError(
        result.error === 'expired'  ? 'Código expirado. Pede um novo ao administrador.' :
        result.error === 'used'     ? 'Código já utilizado.' :
                                      'Código inválido.'
      )
    } else {
      setJoinCode('')
      setJoinError('')
      toast.push('Pedido enviado! Aguarda aprovação.', 'success')
    }
  }

  function handleGenerateInvite() {
    if (!myMember) return
    const inv = store.createInvite(spaceId, myMember.id)
    setInviteCode(inv.code)
    setShowInviteCode(true)
  }

  function handleApprove(inviteId: string) {
    const result = store.approveInvite(inviteId, `guest-${Date.now()}`)
    if ('error' in result) {
      toast.push('Erro ao aprovar convite', 'error')
    } else {
      toast.push(`${result.displayName} adicionado!`, 'success')
    }
  }

  function handleReject(inviteId: string) {
    store.rejectInvite(inviteId)
    toast.push('Convite rejeitado', 'info')
  }

  function handleRemove(memberId: string) {
    if (memberId === myMember?.id) return
    store.members.find(m => m.id === memberId)
    // Remove by filtering out the member from the store
    store.leaveSpace(spaceId, store.members.find(m => m.id === memberId)?.userId ?? '')
    toast.push('Membro removido', 'info')
  }

  return (
    <ScrollView
      style={[mb.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={mb.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={mb.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[mb.title, { color: colors.text }]}>Membros</Text>
      </View>

      {/* Member list */}
      <View style={[mb.card, { backgroundColor: colors.surface }]}>
        <Text style={[mb.cardTag, { color: colors.textMuted }]}>no espaço</Text>
        {members.map((m, i) => (
          <View key={m.id}>
            {i > 0 && <View style={[mb.divider, { backgroundColor: colors.border }]} />}
            <View style={mb.memberRow}>
              <View style={[mb.avatar, { backgroundColor: m.color }]}>
                <Text style={mb.initial}>{m.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[mb.name, { color: colors.text }]}>{m.displayName}</Text>
                <Text style={[mb.role, { color: colors.textMuted }]}>
                  {m.role === 'admin' ? 'Administrador' : 'Membro'}
                  {m.userId === userId ? ' · tu' : ''}
                </Text>
              </View>
              {isAdmin && m.id !== myMember?.id && (
                <Pressable hitSlop={8} onPress={() => handleRemove(m.id)}>
                  <Ionicons name="remove-circle-outline" size={20} color={colors.danger} />
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Pending approvals */}
      {isAdmin && pending.length > 0 && (
        <View style={[mb.card, { backgroundColor: colors.surface }]}>
          <Text style={[mb.cardTag, { color: colors.textMuted }]}>aguardam aprovação</Text>
          {pending.map((inv, i) => (
            <View key={inv.id}>
              {i > 0 && <View style={[mb.divider, { backgroundColor: colors.border }]} />}
              <View style={mb.pendingRow}>
                <View style={[mb.avatar, { backgroundColor: colors.surfaceEl }]}>
                  <Text style={[mb.initial, { color: colors.textMuted }]}>?</Text>
                </View>
                <Text style={[mb.name, { color: colors.text, flex: 1 }]}>{inv.pendingDisplayName ?? 'Convidado'}</Text>
                <Pressable hitSlop={6} onPress={() => handleApprove(inv.id)} style={[mb.approveBtn, { backgroundColor: colors.successBg }]}>
                  <Text style={[mb.approveTxt, { color: colors.success }]}>Aprovar</Text>
                </Pressable>
                <Pressable hitSlop={6} onPress={() => handleReject(inv.id)}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Invite */}
      {isAdmin && (
        <View style={[mb.card, { backgroundColor: colors.surface }]}>
          <Text style={[mb.cardTag, { color: colors.textMuted }]}>convidar</Text>
          {showInviteCode ? (
            <View style={mb.codeBlock}>
              <Text style={[mb.codeLabel, { color: colors.textMuted }]}>partilha este código (válido 10 min)</Text>
              <View style={[mb.codePill, { backgroundColor: colors.surfaceEl }]}>
                <Text style={[mb.code, { color: colors.text }]}>{inviteCode}</Text>
              </View>
              <Button label="gerar novo" variant="secondary" size="sm" onPress={handleGenerateInvite} />
            </View>
          ) : (
            <Button label="gerar código de convite" variant="primary" size="md" onPress={handleGenerateInvite} fullWidth />
          )}
        </View>
      )}

      {/* Join with code (non-admin) */}
      {!isAdmin && (
        <View style={[mb.card, { backgroundColor: colors.surface }]}>
          <Text style={[mb.cardTag, { color: colors.textMuted }]}>entrar com código</Text>
          <TextInput
            style={[mb.codeInput, { color: colors.text, borderColor: joinError ? colors.danger : colors.border }]}
            value={joinCode}
            onChangeText={v => { setJoinCode(v); setJoinError('') }}
            onSubmitEditing={handleJoin}
            placeholder="TRK-XXXX"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="characters"
            maxLength={8}
            returnKeyType="done"
          />
          {joinError ? (
            <Text style={[mb.errorText, { color: colors.danger }]}>{joinError}</Text>
          ) : null}
          <Button label="entrar" variant="primary" size="md" onPress={handleJoin} fullWidth />
        </View>
      )}
    </ScrollView>
  )
}

const mb = StyleSheet.create({
  page:    { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp3, paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, marginBottom: theme.sp2 },
  title:  { fontSize: 22, fontFamily: theme.fontBlack, letterSpacing: -0.6 },

  card:    { borderRadius: theme.radiusXl, padding: theme.sp5, gap: theme.sp3 },
  cardTag: { fontSize: 10, fontFamily: theme.fontMedium, letterSpacing: 1.6, textTransform: 'lowercase' },

  divider:   { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: theme.sp3, paddingVertical: 4 },
  pendingRow:{ flexDirection: 'row', alignItems: 'center', gap: theme.sp2, paddingVertical: 4 },

  avatar:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 13, fontFamily: theme.fontBold },
  name:    { fontSize: 14, fontFamily: theme.fontBold, letterSpacing: -0.2 },
  role:    { fontSize: 11, fontFamily: theme.fontRegular, marginTop: 1 },

  approveBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  approveTxt: { fontSize: 12, fontFamily: theme.fontMedium },

  codeBlock: { gap: theme.sp2, alignItems: 'center' },
  codeLabel: { fontSize: 12, fontFamily: theme.fontRegular, fontStyle: 'italic' },
  codePill:  { paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radiusMd },
  code:      { fontSize: 28, fontFamily: theme.fontMonoBold, letterSpacing: 4 },

  codeInput:  { fontSize: 20, fontFamily: theme.fontMonoBold, letterSpacing: 4, borderWidth: 1, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, paddingVertical: theme.sp2, textAlign: 'center' },
  errorText:  { fontSize: 12, fontFamily: theme.fontMedium, textAlign: 'center' },
})
