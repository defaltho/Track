import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, Platform, useWindowDimensions, ScrollView, KeyboardAvoidingView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../src/stores/auth'
import { theme } from '../src/theme'

// ── Google account-picker modal ──────────────────────────────────────────────
function GoogleModal({ visible, onClose, onContinue }: {
  visible: boolean; onClose: () => void; onContinue: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={gm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={gm.card}>
          {/* Header */}
          <View style={gm.head}>
            <View style={gm.logoRow}>
              <Text style={gm.gLetter}>G</Text>
              <Text style={gm.gWordmark}>oogle</Text>
            </View>
            <Text style={gm.title}>Sign in with Google</Text>
            <Text style={gm.sub}>to continue to <Text style={{ fontFamily: theme.fontBold }}>Ruflo</Text></Text>
          </View>
          {/* Account row */}
          <TouchableOpacity style={gm.accRow} onPress={onContinue}>
            <View style={gm.avatar}><Text style={gm.avatarTxt}>L</Text></View>
            <View>
              <Text style={gm.accName}>Luis Miguel</Text>
              <Text style={gm.accEmail}>luisjsmigueljogos@gmail.com</Text>
            </View>
          </TouchableOpacity>
          <View style={gm.addRow}>
            <View style={gm.addIcon}><Text style={{ color: '#5f6368', fontSize: 18 }}>+</Text></View>
            <Text style={gm.addTxt}>Use another account</Text>
          </View>
          {/* Footer */}
          <View style={gm.foot}>
            <Text style={gm.legal}>Privacy · Terms</Text>
            <View style={gm.footBtns}>
              <TouchableOpacity onPress={onClose}><Text style={gm.cancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={gm.contBtn} onPress={onContinue}>
                <Text style={gm.contTxt}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Apple sign-in modal ───────────────────────────────────────────────────────
function AppleModal({ visible, onClose, onContinue }: {
  visible: boolean; onClose: () => void; onContinue: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={am.overlay} activeOpacity={1} onPress={onClose}>
        <View style={am.card}>
          <Text style={am.logo}>🍎</Text>
          <Text style={am.title}>Sign in with Apple</Text>
          <Text style={am.sub}>Ruflo wants to use your Apple ID to sign in.</Text>
          <View style={am.idRow}>
            <View style={am.idAv}><Text style={{ color: '#fff', fontSize: 16 }}>L</Text></View>
            <View>
              <Text style={am.idLabel}>Apple ID</Text>
              <Text style={am.idEmail}>luisjsmiguel@icloud.com</Text>
            </View>
          </View>
          <TouchableOpacity style={am.contBtn} onPress={onContinue}>
            <Text style={am.contTxt}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={am.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Main login screen ─────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [googleVis, setGoogleVis] = useState(false)
  const [appleVis, setAppleVis] = useState(false)
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width > 800

  function doSignIn(user: { name: string; email: string; initial: string; provider: 'email' | 'google' | 'apple' }) {
    login(user)
    router.replace('/onboarding')
  }

  function emailSignIn() {
    const addr = email.trim() || 'user@example.com'
    const first = addr.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim().split(' ')[0] || 'User'
    doSignIn({ name: first, email: addr, initial: first[0].toUpperCase(), provider: 'email' })
  }

  function authGoogle() {
    setGoogleVis(false)
    doSignIn({ name: 'Luis Miguel', email: 'luisjsmigueljogos@gmail.com', initial: 'L', provider: 'google' })
  }

  function authApple() {
    setAppleVis(false)
    doSignIn({ name: 'Luis Miguel', email: 'luisjsmiguel@icloud.com', initial: 'L', provider: 'apple' })
  }

  const form = (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.formCard}>
        <Text style={s.formTitle}>Bem-vindo</Text>
        <Text style={s.formSub}>Entra na tua conta</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#bbb"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#bbb"
          secureTextEntry
          value={pw}
          onChangeText={setPw}
        />

        <TouchableOpacity style={s.btnPrimary} onPress={emailSignIn}>
          <Text style={s.btnPrimaryTxt}>Entrar</Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerTxt}>ou continua com</Text>
          <View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.socialBtn} onPress={() => setGoogleVis(true)}>
          <Text style={s.gIcon}>G</Text>
          <Text style={s.socialTxt}>Continuar com Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.socialBtn} onPress={() => setAppleVis(true)}>
          <Text style={s.aIcon}>🍎</Text>
          <Text style={s.socialTxt}>Continuar com Apple</Text>
        </TouchableOpacity>

        <Text style={s.footer}>
          Não tens conta?{' '}
          <Text style={s.footerLink} onPress={emailSignIn}>Criar conta</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  )

  return (
    <View style={s.root}>
      <GoogleModal visible={googleVis} onClose={() => setGoogleVis(false)} onContinue={authGoogle} />
      <AppleModal  visible={appleVis}  onClose={() => setAppleVis(false)}  onContinue={authApple} />

      {isWide ? (
        // ── Wide / desktop layout ────────────────────────────────────────────
        <View style={s.wide}>
          <View style={s.leftPanel}>
            <Text style={s.brand}>Ruflo</Text>
            <Text style={s.tagline}>O teu browser,{'\n'}configurado para ti.</Text>
            <View style={s.feats}>
              {FEATURES.map(f => (
                <View key={f.title} style={s.feat}>
                  <View style={s.featIc}><Text style={{ fontSize: 16 }}>{f.icon}</Text></View>
                  <View>
                    <Text style={s.featTitle}>{f.title}</Text>
                    <Text style={s.featSub}>{f.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={s.rightPanel}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 40 }} keyboardShouldPersistTaps="handled">
              {form}
            </ScrollView>
          </View>
        </View>
      ) : (
        // ── Mobile / narrow layout ───────────────────────────────────────────
        <ScrollView contentContainerStyle={s.mobileScroll} keyboardShouldPersistTaps="handled">
          <Text style={[s.brand, { color: '#111', fontSize: 32, marginBottom: 4 }]}>Ruflo</Text>
          <Text style={[s.tagline, { color: '#888', marginBottom: 36 }]}>O teu browser, configurado para ti.</Text>
          {form}
        </ScrollView>
      )}
    </View>
  )
}

const FEATURES = [
  { icon: '⚡', title: 'Gestão de tabs inteligente', sub: 'Agrupa e suspende tabs com base nos teus hábitos' },
  { icon: '📊', title: 'Rastreador de subscrições', sub: 'Monitoriza os teus gastos e cobranças futuras' },
  { icon: '🎯', title: 'Dashboard personalizado', sub: 'Adapta-se ao teu fluxo de trabalho e preferências' },
]

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },

  // Wide
  wide: { flex: 1, flexDirection: 'row' },
  leftPanel: { width: 400, backgroundColor: '#111', justifyContent: 'center', padding: 52 },
  rightPanel: { flex: 1, backgroundColor: '#f5f5f5' },
  brand: { fontFamily: theme.fontBold, fontSize: 28, letterSpacing: -1, color: '#fff', marginBottom: 10 },
  tagline: { fontFamily: theme.fontLight, fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 26, marginBottom: 44 },
  feats: { gap: 22 },
  feat: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  featIc: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontFamily: theme.fontMedium, fontSize: 14, color: '#fff' },
  featSub: { fontFamily: theme.fontRegular, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 17 },

  // Mobile
  mobileScroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },

  // Form card
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, borderWidth: 1.5, borderColor: '#e8e8e8', ...theme.shadowMd as object },
  formTitle: { fontFamily: theme.fontBold, fontSize: 22, letterSpacing: -0.5, color: '#111', marginBottom: 4 },
  formSub: { fontFamily: theme.fontRegular, fontSize: 14, color: '#888', marginBottom: 22 },

  input: { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12, padding: 13, paddingHorizontal: 16, fontFamily: theme.fontRegular, fontSize: 15, color: '#111', backgroundColor: '#fafafa', marginBottom: 12 },

  btnPrimary: { backgroundColor: '#111', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  btnPrimaryTxt: { fontFamily: theme.fontMedium, fontSize: 15, color: '#fff' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ebebeb' },
  dividerTxt: { fontFamily: theme.fontRegular, fontSize: 12, color: '#bbb' },

  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12, padding: 13, marginBottom: 10, backgroundColor: '#fff' },
  socialTxt: { fontFamily: theme.fontMedium, fontSize: 14, color: '#111' },
  gIcon: { fontSize: 16, fontFamily: theme.fontBold, color: '#4285F4' },
  aIcon: { fontSize: 16 },

  footer: { fontFamily: theme.fontRegular, fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 18 },
  footerLink: { fontFamily: theme.fontMedium, color: '#111', textDecorationLine: 'underline' },
})

