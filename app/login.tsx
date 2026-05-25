import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions, ScrollView, KeyboardAvoidingView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../src/stores/auth'
import { theme } from '../src/theme'

type ViewState = 'signin' | 'signup' | 'forgot'

const FEATURES = [
  { icon: '📊', title: 'Rastreia as tuas subscrições', sub: 'Monitoriza gastos, cobranças futuras e tendências' },
  { icon: '🎯', title: 'Hábitos & metas', sub: 'Cria hábitos, acompanha streaks e atinge os teus objetivos' },
  { icon: '⚡', title: 'Dashboard personalizado', sub: 'Widgets que se adaptam ao teu estilo de vida' },
]

const HEADINGS: Record<ViewState, { title: string; sub: string }> = {
  signin: { title: 'Bem-vindo\nde volta', sub: 'Entra na tua conta para continuar' },
  signup: { title: 'Começa\nagora',       sub: 'Cria a tua conta gratuitamente' },
  forgot: { title: 'Recuperar\npassword', sub: 'Indica o teu endereço de email' },
}

export default function LoginScreen() {
  const router  = useRouter()
  const loginFn = useAuthStore(s => s.login)
  const [view, setView]             = useState<ViewState>('signin')
  const [email, setEmail]           = useState('')
  const [pw, setPw]                 = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width > 760
  const forgotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (forgotTimerRef.current) clearTimeout(forgotTimerRef.current) }, [])

  function doLogin(provider: 'email' | 'google' | 'apple') {
    // Social providers never use the email field — avoids leaking typed/autofilled addresses.
    const addr = provider === 'email'
      ? (email.trim() || 'user@example.com')
      : (provider === 'google' ? 'demo.google@ruflo.app' : 'demo.apple@ruflo.app')
    const raw   = addr.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim()
    const first = raw.split(' ')[0] || 'User'
    loginFn({ name: first, email: addr, initial: first[0].toUpperCase(), provider })
    router.replace('/onboarding')
  }

  function handleForgot() {
    setForgotSent(true)
    forgotTimerRef.current = setTimeout(() => { setForgotSent(false); setView('signin') }, 2200)
  }

  function goBack() { setView('signin'); setForgotSent(false) }

  const form = (
    <View style={f.wrap}>
      {view !== 'signin' && (
        <TouchableOpacity style={f.backBtn} onPress={goBack}>
          <Text style={f.backTxt}>← Voltar</Text>
        </TouchableOpacity>
      )}

      <Text style={f.title}>{HEADINGS[view].title}</Text>
      <Text style={f.sub}>{HEADINGS[view].sub}</Text>

      {view === 'forgot' ? (
        <>
          <TextInput style={f.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.22)"
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          {forgotSent
            ? <View style={f.sentBox}><Text style={f.sentTxt}>Link enviado! Verifica o teu email.</Text></View>
            : <TouchableOpacity style={f.btn} onPress={handleForgot}><Text style={f.btnTxt}>Enviar link</Text></TouchableOpacity>
          }
        </>
      ) : (
        <>
          <TextInput style={f.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.22)"
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={f.input} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.22)"
            secureTextEntry value={pw} onChangeText={setPw} />
          {view === 'signup' && (
            <TextInput style={f.input} placeholder="Confirmar password" placeholderTextColor="rgba(255,255,255,0.22)"
              secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
          )}
          {view === 'signin' && (
            <TouchableOpacity onPress={() => setView('forgot')} style={f.forgotWrap}>
              <Text style={f.forgotTxt}>Esqueceste a password?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={f.btn} onPress={() => doLogin('email')}>
            <Text style={f.btnTxt}>{view === 'signin' ? 'Entrar' : 'Criar conta'}</Text>
          </TouchableOpacity>

          <View style={f.divider}>
            <View style={f.divLine} /><Text style={f.divTxt}>ou continua com</Text><View style={f.divLine} />
          </View>

          <TouchableOpacity style={f.socialBtn} onPress={() => doLogin('google')}>
            <Text style={[f.socialIcon, { color: '#4285F4', fontFamily: theme.fontBold }]}>G</Text>
            <Text style={f.socialTxt}>Continuar com Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={f.socialBtn} onPress={() => doLogin('apple')}>
            <Text style={f.socialIcon}>🍎</Text>
            <Text style={f.socialTxt}>Continuar com Apple</Text>
          </TouchableOpacity>

          <Text style={f.footer}>
            {view === 'signin' ? 'Não tens conta? ' : 'Já tens conta? '}
            <Text style={f.footerLink} onPress={() => setView(view === 'signin' ? 'signup' : 'signin')}>
              {view === 'signin' ? 'Criar conta' : 'Entrar'}
            </Text>
          </Text>
        </>
      )}
    </View>
  )

  if (isWide) {
    return (
      <View style={s.root}>
        {/* Left — branding */}
        <View style={s.left}>
          <Text style={s.brand}>Ruflo</Text>
          <Text style={s.tagline}>O teu rastreador{'\n'}de vida, simplificado.</Text>
          <View style={s.feats}>
            {FEATURES.map(feat => (
              <View key={feat.title} style={s.feat}>
                <View style={s.featIc}><Text style={{ fontSize: 16 }}>{feat.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featTitle}>{feat.title}</Text>
                  <Text style={s.featSub}>{feat.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Right — form, same dark tone */}
        <View style={s.right}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.rightScroll} keyboardShouldPersistTaps="handled">
              <View style={s.formCard}>
                {form}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    )
  }

  // Mobile — full dark screen
  return (
    <View style={s.mobileRoot}>
      <ScrollView contentContainerStyle={s.mobileScroll} keyboardShouldPersistTaps="handled">
        {form}
      </ScrollView>
    </View>
  )
}

// ─── Shared form styles ───────────────────────────────────────────────────────
const f = StyleSheet.create({
  wrap:       { paddingTop: 8, paddingBottom: 8 },
  backBtn:    { marginBottom: 24 },
  backTxt:    { fontFamily: theme.fontMedium, fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  title:      { fontFamily: theme.fontBold, fontSize: 30, letterSpacing: -1, color: '#fff', lineHeight: 36, marginBottom: 8 },
  sub:        { fontFamily: theme.fontRegular, fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 28 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12, padding: 14, paddingHorizontal: 16,
    fontFamily: theme.fontRegular, fontSize: 15, color: '#fff', marginBottom: 12,
  },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -4 },
  forgotTxt:  { fontFamily: theme.fontRegular, fontSize: 13, color: 'rgba(255,255,255,0.30)' },
  btn:        { backgroundColor: '#fff', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 4 },
  btnTxt:     { fontFamily: theme.fontBold, fontSize: 15, color: '#0d0d0d' },
  divider:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  divLine:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divTxt:     { fontFamily: theme.fontRegular, fontSize: 12, color: 'rgba(255,255,255,0.22)' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12,
    padding: 14, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  socialIcon: { fontSize: 16, color: '#fff' },
  socialTxt:  { fontFamily: theme.fontMedium, fontSize: 14, color: '#fff' },
  footer:     { fontFamily: theme.fontRegular, fontSize: 13, color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginTop: 24 },
  footerLink: { fontFamily: theme.fontMedium, color: 'rgba(255,255,255,0.65)' },
  sentBox:    { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, alignItems: 'center' },
  sentTxt:    { fontFamily: theme.fontMedium, fontSize: 14, color: 'rgba(255,255,255,0.65)' },
})

// ─── Layout ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, flexDirection: 'row', backgroundColor: '#0d0d0d' },
  mobileRoot: { flex: 1, backgroundColor: '#0d0d0d' },
  mobileScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  // Left panel
  left: {
    width: 360, backgroundColor: '#111',
    justifyContent: 'center', padding: 48,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)',
  },
  brand:     { fontFamily: theme.fontBold, fontSize: 26, letterSpacing: -1, color: '#fff', marginBottom: 10 },
  tagline:   { fontFamily: theme.fontLight, fontSize: 16, color: 'rgba(255,255,255,0.40)', lineHeight: 24, marginBottom: 44 },
  feats:     { gap: 24 },
  feat:      { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  featIc:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontFamily: theme.fontMedium, fontSize: 13, color: '#fff' },
  featSub:   { fontFamily: theme.fontRegular, fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, lineHeight: 17 },

  // Right panel — dark, matches app
  right:      { flex: 1, backgroundColor: '#0d0d0d' },
  rightScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  formCard: {
    width: '100%', maxWidth: 400,
    backgroundColor: '#161616',
    borderRadius: 20, padding: 32,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.40)' } as any,
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 24 },
      android: { elevation: 8 },
      default: {},
    }),
  },
})
