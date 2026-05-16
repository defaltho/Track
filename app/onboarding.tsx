import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, useWindowDimensions,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { useRouter } from 'expo-router'
import { useAuthStore, OnboardingAnswers } from '../src/stores/auth'
import { theme } from '../src/theme'
import { Button } from '../src/components/ui/Button'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const YEARS  = Array.from({ length: new Date().getFullYear() - 5 - 1939 }, (_, i) => 1940 + i)

// ── Option card component ─────────────────────────────────────────────────────
function OptionCard({ selected, title, sub, onPress }: {
  selected: boolean; title: string; sub?: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={[oc.card, selected && oc.cardSel]} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={[oc.title, selected && oc.titleSel]}>{title}</Text>
        {sub ? <Text style={oc.sub}>{sub}</Text> : null}
      </View>
      <View style={[oc.radio, selected && oc.radioSel]}>
        {selected && <View style={oc.radioDot} />}
      </View>
    </TouchableOpacity>
  )
}

const oc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fafafa', borderWidth: 1.5, borderColor: '#ebebeb', borderRadius: 14, marginBottom: 10 },
  cardSel: { borderColor: '#111', backgroundColor: '#fff' },
  title: { fontFamily: theme.fontMedium, fontSize: 15, color: '#111' },
  titleSel: { fontFamily: theme.fontBold },
  sub: { fontFamily: theme.fontRegular, fontSize: 12, color: '#aaa', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginLeft: 12, flexShrink: 0 },
  radioSel: { backgroundColor: '#111', borderColor: '#111' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
})

// ── Step definitions ──────────────────────────────────────────────────────────
type Answers = OnboardingAnswers

const STEPS = 5

