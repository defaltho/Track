import React from 'react'
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { theme } from '../../theme'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children?: React.ReactNode
}

export function Modal({ open, title, onClose, children }: Props) {
  return (
    <RNModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={s.modal}>
              <View style={s.header}>
                <Text style={s.title}>{title}</Text>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <Text style={s.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={s.body}
                contentContainerStyle={s.bodyContent}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </RNModal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  kav: {
    width: '100%',
    maxWidth: 520,
  },
  modal: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radiusXl,
    borderTopRightRadius: theme.radiusXl,
    maxHeight: '88%' as any,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.sp5,
    paddingBottom: theme.sp4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: theme.textLg,
    fontWeight: '700',
    color: theme.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: theme.textMuted,
    lineHeight: 20,
  },
  body: {
    maxHeight: 500,
  },
  bodyContent: {
    padding: theme.sp5,
  },
})
