import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Toast } from '../src/components/ui/Toast'
import { View, Platform, StyleSheet, Text } from 'react-native'
import { theme } from '../src/theme'
import {
  useFonts,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

const SHELL_W = 393

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  const isWeb = Platform.OS === 'web'

  const inner = (
    <SafeAreaProvider>
      <View style={styles.app}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </View>
    </SafeAreaProvider>
  )

  if (!isWeb) return inner

  return (
    <View style={styles.webBg}>
      <View style={styles.phoneShell as any}>
        {inner}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  webBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  phoneShell: {
    width: SHELL_W,
    height: '100vh' as any,
    backgroundColor: theme.bg,
    overflow: 'hidden',
  },
})
