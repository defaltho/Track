import React from 'react'
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { theme } from '../../theme'

const SCREEN_H = Dimensions.get('window').height

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children?: React.ReactNode
}

export function Modal({ open, title, onClose, children }: Props) {
  const { colors } = useTheme()

  return (
    <RNModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <Pressable style={s.pressable} onPress={e => e.stopPropagation()}>
            <View style={[s.sheet, { backgroundColor: colors.surface }]}>
              {/* Drag handle */}
              <View style={s.handleWrap}>
                <View style={[s.handle, { backgroundColor: colors.borderStrong }]} />
              </View>

              {/* Header */}
              <View style={s.header}>
                <Text style={[s.title, { color: colors.text }]}>{title}</Text>
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.surfaceEl }]} onPress={onClose}>
                  <Text style={[s.closeX, { color: colors.textMuted }]}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Scrollable content */}
              <ScrollView
                style={s.body}
                contentContainerStyle={s.bodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={Platform.OS === 'ios'}
              >
                {children}
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </RNModal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  kav: {
    width: '100%',
    maxWidth: 520,
    justifyContent: 'flex-end',
  },
  pressable: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    maxHeight: SCREEN_H * 0.88,
    flexDirection: 'column',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 24 },
      web: { boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    flexShrink: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.sp5,
    paddingTop: theme.sp3,
    paddingBottom: theme.sp4,
    flexShrink: 0,
  },
  title: {
    fontSize: 22,
    fontFamily: theme.fontBlack,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: theme.fontLight,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingHorizontal: theme.sp5,
    paddingBottom: 40,
  },
})
