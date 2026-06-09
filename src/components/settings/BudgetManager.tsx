import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { useDataStore } from '../../stores/data'
import { useToastStore } from '../../stores/toasts'
import { theme, CURRENCY_SYMBOL } from '../../theme'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Segmented'

const DEFAULT_CATEGORIES = [
  'Streaming', 'Music', 'Productivity', 'Gaming', 'Fitness', 'Health',
  'Food', 'Travel', 'Other',
]

export function BudgetManager() {
  const { colors } = useTheme()
  const store = useDataStore()
  const toast = useToastStore()

  const budgets = store.budgets ?? []
  const currency = store.settings.defaultCurrency ?? 'EUR'
  const symbol = CURRENCY_SYMBOL[currency] ?? ''
  const customCategories = store.settings.customCategories ?? []
  const allCategories = ['All', ...customCategories, ...DEFAULT_CATEGORIES.filter(c => !customCategories.includes(c))]

  const [newCategory, setNewCategory] = useState(allCategories[0])
  const [newAmount, setNewAmount]     = useState('')
  const [newPeriod, setNewPeriod]     = useState<'monthly' | 'yearly'>('monthly')
  const [editTarget, setEditTarget]   = useState<string | null>(null)
  const [editAmount, setEditAmount]   = useState('')
  const [editPeriod, setEditPeriod]   = useState<'monthly' | 'yearly'>('monthly')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  function handleAdd() {
    const amt = parseFloat(newAmount.replace(',', '.'))
    if (isNaN(amt) || amt <= 0) { toast.push('Enter a valid amount', 'error'); return }
    if (budgets.some(b => b.category === newCategory)) {
      toast.push('Budget for this category already exists', 'error'); return
    }
    store.addBudget({ category: newCategory, amount: Math.round(amt * 100) / 100, period: newPeriod })
    setNewAmount('')
    toast.push('Budget added', 'success')
  }

  function openEdit(id: string) {
    const b = budgets.find(b => b.id === id)
    if (!b) return
    setEditTarget(id)
    setEditAmount(String(b.amount))
    setEditPeriod(b.period)
  }

  function doEdit() {
    const amt = parseFloat(editAmount.replace(',', '.'))
    if (isNaN(amt) || amt <= 0) { toast.push('Enter a valid amount', 'error'); return }
    store.updateBudget(editTarget!, { amount: Math.round(amt * 100) / 100, period: editPeriod })
    toast.push('Budget updated', 'success')
    setEditTarget(null)
  }

  function doDelete() {
    store.removeBudget(deleteTarget!)
    toast.push('Budget removed', 'info')
    setDeleteTarget(null)
  }

  const ic = { backgroundColor: colors.surfaceEl, borderColor: colors.border, color: colors.text }

  return (
    <View style={[bm.card, { backgroundColor: colors.surface }]}>
      <View style={{ padding: theme.sp5, gap: theme.sp3 }}>

        {budgets.length === 0 ? (
          <Text style={[bm.empty, { color: colors.textFaint }]}>Nenhum budget definido.</Text>
        ) : (
          <View style={[bm.list, { borderColor: colors.border }]}>
            {budgets.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <View style={[bm.divider, { backgroundColor: colors.border }]} />}
                <View style={bm.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[bm.catName, { color: colors.text }]} numberOfLines={1}>{b.category}</Text>
                    <Text style={[bm.sub, { color: colors.textMuted }]}>
                      {symbol}{b.amount.toFixed(0)} / {b.period === 'monthly' ? 'mês' : 'ano'}
                    </Text>
                  </View>
                  <View style={bm.actions}>
                    <Pressable onPress={() => openEdit(b.id)} hitSlop={8} style={bm.actionBtn}>
                      <Text style={bm.actionEmoji}>✏️</Text>
                    </Pressable>
                    <Pressable onPress={() => setDeleteTarget(b.id)} hitSlop={8} style={bm.actionBtn}>
                      <Text style={bm.actionEmoji}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Add form */}
        <View style={bm.addSection}>
          <View style={bm.categoryRow}>
            {allCategories.slice(0, 6).map(cat => (
              <Pressable
                key={cat}
                onPress={() => setNewCategory(cat)}
                style={[
                  bm.catChip,
                  { backgroundColor: newCategory === cat ? colors.accent + '22' : colors.surfaceEl,
                    borderColor: newCategory === cat ? colors.accent : 'transparent' },
                ]}
              >
                <Text style={[bm.catChipTxt, { color: newCategory === cat ? colors.accent : colors.textMuted }]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={bm.addRow}>
            <TextInput
              style={[bm.amountInput, ic]}
              value={newAmount}
              onChangeText={setNewAmount}
              onSubmitEditing={handleAdd}
              placeholder={`${symbol}0`}
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <Segmented
              options={['monthly', 'yearly']}
              value={newPeriod}
              onChange={v => setNewPeriod(v as 'monthly' | 'yearly')}
              layout="fit"
              size="sm"
            />
            <Button label="+ Add" variant="primary" size="sm" onPress={handleAdd} />
          </View>
        </View>
      </View>

      {/* Edit modal */}
      <Modal open={editTarget !== null} title="Edit Budget" onClose={() => setEditTarget(null)}>
        <View style={{ gap: theme.sp4 }}>
          <TextInput
            style={[bm.editInput, ic]}
            value={editAmount}
            onChangeText={setEditAmount}
            autoFocus
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder={`${symbol}0`}
            placeholderTextColor={colors.textFaint}
          />
          <Segmented
            options={['monthly', 'yearly']}
            value={editPeriod}
            onChange={v => setEditPeriod(v as 'monthly' | 'yearly')}
            layout="fit"
            size="sm"
          />
          <View style={bm.modalActions}>
            <Button label="Cancel" variant="secondary" size="md" onPress={() => setEditTarget(null)} />
            <View style={{ flex: 1 }}>
              <Button label="Save" variant="primary" size="md" onPress={doEdit} fullWidth />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteTarget !== null} title="Remove budget?" onClose={() => setDeleteTarget(null)}>
        <View style={{ gap: theme.sp4 }}>
          <Text style={{ fontSize: theme.textSm, color: colors.text, fontFamily: theme.fontRegular, lineHeight: 20 }}>
            Remove the budget for <Text style={{ fontFamily: theme.fontBold }}>"{budgets.find(b => b.id === deleteTarget)?.category}"</Text>?
          </Text>
          <View style={bm.modalActions}>
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

const bm = StyleSheet.create({
  card:       { borderRadius: theme.radiusXl, overflow: 'hidden' },
  list:       { borderRadius: theme.radiusMd, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.sp4, paddingVertical: 11, minHeight: 48 },
  catName:    { fontSize: theme.textSm, fontFamily: theme.fontMedium },
  sub:        { fontSize: 11, fontFamily: theme.fontMono, marginTop: 2 },
  actions:    { flexDirection: 'row', gap: theme.sp2 },
  actionBtn:  { padding: 4 },
  actionEmoji:{ fontSize: 15 },
  divider:    { height: StyleSheet.hairlineWidth },
  addSection: { gap: theme.sp2 },
  categoryRow:{ flexDirection: 'row', gap: theme.sp2, flexWrap: 'wrap' },
  catChip:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  catChipTxt: { fontSize: 12, fontFamily: theme.fontMedium },
  addRow:     { flexDirection: 'row', gap: theme.sp2, alignItems: 'center' },
  amountInput:{ width: 72, height: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, fontSize: theme.textSm, fontFamily: theme.fontMono, textAlign: 'right' },
  editInput:  { height: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: theme.radiusMd, paddingHorizontal: theme.sp3, fontSize: theme.textBase, fontFamily: theme.fontMono },
  modalActions:{ flexDirection: 'row', gap: theme.sp3 },
  empty:      { fontSize: theme.textSm, fontFamily: theme.fontRegular, fontStyle: 'italic', textAlign: 'center', paddingVertical: theme.sp2 },
})
