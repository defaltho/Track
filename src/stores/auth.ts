import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export interface User {
  name: string
  email: string
  initial: string
  provider: 'email' | 'google' | 'apple'
}

export interface OnboardingAnswers {
  uc: string | null       // use case
  tabs: number            // daily tab count bucket
  pain: string | null     // pain point
  feel: string | null     // interface feel
  dob: { m: number; d: number; y: number }
}

interface AuthStore {
  user: User | null
  onboarding: OnboardingAnswers | null
  _hydrated: boolean
  login: (user: User) => void
  logout: () => void
  completeOnboarding: (data: OnboardingAnswers) => void
}

const webStorage = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(typeof window === 'undefined' ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string): Promise<void> =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage.setItem(key, value) : undefined),
  removeItem: (key: string): Promise<void> =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage.removeItem(key) : undefined),
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      onboarding: null,
      _hydrated: false,
      login: (user) => set({ user }),
      logout: () => set({ user: null, onboarding: null }),
      completeOnboarding: (data) => set({ onboarding: data }),
    }),
    {
      name: 'arc-auth',
      storage: createJSONStorage(() =>
        Platform.OS === 'web' ? webStorage : AsyncStorage
      ),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hydrated: true })
      },
    }
  )
)
