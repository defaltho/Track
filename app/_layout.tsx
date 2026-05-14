import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Toast } from '../src/components/ui/Toast'
import { View, Platform, StyleSheet } from 'react-native'
import { ThemeProvider, useTheme } from '../src/context/ThemeContext'
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

const SHELL_W = 393

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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  const inner = (
    <SafeAreaProvider>
      <View style={[s.app, { backgroundColor: colors.bg }]}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </View>
    </SafeAreaProvider>
  )

  if (Platform.OS !== 'web') return inner

  return (
    <View style={s.webBg}>
      <View style={[s.phone, { backgroundColor: colors.bg }] as any}>
        {inner}
      </View>
    </View>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}

const s = StyleSheet.create({
  app: { flex: 1 },
  webBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phone: { width: SHELL_W, height: '100vh' as any, overflow: 'hidden' },
})
