import { useState } from 'react'
import { Tabs, useRouter, usePathname } from 'expo-router'
import { View, Text, Platform, StyleSheet, useWindowDimensions, TouchableOpacity, Pressable, Modal } from 'react-native'
import { MotiView } from 'moti'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../src/context/ThemeContext'
import { useAuthStore } from '../../src/stores/auth'
import { Colors } from '../../src/theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const BREAK = 768

type NavItem = { name: string; href: string; activeIc: IoniconName; inactiveIc: IoniconName; label: string }
type NavSection = { section: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Main Menu',
    items: [
      { name: 'index',     href: '/',          activeIc: 'grid'             as IoniconName, inactiveIc: 'grid-outline'             as IoniconName, label: 'Dashboard' },
      { name: 'calendar',  href: '/calendar',  activeIc: 'calendar'         as IoniconName, inactiveIc: 'calendar-outline'         as IoniconName, label: 'Calendar'  },
      { name: 'analytics', href: '/analytics', activeIc: 'bar-chart'        as IoniconName, inactiveIc: 'bar-chart-outline'        as IoniconName, label: 'Analytics' },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { name: 'settings',  href: '/settings',  activeIc: 'settings'         as IoniconName, inactiveIc: 'settings-outline'         as IoniconName, label: 'Settings'  },
    ],
  },
]

const TAB_CFG: Record<string, { active: IoniconName; inactive: IoniconName; label: string }> = {
  index:     { active: 'radio-button-on',   inactive: 'radio-button-off-outline', label: 'Track'    },
  calendar:  { active: 'calendar',          inactive: 'calendar-outline',         label: 'Calendar' },
  analytics: { active: 'bar-chart',         inactive: 'bar-chart-outline',        label: 'Analytics'},
  settings:  { active: 'settings',          inactive: 'settings-outline',         label: 'Settings' },
}

function TabIcon({ name, focused, colors }: { name: string; focused: boolean; colors: Colors }) {
  const cfg = TAB_CFG[name] ?? { active: 'ellipse', inactive: 'ellipse-outline', label: name }
  return (
    <View style={[s.iconWrap, focused && { backgroundColor: colors.accent }]}>
      <Ionicons name={focused ? cfg.active : cfg.inactive} size={18} color={focused ? colors.accentFg : colors.textMuted} />
      <Text style={[s.label, { color: focused ? colors.accentFg : colors.textMuted }]}>{cfg.label}</Text>
    </View>
  )
}

function Sidebar({ colors }: { colors: Colors }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { themeKey, setTheme } = useTheme()
  const [ccOpen, setCcOpen] = useState(false)

  const userName    = user?.name || 'Guest'
  const userEmail   = user?.email || 'no account'
  const userInitial = user?.initial || userName.charAt(0).toUpperCase()

  function handleLogout() {
    setCcOpen(false)
    logout()
    router.replace('/login')
  }

  return (
    <View style={[sb.root, { backgroundColor: colors.bg, borderRightColor: colors.border }]}>
      {/* Brand card */}
      <View style={[sb.brandCard, { backgroundColor: colors.surfaceEl }]}>
        <View style={[sb.brandIcon, { backgroundColor: colors.text }]}>
          <Text style={[sb.brandLetter, { color: colors.bg }]}>T</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[sb.brandKicker, { color: colors.textMuted }]}>Workspace</Text>
          <Text style={[sb.brandName, { color: colors.text }]} numberOfLines={1}>Track</Text>
        </View>
        <View style={sb.brandCarets}>
          <Ionicons name="chevron-up"   size={12} color={colors.textMuted} />
          <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
        </View>
      </View>

      {/* Sections */}
      <View style={sb.scroll}>
        {NAV_SECTIONS.map(section => (
          <View key={section.section} style={sb.section}>
            <Text style={[sb.sectionTitle, { color: colors.text }]}>{section.section}</Text>
            <View style={sb.nav}>
              {section.items.map(item => {
                const isActive = pathname === item.href
                return (
                  <SidebarItem
                    key={item.name}
                    item={item}
                    isActive={isActive}
                    onPress={() => router.push(item.href as any)}
                    colors={colors}
                  />
                )
              })}
            </View>
          </View>
        ))}
      </View>

      {/* User card */}
      <Pressable
        onPress={() => setCcOpen(true)}
        style={({ hovered }: any) => [sb.userCard, { backgroundColor: hovered && Platform.OS === 'web' ? colors.surfaceHigh : colors.surfaceEl }]}
      >
        <View style={[sb.userAvatar, { backgroundColor: colors.accent }]}>
          <Text style={[sb.userInitial, { color: colors.accentFg }]}>{userInitial}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[sb.userName, { color: colors.text }]} numberOfLines={1}>{userName}</Text>
          <Text style={[sb.userRole, { color: colors.textMuted }]} numberOfLines={1}>{userEmail}</Text>
        </View>
        <Ionicons name="chevron-up" size={14} color={colors.textMuted} />
      </Pressable>

      {/* Control center */}
      <ControlCenter
        open={ccOpen}
        onClose={() => setCcOpen(false)}
        colors={colors}
        userName={userName}
        userEmail={userEmail}
        userInitial={userInitial}
        themeKey={themeKey}
        setTheme={setTheme}
        onOpenSettings={() => { setCcOpen(false); router.push('/settings') }}
        onLogout={handleLogout}
      />
    </View>
  )
}

