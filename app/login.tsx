import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, useWindowDimensions, ScrollView, KeyboardAvoidingView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../src/stores/auth'
import { theme } from '../src/theme'

type ViewState = 'signin' | 'signup' | 'forgot'

const FEATURES = [
  { icon: '⚡', title: 'Gestão de tabs inteligente', sub: 'Agrupa e suspende tabs com base nos teus hábitos' },
  { icon: '📊', title: 'Rastreador de subscrições', sub: 'Monitoriza os teus gastos e cobranças futuras' },
  { icon: '🎯', title: 'Dashboard personalizado', sub: 'Adapta-se ao teu fluxo de trabalho e preferências' },
]

const HEADINGS: Record<ViewState, { title: string; sub: string }> = {
  signin: { title: 'Hey,\nWelcome Back', sub: 'Sign in to continue' },
  signup: { title: "Let's get\nStarted",  sub: 'Create your account' },
  forgot: { title: 'Forget\nPassword?',   sub: 'Enter your email address' },
}

export default function LoginScreen() {
  const router = useRouter()
  const loginFn = useAuthStore(s => s.login)
  const [view, setView]           = useState<ViewState>('signin')
  const [email, setEmail]         = useState('')
  const [pw, setPw]               = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width > 800

  function doLogin(provider: 'email' | 'google' | 'apple') {
    const fallback = provider === 'google' ? 'user@gmail.com' : provider === 'apple' ? 'user@icloud.com' : 'user@example.com'
    const addr  = email.trim() || fallback
    const raw   = addr.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim()
    const first = raw.split(' ')[0] || 'User'
    loginFn({ name: first, email: addr, initial: first[0].toUpperCase(), provider })
    router.replace('/onboarding')
  }

  function handleForgot() {
    setForgotSent(true)
    setTimeout(() => { setForgotSent(false); setView('signin') }, 2200)
  }

  function goBack() { setView('signin'); setForgotSent(false) }

  // ── Dark form — mobile ────────────────────────────────────────────────────────
  const darkForm = (
    <View style={df.wrap}>
      {view !== 'signin' && (
        <TouchableOpacity style={df.backBtn} onPress={goBack}>
          <Text style={df.backTxt}>← Back</Text>
        </TouchableOpacity>
      )}

      <Text style={df.title}>{HEADINGS[view].title}</Text>
      <Text style={df.sub}>{HEADINGS[view].sub}</Text>

      {view === 'forgot' ? (
        <>
          <TextInput style={df.input} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          {forgotSent
            ? <View style={df.sentBox}><Text style={df.sentTxt}>Link sent! Check your email.</Text></View>
            : <TouchableOpacity style={df.btn} onPress={handleForgot}><Text style={df.btnTxt}>Send</Text></TouchableOpacity>
          }
        </>
      ) : (
        <>
          <TextInput style={df.input} placeholder="Email id" placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={df.input} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.25)"
            secureTextEntry value={pw} onChangeText={setPw} />
          {view === 'signup' && (
            <TextInput style={df.input} placeholder="Confirm Password" placeholderTextColor="rgba(255,255,255,0.25)"
              secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
          )}
          {view === 'signin' && (
            <TouchableOpacity onPress={() => setView('forgot')} style={df.forgotWrap}>
              <Text style={df.forgotTxt}>Forget password?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={df.btn} onPress={() => doLogin('email')}>
            <Text style={df.btnTxt}>{view === 'signin' ? 'Sign In' : 'Sign up'}</Text>
          </TouchableOpacity>
          <View style={df.divider}>
            <View style={df.divLine} /><Text style={df.divTxt}>or</Text><View style={df.divLine} />
          </View>
          <TouchableOpacity style={df.socialBtn} onPress={() => doLogin('apple')}>
            <Text style={df.socialIcon}>🍎</Text>
            <Text style={df.socialTxt}>Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={df.socialBtn} onPress={() => doLogin('google')}>
            <Text style={[df.socialIcon, { color: '#4285F4', fontFamily: theme.fontBold }]}>G</Text>
            <Text style={df.socialTxt}>Continue with Google</Text>
          </TouchableOpacity>
          <Text style={df.footer}>
            {view === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={df.footerLink} onPress={() => setView(view === 'signin' ? 'signup' : 'signin')}>
              {view === 'signin' ? 'Sign up' : 'Login'}
            </Text>
          </Text>
        </>
      )}
    </View>
  )

  // ── Light form card — desktop right panel ─────────────────────────────────────
  const lightForm = (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={lf.card}>
        <Text style={lf.title}>
          {view === 'signin' ? 'Bem-vindo' : view === 'signup' ? 'Criar conta' : 'Recuperar password'}
        </Text>
        <Text style={lf.sub}>
          {view === 'signin' ? 'Entra na tua conta' : view === 'signup' ? 'Cria a tua conta' : 'Introduz o teu email'}
        </Text>

        {view === 'forgot' ? (
          <>
            <TextInput style={lf.input} placeholder="Email" placeholderTextColor="#bbb"
              keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            {forgotSent
              ? <View style={lf.sentBox}><Text style={lf.sentTxt}>Link enviado! Verifica o teu email.</Text></View>
              : <TouchableOpacity style={lf.btn} onPress={handleForgot}><Text style={lf.btnTxt}>Enviar</Text></TouchableOpacity>
            }
            <TouchableOpacity onPress={goBack} style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={lf.forgotTxt}>← Voltar ao login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput style={lf.input} placeholder="Email" placeholderTextColor="#bbb"
              keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextInput style={lf.input} placeholder="Password" placeholderTextColor="#bbb"
              secureTextEntry value={pw} onChangeText={setPw} />
            {view === 'signup' && (
              <TextInput style={lf.input} placeholder="Confirmar password" placeholderTextColor="#bbb"
                secureTextEntry value={confirmPw} onChangeText={setConfirmPw} />
            )}
            {view === 'signin' && (
              <TouchableOpacity onPress={() => setView('forgot')} style={{ alignSelf: 'flex-end', marginBottom: 14 }}>
                <Text style={lf.forgotTxt}>Esqueceste a password?</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={lf.btn} onPress={() => doLogin('email')}>
              <Text style={lf.btnTxt}>{view === 'signin' ? 'Entrar' : 'Criar conta'}</Text>
            </TouchableOpacity>
            <View style={lf.divider}>
              <View style={lf.divLine} /><Text style={lf.divTxt}>ou continua com</Text><View style={lf.divLine} />
            </View>
            <TouchableOpacity style={lf.socialBtn} onPress={() => doLogin('google')}>
              <Text style={[lf.socialIcon, { color: '#4285F4', fontFamily: theme.fontBold }]}>G</Text>
              <Text style={lf.socialTxt}>Continuar com Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={lf.socialBtn} onPress={() => doLogin('apple')}>
              <Text style={lf.socialIcon}>🍎</Text>
              <Text style={lf.socialTxt}>Continuar com Apple</Text>
            </TouchableOpacity>
            <Text style={lf.footer}>
              {view === 'signin' ? 'Não tens conta? ' : 'Já tens conta? '}
              <Text style={lf.footerLink} onPress={() => setView(view === 'signin' ? 'signup' : 'signin')}>
                {view === 'signin' ? 'Criar conta' : 'Entrar'}
              </Text>
            </Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )

  return (
    <View style={s.root}>
      {isWide ? (
        <View style={s.wide}>
          <View style={s.left}>
            <Text style={s.brand}>Ruflo</Text>
            <Text style={s.tagline}>O teu browser,{'\n'}configurado para ti.</Text>
            <View style={s.feats}>
              {FEATURES.map(f => (
                <View key={f.title} style={s.feat}>
                  <View style={s.featIc}><Text style={{ fontSize: 16 }}>{f.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.featTitle}>{f.title}</Text>
                    <Text style={s.featSub}>{f.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={s.right}>
            <ScrollView contentContainerStyle={s.rightScroll} keyboardShouldPersistTaps="handled">
              {lightForm}
            </ScrollView>
          </View>
        </View>
      ) : (
        <View style={s.darkRoot}>
          <ScrollView contentContainerStyle={s.mobileScroll} keyboardShouldPersistTaps="handled">
            {darkForm}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

// ─── Root / layout ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:     { flex: 1 },
  darkRoot: { flex: 1, backgroundColor: '#0d0d0d' },
  wide:     { flex: 1, flexDirection: 'row' },
  left: {
    width: 400, backgroundColor: '#111',
    justifyContent: 'center', padding: 52,
  },
  right:      { flex: 1, backgroundColor: '#f2f1ee' },
  rightScroll: { flexGrow: 1, justifyContent: 'center', padding: 40 },
  mobileScroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  brand:   { fontFamily: theme.fontBold, fontSize: 28, letterSpacing: -1, color: '#fff', marginBottom: 10 },
  tagline: { fontFamily: theme.fontLight, fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 26, marginBottom: 44 },
  feats:   { gap: 22 },
  feat:    { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  featIc:  { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontFamily: theme.fontMedium, fontSize: 14, color: '#fff' },
  featSub:   { fontFamily: theme.fontRegular, fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 3, lineHeight: 17 },
})

// ─── Dark form (mobile) ───────────────────────────────────────────────────────
const df = StyleSheet.create({
  wrap:       { paddingTop: 60, paddingBottom: 40 },
  backBtn:    { marginBottom: 28 },
  backTxt:    { fontFamily: theme.fontMedium, fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  title:      { fontFamily: theme.fontBold, fontSize: 34, letterSpacing: -1, color: '#fff', lineHeight: 40, marginBottom: 8 },
  sub:        { fontFamily: theme.fontRegular, fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 32 },
  input: {
    backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 15, paddingHorizontal: 16,
    fontFamily: theme.fontRegular, fontSize: 15, color: '#fff', marginBottom: 12,
  },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotTxt:  { fontFamily: theme.fontRegular, fontSize: 13, color: 'rgba(255,255,255,0.32)' },
  btn:        { backgroundColor: '#fff', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 4 },
  btnTxt:     { fontFamily: theme.fontBold, fontSize: 15, color: '#0d0d0d' },
  divider:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  divLine:    { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  divTxt:     { fontFamily: theme.fontRegular, fontSize: 12, color: 'rgba(255,255,255,0.25)' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    padding: 14, marginBottom: 10,
  },
  socialIcon: { fontSize: 16, color: '#fff' },
  socialTxt:  { fontFamily: theme.fontMedium, fontSize: 14, color: '#fff' },
  footer:     { fontFamily: theme.fontRegular, fontSize: 13, color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginTop: 28 },
  footerLink: { fontFamily: theme.fontMedium, color: 'rgba(255,255,255,0.65)' },
  sentBox:    { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, alignItems: 'center' },
  sentTxt:    { fontFamily: theme.fontMedium, fontSize: 14, color: 'rgba(255,255,255,0.65)' },
})

// ─── Light form card (desktop) ────────────────────────────────────────────────
const lf = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    borderWidth: 1.5, borderColor: '#e8e8e8',
    ...Platform.select({ web: { boxShadow: '0 4px 24px rgba(0,0,0,0.07)' } as any,
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14 },
      android: { elevation: 4 }, default: {} }),
  },
  title:     { fontFamily: theme.fontBold, fontSize: 22, letterSpacing: -0.5, color: '#111', marginBottom: 4 },
  sub:       { fontFamily: theme.fontRegular, fontSize: 14, color: '#888', marginBottom: 22 },
  input: {
    borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12,
    padding: 13, paddingHorizontal: 16,
    fontFamily: theme.fontRegular, fontSize: 15, color: '#111',
    backgroundColor: '#fafafa', marginBottom: 12,
  },
  forgotTxt: { fontFamily: theme.fontRegular, fontSize: 13, color: '#aaa' },
  btn:       { backgroundColor: '#111', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 4 },
  btnTxt:    { fontFamily: theme.fontBold, fontSize: 14, color: '#fff' },
  divider:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  divLine:   { flex: 1, height: 1, backgroundColor: '#ebebeb' },
  divTxt:    { fontFamily: theme.fontRegular, fontSize: 12, color: '#bbb' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12,
    padding: 13, marginBottom: 10, backgroundColor: '#fff',
  },
  socialIcon: { fontSize: 16 },
  socialTxt:  { fontFamily: theme.fontMedium, fontSize: 14, color: '#111' },
  footer:     { fontFamily: theme.fontRegular, fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 18 },
  footerLink: { fontFamily: theme.fontMedium, color: '#111', textDecorationLine: 'underline' },
  sentBox:    { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 14, alignItems: 'center' },
  sentTxt:    { fontFamily: theme.fontMedium, fontSize: 14, color: '#16a34a' },
})
