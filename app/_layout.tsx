import { Stack, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Toast } from '../src/components/ui/Toast'
import { View, StyleSheet, Platform } from 'react-native'
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'
import { useAuthStore } from '../src/stores/auth'
import { useDataStore } from '../src/stores/data'
import { loadSeedData } from '../src/utils/seedData'
import {
  useFonts,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto'
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

function AppShell() {
  const [fontsLoaded] = useFonts({
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  })
  const { colors } = useTheme()
  const router = useRouter()
  const segments = useSegments()

  const user       = useAuthStore(s => s.user)
  const onboarding = useAuthStore(s => s.onboarding)
  const hydrated   = useAuthStore(s => s._hydrated)

  // Hide splash once fonts and auth store are ready
  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync()
  }, [fontsLoaded, hydrated])

  // Seed placeholder data on first launch when data store is empty
  useEffect(() => {
    function maybeSeed() {
      const s = useDataStore.getState()
      const empty = s.subscriptions.length === 0 && s.apps.length === 0 && s.events.length === 0 && s.tasks.length === 0
      if (empty) loadSeedData(s)
    }
    if (useDataStore.persist.hasHydrated()) {
      maybeSeed()
      return
    }
    const unsub = useDataStore.persist.onFinishHydration(() => maybeSeed())
    return unsub
  }, [])

  // Auth routing guard
  useEffect(() => {
    if (!fontsLoaded || !hydrated) return

    const inLogin      = segments[0] === 'login'
    const inOnboarding = segments[0] === 'onboarding'

    if (!user) {
      if (!inLogin) router.replace('/login')
    } else if (!onboarding) {
      if (!inOnboarding) router.replace('/onboarding')
    } else {
      if (inLogin || inOnboarding) router.replace('/(tabs)')
    }
  }, [user, onboarding, hydrated, fontsLoaded, segments])

  if (!fontsLoaded || !hydrated) return null

  // Full-screen on web — no phone frame
  return (
    <SafeAreaProvider>
      <View style={[s.root, { backgroundColor: colors.bg }]}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </View>
    </SafeAreaProvider>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, ...Platform.select({ web: { minHeight: '100vh' as any } }) },
})
