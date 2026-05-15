import { Tabs, useRouter, usePathname } from 'expo-router'
import { View, Text, Platform, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../src/context/ThemeContext'
import { Colors } from '../../src/theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const BREAK = 768

const NAV = [
  { name: 'index',     href: '/',           activeIc: 'radio-button-on'        as IoniconName, inactiveIc: 'radio-button-off-outline' as IoniconName, label: 'Track'     },
  { name: 'calendar',  href: '/calendar',   activeIc: 'calendar'               as IoniconName, inactiveIc: 'calendar-outline'         as IoniconName, label: 'Calendar'  },
  { name: 'analytics', href: '/analytics',  activeIc: 'bar-chart'              as IoniconName, inactiveIc: 'bar-chart-outline'        as IoniconName, label: 'Analytics' },
  { name: 'settings',  href: '/settings',   activeIc: 'settings'               as IoniconName, inactiveIc: 'settings-outline'         as IoniconName, label: 'Settings'  },
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

  return (
    <View style={[sb.root, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      <Text style={[sb.brand, { color: colors.text }]}>Ruflo</Text>
      <View style={sb.nav}>
        {NAV.map(item => {
          const isActive = pathname === item.href
          return (
            <TouchableOpacity
              key={item.name}
              style={[sb.item, isActive && { backgroundColor: colors.accent }]}
              onPress={() => router.push(item.href as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.activeIc : item.inactiveIc}
                size={17}
                color={isActive ? colors.accentFg : colors.textMuted}
              />
              <Text style={[sb.itemLabel, { color: isActive ? colors.accentFg : colors.textMuted }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
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
      </View>
    </View>
  )
}

const BAR_H = 64

const sb = StyleSheet.create({
  root:      { width: 220, borderRightWidth: 1, paddingTop: 28, paddingHorizontal: 16 },
  brand:     { fontSize: 22, fontFamily: 'Roboto_900Black', letterSpacing: -0.5, marginBottom: 32, paddingHorizontal: 8 },
  nav:       { gap: 2 },
  item:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  itemLabel: { fontSize: 14, fontFamily: 'Roboto_500Medium' },
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
  tabItem:        { height: BAR_H, paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },
  tabIconContainer: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  iconWrap:       { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 3, minWidth: 62 },
  label:          { fontSize: 9, fontFamily: 'Roboto_700Bold', letterSpacing: 0.4 },
})
