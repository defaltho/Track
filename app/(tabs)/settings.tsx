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
import { useDataStore } from '../../src/stores/data'
import { useToastStore } from '../../src/stores/toasts'
import { useTheme } from '../../src/context/ThemeContext'
import { theme } from '../../src/theme'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'BRL']

const NOTHING_RED = '#FF2B2B'

const APP_VERSION = '1.0.0'

export default function Settings() {
  const { colors, themeKey, setTheme } = useTheme()
  const store = useDataStore()
  const toast = useToastStore()
  const [showClear, setShowClear] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

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

  const themeOptions: Array<{ key: 'light' | 'dark' | 'nothing'; label: string; dot: string; desc: string }> = [
    { key: 'light', label: 'Light', dot: colors.accent, desc: 'Clean, minimal' },
    { key: 'dark', label: 'Dark', dot: '#FFFFFF', desc: 'Easy on the eyes' },
    { key: 'nothing', label: 'Nothing', dot: NOTHING_RED, desc: 'High contrast · red accent' },
  ]

  return (
    <ScrollView
      style={[s.page, { backgroundColor: colors.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.text }]}>Settings</Text>

      {/* ── Appearance ── */}
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Appearance</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        {themeOptions.map((opt, i) => {
          const selected = themeKey === opt.key
          const accentColor = opt.key === 'nothing' ? NOTHING_RED : colors.accent
          return (
            <React.Fragment key={opt.key}>
              {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={s.row} onPress={() => setTheme(opt.key)} activeOpacity={0.6}>
                <View style={s.themeRowLeft}>
                  <View style={[s.themeSwatchDot, { backgroundColor: opt.dot, borderColor: opt.key === 'light' ? colors.border : 'transparent' }]} />
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
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Preferences</Text>
      <View style={[s.card, { backgroundColor: colors.surface }]}>
        <View style={s.row}>
          <Text style={[s.rowLabel, { color: colors.text }]}>Currency</Text>
          <View style={s.pillRow}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  s.pill,
                  {
                    backgroundColor: store.settings.defaultCurrency === c ? colors.accent : colors.surfaceEl,
                    borderColor: store.settings.defaultCurrency === c ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => store.updateSettings({ defaultCurrency: c })}
              >
                <Text style={[
                  s.pillText,
                  { color: store.settings.defaultCurrency === c ? colors.accentFg : colors.textMuted },
                ]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Data ── */}
      <Text style={[s.sectionLabel, { color: colors.textMuted }]}>Data</Text>
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
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: colors.surfaceEl, borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => { setShowImport(false); setImportText(''); setImportError('') }}
                >
                  <Text style={[s.btnText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: colors.accent, flex: 1 }]}
                  onPress={handleImport}
                >
                  <Text style={[s.btnText, { color: colors.accentFg }]}>Import</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Danger Zone ── */}
      <Text style={[s.sectionLabel, { color: colors.danger }]}>Danger Zone</Text>
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
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.surfaceEl, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowClear(false)}
              >
                <Text style={[s.btnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: colors.danger, flex: 1 }]}
                onPress={handleClear}
              >
                <Text style={[s.btnText, { color: '#fff' }]}>Delete Everything</Text>
              </TouchableOpacity>
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
          Track v{APP_VERSION}
        </Text>
        <Text style={[s.footerCopy, { color: colors.textFaint }]}>
          © 2026 defaltho. All rights reserved.
        </Text>
      </View>
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
    fontSize: theme.textXs,
    fontFamily: theme.fontBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: theme.sp4,
    marginBottom: theme.sp2,
    marginLeft: theme.sp1,
  },

  card: {
    borderRadius: theme.radiusXl,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
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
  themeSwatchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },

  divider: {
    height: 1,
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
    borderTopWidth: 1,
    alignItems: 'center',
    gap: theme.sp2,
    paddingBottom: 12,
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
