import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Toast } from '../src/components/ui/Toast'
import { View } from 'react-native'
import { theme } from '../src/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </View>
    </SafeAreaProvider>
  )
}
