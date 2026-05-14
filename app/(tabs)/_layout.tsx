import { Tabs } from 'expo-router'
import { View, Text, Platform, StyleSheet } from 'react-native'
import { theme } from '../../src/theme'
const TAB_ICONS: Record<string, string> = {
  index: '◉',
  calendar: '◷',
  analytics: '◈',
}

const TAB_LABELS: Record<string, string> = {
  index: 'Dashboard',
  calendar: 'Calendar',
  analytics: 'Analytics',
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[s.iconWrap, focused && s.iconWrapActive]}>
      <Text style={[s.icon, focused && s.iconActive]}>{TAB_ICONS[name] ?? '○'}</Text>
      <Text style={[s.label, focused && s.labelActive]}>{TAB_LABELS[name]}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }: { focused: boolean }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarStyle: s.tabBar,
        tabBarItemStyle: s.tabItem,
        tabBarBackground: () => <View style={s.tabBarBg} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
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
    borderRadius: theme.radiusFull,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }) as object,
  },
  tabBarBg: {
    flex: 1,
    borderRadius: theme.radiusFull,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabItem: {
    height: 68,
    paddingVertical: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radiusFull,
    gap: 2,
    minWidth: 64,
  },
  iconWrapActive: {
    backgroundColor: theme.accent,
  },
  icon: {
    fontSize: 18,
    color: theme.textMuted,
  },
  iconActive: {
    color: theme.accentFg,
  },
  label: {
    fontSize: 9,
    fontFamily: theme.fontBold,
    letterSpacing: 0.3,
    color: theme.textMuted,
  },
  labelActive: {
    color: theme.accentFg,
  },
})
