import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Share,
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDataStore } from '../../src/stores/data'
import { useAuthStore } from '../../src/stores/auth'
import { useToastStore } from '../../src/stores/toasts'
import { useTheme } from '../../src/context/ThemeContext'
import { theme } from '../../src/theme'
import { Modal as TrackModal } from '../../src/components/ui/Modal'
import { Button } from '../../src/components/ui/Button'
import { Segmented } from '../../src/components/ui/Segmented'
import { VERSION } from '../../src/data/version'
import { CHANGELOG } from '../../src/data/changelog'
import { loadSeedData } from '../../src/utils/seedData'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL']


export default function Settings() {
  const router = useRouter()
  const { colors, themeKey, setTheme } = useTheme()
  const store = useDataStore()
  const auth = useAuthStore()
  const toast = useToastStore()
  const [showClear, setShowClear] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [showChangelog, setShowChangelog] = useState(false)
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [budgetText, setBudgetText] = useState(
    store.settings.monthlyBudget != null ? String(store.settings.monthlyBudget) : ''
  )
  const devMode = store.settings.devMode

  function handleBudgetBlur() {
    const n = parseFloat(budgetText.replace(',', '.'))
    if (budgetText.trim() === '') {
      store.updateSettings({ monthlyBudget: null })
    } else if (!isNaN(n) && n >= 0) {
      store.updateSettings({ monthlyBudget: Math.round(n * 100) / 100 })
    } else {
      setBudgetText(store.settings.monthlyBudget != null ? String(store.settings.monthlyBudget) : '')
    }
  }

  function toggleDev() {
    store.updateSettings({ devMode: !devMode })
    toast.push(devMode ? 'Developer mode off' : 'Developer mode on', 'info')
  }

  function resetOnboarding() {
    auth.completeOnboarding(null as any)
    toast.push('Onboarding reset', 'info')
    router.replace('/onboarding')
  }

  function reloadSeed() {
    store.clearAll()
    setTimeout(() => loadSeedData(store), 50)
    toast.push('Seed data reloaded', 'success')
  }

  function newAccount() {
    store.clearAll()
    auth.logout()
    setShowNewAccount(false)
    toast.push('Signed out. Set up new account.', 'info')
    router.replace('/login')
  }

  async function handleExport() {
    const data = {
      subscriptions: store.subscriptions,
      apps: store.apps,
      events: store.events,
      tasks: store.tasks,
      settings: store.settings,
    }
    const json = JSON.stringify(data, null, 2)
    if (Platform.OS === 'web') {
      try {
        await (navigator as any).clipboard.writeText(json)
        toast.push('Data copied to clipboard', 'success')
      } catch {
        toast.push('Could not copy — check browser permissions', 'info')
      }
    } else {
      await Share.share({ message: json })
    }
  }

  function handleImport() {
    try {
      const data = JSON.parse(importText)
      store.importData(data)
      setShowImport(false)
      setImportText('')
      setImportError('')
      toast.push('Data imported successfully', 'success')
    } catch {
      setImportError('Invalid JSON. Please check the format.')
    }
  }

  function handleClear() {
    store.clearAll()
    setShowClear(false)
    toast.push('All data cleared', 'info')
  }

  const themeOptions: Array<{ key: 'light' | 'dark'; label: string; icon: 'sunny' | 'moon'; desc: string }> = [
    { key: 'light', label: 'Light', icon: 'sunny', desc: 'Clean, minimal' },
    { key: 'dark',  label: 'Dark',  icon: 'moon',  desc: 'Easy on the eyes' },
  ]

  return (
    <ScrollView
      style={[s.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.text }]}>Settings</Text>

      {/* ── Appearance ── */}
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>appearance</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        {themeOptions.map((opt, i) => {
          const selected = themeKey === opt.key
          const accentColor = colors.accent
          return (
            <React.Fragment key={opt.key}>
              {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={s.row} onPress={() => setTheme(opt.key)} activeOpacity={0.6}>
                <View style={s.themeRowLeft}>
                  <View style={[
                    s.themeIconCircle,
                    {
                      backgroundColor: opt.key === 'dark' ? '#0A0A0A' : colors.surfaceEl,
                      borderColor: opt.key === 'light' ? colors.border : 'transparent',
                    },
                  ]}>
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={opt.key === 'dark' ? '#FFFFFF' : colors.text}
                    />
                  </View>
                  <View>
                    <Text style={[s.rowLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[s.rowSub, { color: colors.textMuted }]}>{opt.desc}</Text>
                  </View>
                </View>
                <View style={[s.radio, { borderColor: selected ? accentColor : colors.borderStrong }]}>
                  {selected && <View style={[s.radioDot, { backgroundColor: accentColor }]} />}
                </View>
              </TouchableOpacity>
            </React.Fragment>
          )
        })}
      </View>

      {/* ── Preferences ── */}
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>preferences</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.row}>
          <Text style={[s.rowLabel, { color: colors.text }]}>Currency</Text>
          <Segmented
            options={CURRENCIES}
            value={store.settings.defaultCurrency}
            onChange={c => store.updateSettings({ defaultCurrency: c })}
            layout="fit"
            size="sm"
          />
        </View>
        <View style={[s.divider, { backgroundColor: colors.border }]} />
        <View style={s.row}>
          <View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Monthly Budget</Text>
            <Text style={[s.rowSub, { color: colors.textMuted }]}>shown in the budget widget</Text>
          </View>
          <TextInput
            style={[s.budgetInput, {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surfaceEl,
            }]}
            value={budgetText}
            onChangeText={setBudgetText}
            onBlur={handleBudgetBlur}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={colors.textFaint}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* ── Data ── */}
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>data</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={s.row} onPress={handleExport} activeOpacity={0.6}>
          <Text style={[s.rowLabel, { color: colors.text }]}>Export Data</Text>
          <Text style={[s.chevron, { color: colors.textMuted }]}>JSON ›</Text>
        </TouchableOpacity>
        <View style={[s.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={s.row} onPress={() => setShowImport(!showImport)} activeOpacity={0.6}>
          <Text style={[s.rowLabel, { color: colors.text }]}>Import Data</Text>
          <Text style={[s.chevron, { color: colors.textMuted }]}>Paste ›</Text>
        </TouchableOpacity>

        {showImport && (
          <View style={s.importWrap}>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={{ paddingTop: theme.sp4, gap: theme.sp3 }}>
              <TextInput
                style={[s.importInput, {
                  backgroundColor: colors.surfaceEl,
                  borderColor: importError ? colors.danger : colors.border,
                  color: colors.text,
                }]}
                multiline
                numberOfLines={6}
                value={importText}
                onChangeText={v => { setImportText(v); setImportError('') }}
                placeholder="Paste exported JSON here..."
                placeholderTextColor={colors.textFaint}
              />
              {importError ? (
                <Text style={[s.errorText, { color: colors.danger }]}>{importError}</Text>
              ) : null}
              <View style={s.importActions}>
                <Button label="Cancel" variant="secondary" size="md" onPress={() => { setShowImport(false); setImportText(''); setImportError('') }} />
                <View style={{ flex: 1 }}>
                  <Button label="Import" variant="primary" size="md" onPress={handleImport} fullWidth />
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── About ── */}
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>about</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={s.row} onPress={() => setShowChangelog(true)} activeOpacity={0.6}>
          <View>
            <Text style={[s.rowLabel, { color: colors.text }]}>What's new</Text>
            <Text style={[s.rowSub, { color: colors.textMuted }]}>Changelog · <Text style={{ fontFamily: theme.fontMono }}>v{VERSION}</Text></Text>
          </View>
          <Text style={[s.chevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
        <View style={[s.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={s.row} onPress={toggleDev} activeOpacity={0.6}>
          <View>
            <Text style={[s.rowLabel, { color: colors.text }]}>Developer mode</Text>
            <Text style={[s.rowSub, { color: colors.textMuted }]}>{devMode ? 'Active — extra actions shown below' : 'Show advanced actions'}</Text>
          </View>
          <View style={[s.toggle, { backgroundColor: devMode ? colors.accent : colors.surfaceEl, borderColor: colors.border }]}>
            <View style={[s.toggleKnob, { backgroundColor: devMode ? colors.accentFg : colors.textMuted, transform: [{ translateX: devMode ? 16 : 0 }] }]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Developer (only when devMode) ── */}
      {devMode && (
        <>
          <Text style={[s.sectionLabel, { color: colors.textMuted }]}>developer</Text>
          <View style={[s.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={s.row} onPress={resetOnboarding} activeOpacity={0.6}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Reset onboarding</Text>
              <Text style={[s.chevron, { color: colors.textMuted }]}>↻</Text>
            </TouchableOpacity>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={s.row} onPress={reloadSeed} activeOpacity={0.6}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Reload placeholder data</Text>
              <Text style={[s.chevron, { color: colors.textMuted }]}>↻</Text>
            </TouchableOpacity>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={s.row} onPress={() => setShowNewAccount(true)} activeOpacity={0.6}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Set up new account</Text>
              <Text style={[s.rowSub, { color: colors.textMuted }]}>Sign out + wipe local data</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Danger Zone ── */}
      <Text style={[s.sectionLabel, { color: colors.danger }]}>danger zone</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        {!showClear ? (
          <TouchableOpacity style={s.row} onPress={() => setShowClear(true)} activeOpacity={0.6}>
            <Text style={[s.rowLabel, { color: colors.danger }]}>Clear All Data</Text>
            <Text style={[s.chevron, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: theme.sp3, padding: theme.sp5 }}>
            <Text style={{ fontSize: 14, color: colors.text, fontFamily: theme.fontRegular, lineHeight: 20 }}>
              This will permanently delete all subscriptions, apps, events, and tasks. This cannot be undone.
            </Text>
            <View style={s.importActions}>
              <Button label="Cancel" variant="secondary" size="md" onPress={() => setShowClear(false)} />
              <View style={{ flex: 1 }}>
                <Button label="Delete Everything" variant="danger" size="md" onPress={handleClear} fullWidth />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Footer ── */}
      <View style={[s.footer, { borderTopColor: colors.border }]}>
        <View style={s.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/defaltho/Track')} activeOpacity={0.6}>
            <Text style={[s.footerLink, { color: colors.textMuted }]}>GitHub</Text>
          </TouchableOpacity>
          <Text style={[s.footerSep, { color: colors.textFaint }]}>|</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={[s.footerLink, { color: colors.textMuted }]}>Privacy</Text>
          </TouchableOpacity>
          <Text style={[s.footerSep, { color: colors.textFaint }]}>|</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={[s.footerLink, { color: colors.textMuted }]}>Terms</Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.footerVersion, { color: colors.textFaint }]}>
          Track <Text style={{ fontFamily: theme.fontMono }}>v{VERSION}</Text>
        </Text>
        <Text style={[s.footerCopy, { color: colors.textFaint }]}>
          © 2026 defaltho & Luis Miguel. All rights reserved.
        </Text>
      </View>

      {/* Changelog modal */}
      <TrackModal open={showChangelog} title="What's new" onClose={() => setShowChangelog(false)}>
        <View style={{ gap: 18 }}>
          {CHANGELOG.map(entry => (
            <View key={entry.version} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 18, fontFamily: theme.fontBlack, color: colors.text, letterSpacing: -0.4 }}>v{entry.version}</Text>
                <Text style={{ fontSize: 12, fontFamily: theme.fontMono, color: colors.textMuted }}>{entry.date}</Text>
              </View>
              <Text style={{ fontSize: 14, fontFamily: theme.fontBold, color: colors.text }}>{entry.summary}</Text>
              {entry.notes && entry.notes.length > 0 && (
                <View style={{ gap: 4, marginTop: 4 }}>
                  {entry.notes.map((n, i) => (
                    <Text key={i} style={{ fontSize: 13, fontFamily: theme.fontRegular, color: colors.textMuted, lineHeight: 20 }}>· {n}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </TrackModal>

      {/* New account confirm */}
      <TrackModal open={showNewAccount} title="Set up new account?" onClose={() => setShowNewAccount(false)}>
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 14, color: colors.text, fontFamily: theme.fontRegular, lineHeight: 22 }}>
            This signs you out and wipes all local data (subscriptions, events, tasks). You'll be sent to the login screen to create a fresh account.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button label="Cancel" variant="secondary" size="md" onPress={() => setShowNewAccount(false)} />
            <View style={{ flex: 1 }}>
              <Button label="Wipe & sign out" variant="danger" size="md" onPress={newAccount} fullWidth />
            </View>
          </View>
        </View>
      </TrackModal>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: theme.sp4, gap: theme.sp2, paddingBottom: 32 },

  pageTitle: {
    fontSize: 34,
    fontFamily: theme.fontBlack,
    letterSpacing: -1,
    marginBottom: theme.sp4,
  },

  sectionLabel: {
    fontSize: 10,
    fontFamily: theme.fontMedium,
    letterSpacing: 1.6,
    marginTop: theme.sp4,
    marginBottom: theme.sp2,
    marginLeft: theme.sp1,
  },

  card: {
    borderRadius: theme.radiusXl,
    overflow: 'hidden',
    ...Platform.select({
      // Mobile keeps a faint card lift (different surface model per system spec)
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
      // Desktop notebook: borders-only — no shadow on content
      web: {},
    }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sp5,
    paddingVertical: theme.sp4,
    minHeight: 52,
  },
  rowLabel: {
    fontSize: theme.textBase,
    fontFamily: theme.fontMedium,
  },
  rowSub: {
    fontSize: theme.textXs,
    fontFamily: theme.fontRegular,
    marginTop: 2,
  },
  chevron: {
    fontSize: theme.textSm,
    fontFamily: theme.fontRegular,
  },

  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sp3,
  },
  themeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggle: {
    width: 36, height: 20, borderRadius: 12, borderWidth: 1,
    padding: 2, justifyContent: 'center',
  },
  toggleKnob: {
    width: 14, height: 14, borderRadius: 7,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: theme.sp5,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  budgetInput: {
    width: 88,
    height: 36,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radiusMd,
    paddingHorizontal: theme.sp3,
    fontSize: theme.textBase,
    fontFamily: theme.fontMono,
    textAlign: 'right',
  },

  pillRow: {
    flexDirection: 'row',
    gap: theme.sp2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radiusSm,
    borderWidth: 1,
  },
  pillText: {
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    letterSpacing: 0.3,
  },

  importWrap: { paddingHorizontal: theme.sp5, paddingBottom: theme.sp4 },
  importInput: {
    borderWidth: 1,
    borderRadius: theme.radiusMd,
    paddingHorizontal: theme.sp3,
    paddingVertical: theme.sp3,
    fontSize: theme.textSm,
    fontFamily: theme.fontRegular,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: theme.textXs,
    fontFamily: theme.fontMedium,
  },
  importActions: {
    flexDirection: 'row',
    gap: theme.sp3,
  },
  btn: {
    paddingVertical: 13,
    paddingHorizontal: theme.sp4,
    borderRadius: theme.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: theme.textSm,
    fontFamily: theme.fontBold,
  },

  /* Footer */
  footer: {
    marginTop: theme.sp6 * 2,
    paddingTop: theme.sp5,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: theme.sp2,
    paddingBottom: theme.sp3,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: theme.fontMedium,
  },
  footerSep: {
    fontSize: 11,
    fontFamily: theme.fontRegular,
  },
  footerVersion: {
    fontSize: 11,
    fontFamily: theme.fontRegular,
    marginTop: 2,
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: theme.fontRegular,
  },
})