// ── Sidebar item (with hover) ─────────────────────────────────────────
function SidebarItem({
  item, isActive, onPress, colors,
}: {
  item: NavItem
  isActive: boolean
  onPress: () => void
  colors: Colors
}) {
  const [hovered, setHovered] = useState(false)
  const isWeb = Platform.OS === 'web'
  const bg = isActive ? colors.surface : (hovered && isWeb ? colors.surfaceEl : 'transparent')
  const iconBg = isActive ? colors.text : 'transparent'
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
      style={[sb.item, { backgroundColor: bg, borderColor: isActive ? colors.border : 'transparent' }]}
    >
      <View style={[sb.itemIconBox, { backgroundColor: iconBg }]}>
        <Ionicons
          name={isActive ? item.activeIc : item.inactiveIc}
          size={14}
          color={isActive ? colors.bg : colors.textMuted}
        />
      </View>
      <Text style={[sb.itemLabel, { color: isActive ? colors.text : colors.textMuted, fontFamily: isActive ? 'Roboto_700Bold' : 'Roboto_500Medium' }]}>
        {item.label}
      </Text>
    </Pressable>
  )
}

// ── Control Center (user popover) ─────────────────────────────────────
function ControlCenter({
  open, onClose, colors, userName, userEmail, userInitial, themeKey, setTheme, onOpenSettings, onLogout,
}: {
  open: boolean
  onClose: () => void
  colors: Colors
  userName: string
  userEmail: string
  userInitial: string
  themeKey: string
  setTheme: (t: 'light' | 'dark' | 'nothing') => void
  onOpenSettings: () => void
  onLogout: () => void
}) {
  if (!open) return null
  const themes: Array<{ key: 'light' | 'dark' | 'nothing'; label: string; ic: IoniconName }> = [
    { key: 'light',   label: 'Light',   ic: 'sunny-outline' },
    { key: 'dark',    label: 'Dark',    ic: 'moon-outline' },
    { key: 'nothing', label: 'Nothing', ic: 'flash-outline' },
  ]
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={cc.overlay} onPress={onClose}>
        <MotiView
          from={{ opacity: 0, translateY: 8, scale: 0.98 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 180 }}
          style={[cc.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={e => e.stopPropagation()}
        >
          {/* User header */}
          <View style={cc.userHead}>
            <View style={[cc.userAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[cc.userInitial, { color: colors.accentFg }]}>{userInitial}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[cc.userName, { color: colors.text }]} numberOfLines={1}>{userName}</Text>
              <Text style={[cc.userEmail, { color: colors.textMuted }]} numberOfLines={1}>{userEmail}</Text>
            </View>
          </View>

          <View style={[cc.divider, { backgroundColor: colors.border }]} />

          {/* Theme selector */}
          <Text style={[cc.section, { color: colors.textMuted }]}>Appearance</Text>
          <View style={[cc.themeRow, { backgroundColor: colors.surfaceEl }]}>
            {themes.map(t => {
              const active = themeKey === t.key
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTheme(t.key)}
                  style={[cc.themeBtn, active && { backgroundColor: colors.surface }]}
                >
                  <Ionicons name={t.ic} size={14} color={active ? colors.text : colors.textMuted} />
                  <Text style={[cc.themeBtnLabel, { color: active ? colors.text : colors.textMuted, fontFamily: active ? 'Roboto_700Bold' : 'Roboto_500Medium' }]}>
                    {t.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={[cc.divider, { backgroundColor: colors.border }]} />

          {/* Actions */}
          <Pressable style={({ hovered }: any) => [cc.actionRow, hovered && Platform.OS === 'web' && { backgroundColor: colors.surfaceEl }]} onPress={onOpenSettings}>
            <Ionicons name="settings-outline" size={16} color={colors.text} />
            <Text style={[cc.actionLabel, { color: colors.text }]}>Open Settings</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </Pressable>
          <Pressable style={({ hovered }: any) => [cc.actionRow, hovered && Platform.OS === 'web' && { backgroundColor: colors.surfaceEl }]} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={16} color={colors.danger} />
            <Text style={[cc.actionLabel, { color: colors.danger }]}>Sign out</Text>
          </Pressable>
        </MotiView>
      </Pressable>
    </Modal>
  )
}

export default function TabsLayout() {
  const { colors } = useTheme()
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= BREAK

  return (
    <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
      {isDesktop && <Sidebar colors={colors} />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: isDesktop ? { display: 'none' } : s.tabBar,
            tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} colors={colors} />,
            ...(isDesktop ? {} : {
              tabBarItemStyle: s.tabItem,
              tabBarIconStyle: s.tabIconContainer,
              tabBarBackground: () => (
                <View style={[s.tabBarBg, { backgroundColor: colors.surface, borderColor: colors.border }]} />
              ),
            }),
          })}
        >
          <Tabs.Screen name="index"     options={{ title: 'Track'     }} />
          <Tabs.Screen name="calendar"  options={{ title: 'Calendar'  }} />
          <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
          <Tabs.Screen name="settings"  options={{ title: 'Settings'  }} />
        </Tabs>

        {/* Bottom blur-fade — softens scrolling content behind the floating tab bar (mobile only) */}
        {!isDesktop && <View pointerEvents="none" style={s.bottomBlur} />}
      </View>
    </View>
  )
}

const BAR_H = 64

const sb = StyleSheet.create({
  root:         { width: 240, borderRightWidth: StyleSheet.hairlineWidth, paddingTop: 18, paddingHorizontal: 14, paddingBottom: 14, gap: 18 },

  brandCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14 },
  brandIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandLetter:  { fontSize: 17, fontFamily: 'Roboto_900Black', letterSpacing: -0.5 },
  brandKicker:  { fontSize: 10, fontFamily: 'Roboto_500Medium', letterSpacing: 0.4 },
  brandName:    { fontSize: 14, fontFamily: 'Roboto_700Bold', letterSpacing: -0.3, marginTop: 1 },
  brandCarets:  { alignItems: 'center', justifyContent: 'center', gap: 2 },

  scroll:       { flex: 1, gap: 18 },
  section:      { gap: 6 },
  sectionTitle: { fontSize: 12, fontFamily: 'Roboto_500Medium', letterSpacing: 0.2, paddingHorizontal: 10, marginBottom: 2 },
  nav:          { gap: 2 },
  item:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  itemIconBox:  { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  itemLabel:    { fontSize: 13, letterSpacing: -0.1 },

  userCard:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14 },
  userAvatar:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  userInitial:  { fontSize: 13, fontFamily: 'Roboto_700Bold' },
  userName:     { fontSize: 13, fontFamily: 'Roboto_700Bold', letterSpacing: -0.2 },
  userRole:     { fontSize: 11, fontFamily: 'Roboto_400Regular', marginTop: 1 },
})