// ─── Google modal styles ──────────────────────────────────────────────────────
const gm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, width: 360, maxWidth: '100%', overflow: 'hidden' },
  head: { padding: 28, paddingBottom: 12, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  gLetter: { fontSize: 22, fontFamily: theme.fontBold, color: '#4285F4' },
  gWordmark: { fontSize: 22, color: '#5f6368' },
  title: { fontFamily: theme.fontRegular, fontSize: 20, color: '#202124', marginBottom: 6 },
  sub: { fontFamily: theme.fontRegular, fontSize: 14, color: '#5f6368' },
  accRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a73e8', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontFamily: theme.fontMedium, fontSize: 16 },
  accName: { fontFamily: theme.fontMedium, fontSize: 14, color: '#202124' },
  accEmail: { fontFamily: theme.fontRegular, fontSize: 12, color: '#5f6368' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 10 },
  addIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#dadce0', alignItems: 'center', justifyContent: 'center' },
  addTxt: { fontFamily: theme.fontMedium, fontSize: 14, color: '#1a73e8' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingHorizontal: 24, borderTopWidth: 1, borderColor: '#e8eaed' },
  legal: { fontFamily: theme.fontRegular, fontSize: 12, color: '#5f6368' },
  footBtns: { flexDirection: 'row', gap: 8 },
  cancel: { fontFamily: theme.fontMedium, fontSize: 14, color: '#1a73e8', padding: 8 },
  contBtn: { backgroundColor: '#1a73e8', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 8 },
  contTxt: { fontFamily: theme.fontMedium, fontSize: 14, color: '#fff' },
})

// ─── Apple modal styles ───────────────────────────────────────────────────────
const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#1c1c1e', borderRadius: 18, width: 320, maxWidth: '100%', padding: 28, alignItems: 'center' },
  logo: { fontSize: 44, marginBottom: 10 },
  title: { fontFamily: theme.fontBold, fontSize: 17, color: '#fff', marginBottom: 8 },
  sub: { fontFamily: theme.fontRegular, fontSize: 13, color: '#8e8e93', textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#2c2c2e', borderRadius: 10, padding: 12, width: '100%', marginBottom: 18 },
  idAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#636366', alignItems: 'center', justifyContent: 'center' },
  idLabel: { fontFamily: theme.fontRegular, fontSize: 11, color: '#8e8e93' },
  idEmail: { fontFamily: theme.fontRegular, fontSize: 13, color: '#fff', marginTop: 2 },
  contBtn: { backgroundColor: '#0a84ff', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  contTxt: { fontFamily: theme.fontBold, fontSize: 16, color: '#fff' },
  cancel: { fontFamily: theme.fontRegular, fontSize: 16, color: '#0a84ff', padding: 10 },
})