export default function OnboardingScreen() {
  const router = useRouter()
  const completeOnboarding = useAuthStore(s => s.completeOnboarding)
  const { width } = useWindowDimensions()
  const narrow = width < 600

  const [step, setStep] = useState(0)   // 0..4
  const [answers, setAnswers] = useState<Answers>({
    uc: null, tabs: 'medium', pain: null, feel: null,
    dob: { m: 1, d: 13, y: 2000 },
  } as unknown as Answers)

  function set<K extends keyof Answers>(key: K, val: Answers[K]) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }
  function setDob(field: 'm' | 'd' | 'y', val: number) {
    setAnswers(prev => ({ ...prev, dob: { ...prev.dob, [field]: val } }))
  }

  function next() {
    if (step < STEPS - 1) setStep(s => s + 1)
    else finish()
  }
  function back() { if (step > 0) setStep(s => s - 1) }
  function finish() {
    completeOnboarding(answers)
    router.replace('/(tabs)')
  }

  const isLast = step === STEPS - 1

  // ── Step content ─────────────────────────────────────────────────────────────
  function renderContent() {
    switch (step) {
      case 0: return (
        <>
          <Text style={s.stepTitle}>Seleciona a tua data de nascimento</Text>
          <Text style={s.stepSub}>Mais ou menos. Sem julgamentos.</Text>
          <View style={s.pickerRow}>
            <View style={s.pickerWrap}>
              <Text style={s.pickerLabel}>Mês</Text>
              <View style={s.pickerBox}>
                <Picker selectedValue={answers.dob.m} onValueChange={v => setDob('m', v)} style={s.picker}>
                  {MONTHS.map((m, i) => <Picker.Item key={m} label={m} value={i + 1} />)}
                </Picker>
              </View>
            </View>
            <View style={s.pickerWrap}>
              <Text style={s.pickerLabel}>Dia</Text>
              <View style={s.pickerBox}>
                <Picker selectedValue={answers.dob.d} onValueChange={v => setDob('d', v)} style={s.picker}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d =>
                    <Picker.Item key={d} label={String(d)} value={d} />
                  )}
                </Picker>
              </View>
            </View>
            <View style={s.pickerWrap}>
              <Text style={s.pickerLabel}>Ano</Text>
              <View style={s.pickerBox}>
                <Picker selectedValue={answers.dob.y} onValueChange={v => setDob('y', v)} style={s.picker}>
                  {YEARS.map(y => <Picker.Item key={y} label={String(y)} value={y} />)}
                </Picker>
              </View>
            </View>
          </View>
          <Text style={s.note}>Consulta a nossa Política de Privacidade para mais informações sobre como tratamos estes dados.</Text>
        </>
      )

      case 1: return (
        <>
          <Text style={s.stepTitle}>O que te traz aqui?</Text>
          <Text style={s.stepSub}>Vamos adaptar a app ao teu estilo de trabalho.</Text>
          {[
            { v: 'work',      t: 'Trabalho & produtividade', s: 'Foco, tarefas, email' },
            { v: 'developer', t: 'Programador',               s: 'Código, terminais, documentação' },
            { v: 'designer',  t: 'Designer',                  s: 'Figma, referências, ficheiros' },
            { v: 'trading',   t: 'Trading & finanças',        s: 'Gráficos, dashboards, notícias' },
            { v: 'casual',    t: 'Navegação casual',           s: 'Leitura, vídeo, redes sociais' },
          ].map(o => (
            <OptionCard key={o.v} selected={answers.uc === o.v} title={o.t} sub={o.s} onPress={() => set('uc', o.v)} />
          ))}
          <Text style={s.note}>As tuas escolhas não limitam o acesso a nenhuma funcionalidade.</Text>
        </>
      )

      case 2: return (
        <>
          <Text style={s.stepTitle}>Quantas tabs abres por dia?</Text>
          <Text style={s.stepSub}>Mais ou menos. Sem julgamentos.</Text>
          {[
            { v: 'low',    t: '1 – 10 tabs',   s: 'Uso muito focado' },
            { v: 'medium', t: '11 – 30 tabs',  s: 'Utilização normal' },
            { v: 'high',   t: '31 – 60 tabs',  s: 'Utilizador intensivo' },
            { v: 'extreme',t: '60+ tabs',       s: 'Tab hoarding nível máximo' },
          ].map(o => (
            <OptionCard key={o.v} selected={(answers as any).tabs === o.v} title={o.t} sub={o.s} onPress={() => set('tabs' as any, o.v as any)} />
          ))}
          <Text style={s.note}>As tuas escolhas não limitam o acesso a nenhuma funcionalidade.</Text>
        </>
      )

      case 3: return (
        <>
          <Text style={s.stepTitle}>O que te atrasa mais?</Text>
          <Text style={s.stepSub}>Escolhe o que melhor te descreve.</Text>
          {[
            { v: 'track',   t: 'Perco o rasto do que está aberto' },
            { v: 'space',   t: 'Demasiadas tabs, pouco espaço' },
            { v: 'context', t: 'Mudar de contexto é lento' },
            { v: 'ram',     t: 'O browser come toda a minha RAM' },
            { v: 'find',    t: 'Não consigo encontrar a tab que preciso' },
          ].map(o => (
            <OptionCard key={o.v} selected={answers.pain === o.v} title={o.t} onPress={() => set('pain', o.v)} />
          ))}
          <Text style={s.note}>As tuas escolhas não limitam o acesso a nenhuma funcionalidade.</Text>
        </>
      )

      case 4: return (
        <>
          <Text style={s.stepTitle}>Como deves sentir a interface?</Text>
          <Text style={s.stepSub}>Escolhe o estilo que preferes.</Text>
          {[
            { v: 'minimal',   t: 'Minimalista',  s: 'Fica fora do meu caminho' },
            { v: 'powerful',  t: 'Poderosa',     s: 'Dá-me todos os controlos' },
            { v: 'automated', t: 'Automatizada', s: 'Decide por mim quando fizer sentido' },
          ].map(o => (
            <OptionCard key={o.v} selected={answers.feel === o.v} title={o.t} sub={o.s} onPress={() => set('feel', o.v)} />
          ))}
          <Text style={s.note}>As tuas escolhas não limitam o acesso a nenhuma funcionalidade.</Text>
        </>
      )

      default: return null
    }
  }

  // ── Layout ────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, !narrow && s.scrollWide]} keyboardShouldPersistTaps="handled">
        <View style={[s.card, !narrow && s.cardWide]}>
          {/* Progress bar */}
          <View style={s.progress}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <View key={i} style={[s.seg, i < step && s.segDone, i === step && s.segCur]} />
            ))}
          </View>

          {/* Nav row */}
          <View style={s.navRow}>
            <TouchableOpacity onPress={back} style={[s.backBtn, step === 0 && { opacity: 0 }]} disabled={step === 0}>
              <Text style={s.backTxt}>‹</Text>
            </TouchableOpacity>
            {!isLast && (
              <TouchableOpacity onPress={next}>
                <Text style={s.skipTxt}>Saltar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Step content */}
          <View style={s.content}>{renderContent()}</View>

          {/* Continue button — Button DNA */}
          <Button
            label={isLast ? 'Começar →' : 'Continuar'}
            variant="primary"
            size="lg"
            onPress={next}
            fullWidth
          />

        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  scrollWide: { alignItems: 'center', paddingVertical: 40 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: '#e8e8e8', width: '100%', ...theme.shadowMd as object },
  cardWide: { width: 520, maxWidth: '100%' },

  // Progress
  progress: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#e0e0e0' },
  segDone: { backgroundColor: '#111' },
  segCur: { backgroundColor: '#555' },

  // Nav
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 24, color: '#666', lineHeight: 28 },
  skipTxt: { fontFamily: theme.fontRegular, fontSize: 14, color: '#bbb' },

  // Content
  content: { marginBottom: 24 },
  stepTitle: { fontFamily: theme.fontBold, fontSize: 22, letterSpacing: -0.5, color: '#111', marginBottom: 6 },
  stepSub: { fontFamily: theme.fontRegular, fontSize: 14, color: '#aaa', marginBottom: 20 },
  note: { fontFamily: theme.fontRegular, fontSize: 12, color: '#ccc', lineHeight: 17, marginTop: 8, textAlign: 'center' },

  // Date picker
  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  pickerWrap: { flex: 1 },
  pickerLabel: { fontFamily: theme.fontBold, fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  pickerBox: { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12, backgroundColor: '#fafafa', overflow: 'hidden' },
  picker: { ...Platform.select({ web: { height: 44 } as any, default: {} }) },

  // CTA
  btnPrimary: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#3a3942',
    ...Platform.select({
      web: {
        backgroundColor: '#262428',
        background: 'linear-gradient(180deg, #201E25 0%, #323137 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.10), 0 0 0 1px #0D0D0D',
        transition: 'box-shadow 160ms ease, background 160ms ease',
      } as any,
      ios:     { backgroundColor: '#262428', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4 },
      android: { backgroundColor: '#262428', elevation: 3 },
      default: { backgroundColor: '#262428' },
    }),
  },
  btnPrimaryTxt: { fontFamily: theme.fontBold, fontSize: 14, color: '#FFFFFF', letterSpacing: -0.2 },
})