const cc = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start',
    paddingLeft: 14, paddingBottom: 70,
    backgroundColor: 'rgba(0,0,0,0.15)',
    ...Platform.select({ web: { backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' } as any, default: {} }),
  },
  panel: {
    width: 280,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0 12px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.08)' } as any,
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 16 },
    }),
  },
  userHead:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 4 },
  userAvatar:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontSize: 15, fontFamily: 'Roboto_700Bold' },
  userName:    { fontSize: 14, fontFamily: 'Roboto_700Bold', letterSpacing: -0.2 },
  userEmail:   { fontSize: 11, fontFamily: 'Roboto_400Regular', marginTop: 1 },

  divider:     { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  section:     { fontSize: 10, fontFamily: 'Roboto_500Medium', letterSpacing: 1.4, paddingHorizontal: 4, textTransform: 'uppercase' },
  themeRow:    { flexDirection: 'row', padding: 3, borderRadius: 10, gap: 2 },
  themeBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  themeBtnLabel:{ fontSize: 11, letterSpacing: -0.1 },

  actionRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  actionLabel: { flex: 1, fontSize: 13, fontFamily: 'Roboto_500Medium', letterSpacing: -0.1 },
})

const s = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24, left: 20, right: 20,
    height: BAR_H,
    borderRadius: BAR_H / 2,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 10 },
    }) as object,
  },
  tabBarBg:       { flex: 1, borderRadius: BAR_H / 2, borderWidth: 1 },
  bottomBlur: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 130,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
      } as any,
      default: {},
    }),
  },
  tabItem:        { height: BAR_H, paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },
  tabIconContainer: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  iconWrap:       { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 3, minWidth: 62 },
  label:          { fontSize: 9, fontFamily: 'Roboto_700Bold', letterSpacing: 0.4 },
})
