import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { useDataStore } from '../../stores/data'
import { useToastStore } from '../../stores/toasts'
import { theme } from '../../theme'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function CategoryManager() {
  const { colors } = useTheme()
  const store = useDataStore()
  const toast = useToastStore()

  const customCategories: string[] = store.settings.customCategories ?? []

  const [newCat, setNewCat]               = useState('')
  const [editTarget, setEditTarget]       = useState<string | null>(null)
  const [editValue, setEditValue]         = useState('')
  const [deleteTarget, setDeleteTarget]   = useState<string | null>(null)

  function openEdit(cat: string) { setEditTarget(cat); setEditValue(cat) }
  function closeEdit() { setEditTarget(null); setEditValue('') }

  function handleAdd() {
    const cat = newCat.trim()
    if (!cat) return
    if (customCategories.map(c => c.toLowerCase()).includes(cat.toLowerCase())) {
      toast.push('Category already exists', 'error'); return
    }
    store.updateSettings({ customCategories: [...customCategories, cat] })
    setNewCat('')
  }

  function doRename() {
    const newName = editValue.trim()
    if (!newName || newName === editTarget) { closeEdit(); return }
    if (customCategories.map(c => c.toLowerCase()).includes(newName.toLowerCase())) {
      toast.push('Category already exists', 'error'); return
    }
    const old = editTarget!
    store.updateSettings({ customCategories: customCategories.map(c => c === old ? newName : c) })
    store.subscriptions.filter(s => s.category === old).forEach(s => store.updateSubscription(s.id, { category: newName }))
    store.apps.filter(a => a.category === old).forEach(a => store.updateApp(a.id, { category: newName }))
    store.events.filter(e => e.category === old).forEach(e => store.updateEvent(e.id, { category: newName }))
    store.tasks.filter(t => t.category === old).forEach(t => store.updateTask(t.id, { category: newName }))
    ;(store.habits ?? []).filter(h => h.category === old).forEach(h => store.updateHabit(h.id, { category: newName }))
    ;(store.goals ?? []).filter(g => g.category === old).forEach(g => store.updateGoal(g.id, { category: newName }))
    toast.push('Category renamed', 'success')
    closeEdit()
  }

  function doDelete() {
    const cat = deleteTarget!
    const fallback = 'Other'
    store.updateSettings({ customCategories: customCategories.filter(c => c !== cat) })
    store.subscriptions.filter(s => s.category === cat).forEach(s => store.updateSubscription(s.id, { category: fallback }))
    store.apps.filter(a => a.category === cat).forEach(a => store.updateApp(a.id, { category: fallback }))
    store.events.filter(e => (e as any).category === cat).forEach(e => store.updateEvent(e.id, { category: fallback } as any))
    store.tasks.filter(t => (t as any).category === cat).forEach(t => store.updateTask(t.id, { category: fallback } as any))
    ;(store.habits ?? []).filter(h => h.category === cat).forEach(h => store.updateHabit(h.id, { category: fallback }))
    ;(store.goals ?? []).filter(g => g.category === cat).forEach(g => store.updateGoal(g.id, { category: fallback }))
    toast.push('Category removed', 'info')
    setDeleteTarget(null)
  }

  const ic = { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }

  return (
    <View style={[s.card, { backgroundColor: colors.surface }]}>
      <View style={{ padding: theme.sp5, gap: theme.sp3 }}>

        {/* List */}
        {customCategories.length === 0 ? (
          <Text style={[s.empty, { color: colors.textFaint }]}>No custom categories yet.</Text>
        ) : (
          <View style={[s.list, { borderColor: colors.border }]}>
            {customCategories.map((cat, i) => (
              <React.Fragment key={cat}>
                {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
                <View style={s.row}>
                  <Text style={[s.catName, { color: colors.text }]} numberOfLines={1}>{cat}</Text>
                  <View style={s.actions}>
                    <Pressable onPress={() => openEdit(cat)} hitSlop={8} style={s.actionBtn}>
                      <Text style={s.actionEmoji}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => setDeleteTarget(cat)} hitSlop={8} style={s.actionBtn}>
                      <Text style={s.actionEmoji}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Add new */}
        <View style={s.addRow}>
          <TextInput
            style={[s.addInput, ic]}
            value={newCat}
            onChangeText={setNewCat}
            onSubmitEditing={handleAdd}
            placeholder="New category…"
            placeholderTextColor={colors.textFaint}
            returnKeyType="done"
            autoCapitalize="words"
          />
          <Button label="+ Add" variant="primary" size="sm" onPress={handleAdd} />
        </View>
      </View>

      {/* Edit modal */}
      <Modal open={editTarget !== null} title="Rename Category" onClose={closeEdit}>
        <View style={{ gap: theme.sp4 }}>
          <TextInput
            style={[s.editInput, ic]}
            value={editValue}
            onChangeText={setEditValue}
            onSubmitEditing={doRename}
            autoFocus
            returnKeyType="done"
            autoCapitalize="words"
          />
          <View style={s.modalActions}>
            <Button label="Cancel" variant="secondary" size="md" onPress={closeEdit} />
            <View style={{ flex: 1 }}>
              <Button label="Save" variant="primary" size="md" onPress={doRename} fullWidth />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={deleteTarget !== null} title="Remove category?" onClose={() => setDeleteTarget(null)}>
        <View style={{ gap: theme.sp4 }}>
          <Text style={{ fontSize: theme.textSm, color: colors.text, fontFamily: theme.fontRegular, lineHeight: 20 }}>
            Items using <Text style={{ fontFamily: theme.fontBold }}>"{deleteTarget}"</Text> will be moved to "Other".
          </Text>
          <View style={s.modalActions}>
            <Button label="Cancel" variant="secondary" size="md" onPress={() => setDeleteTarget(null)} />
            <View style={{ flex: 1 }}>
              <Button label="Remove" variant="danger" size="md" onPress={doDelete} fullWidth />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: theme.radiusXl, overflow: 'hidden' },
  list: { borderRadius: theme.radiusMd, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.sp4, paddingVertical: 11, minHeight: 44 },
  catName: { flex: 1, fontSize: theme.textSm, fontFamily: theme.fontMedium },
  actions: { flexDirection: 'row', gap: theme.sp2 },
  actionBtn: { padding: 4 },
  actionEmoji: { fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth },
  addRow: { flexDirection: 'row', gap: theme.sp2, alignItems: 'center' },
  addInput: { flex: 1, height: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, fontSize: theme.textSm, fontFamily: theme.fontRegular },
  editInput: { height: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, fontSize: theme.textBase, fontFamily: theme.fontRegular },
  modalActions: { flexDirection: 'row', gap: theme.sp3 },
  empty: { fontSize: theme.textSm, fontFamily: theme.fontRegular, fontStyle: 'italic', textAlign: 'center', paddingVertical: theme.sp2 },
})
