import { Tabs } from 'expo-router'
import { View, Text, Platform, StyleSheet } from 'react-native'
import { useTheme } from '../../src/context/ThemeContext'
import { Colors } from '../../src/theme'

const TAB_ICONS: Record<string, string> = {
  index: '◉',
  calendar: '◷',
  analytics: '◈',
  settings: '◎',
}

const TAB_LABELS: Record<string, string> = {
  index: 'Track',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
}

function TabIcon({ name, focused, colors }: { name: string; focused: boolean; colors: Colors }) {
  return (
    <View style={[s.iconWrap, focused && { backgroundColor: colors.accent }]}>
      <Text style={[s.icon, { color: focused ? colors.accentFg : colors.textMuted }]}>
        {TAB_ICONS[name] ?? '○'}
      </Text>
      <Text style={[s.label, { color: focused ? colors.accentFg : colors.textMuted }]}>
        {TAB_LABELS[name]}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }: { focused: boolean }) => (
          <TabIcon name={route.name} focused={focused} colors={colors} />
        ),
        tabBarStyle: s.tabBar,
        tabBarItemStyle: s.tabItem,
        tabBarBackground: () => (
          <View style={[s.tabBarBg, { backgroundColor: colors.surface, borderColor: colors.border }]} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Track' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}

const s = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 68,
    borderRadius: 999,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
      android: { elevation: 12 },
    }) as object,
  },
  tabBarBg: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabItem: { height: 68, paddingVertical: 0 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 2,
    minWidth: 60,
  },
  icon: { fontSize: 17 },
  label: { fontSize: 8, fontFamily: 'Roboto_700Bold', letterSpacing: 0.3 },
})
