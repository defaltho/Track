import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Types ─────────────────────────────────────────────────────────────────

export type SpaceType = 'family' | 'couple' | 'house'
export type Currency  = 'EUR' | 'USD' | 'GBP' | 'BRL'
export type SplitMode = 'equal' | 'percent' | 'exact' | 'single'

export interface Space {
  id:            string
  name:          string
  type:          SpaceType
  createdBy:     string       // userId of admin
  currency:      Currency
  monthlyBudget: number | null
  createdAt:     string
  updatedAt:     string
}

export interface Member {
  id:          string
  spaceId:     string
  userId:      string
  displayName: string
  initial:     string
  color:       string
  role:        'admin' | 'member'
  joinedAt:    string
}

export interface Invite {
  id:                 string
  spaceId:            string
  code:               string       // "TRK-7X4P"
  createdBy:          string       // memberId
  expiresAt:          string
  usedAt:             string | null
  approvedAt:         string | null
  rejectedAt:         string | null
  pendingDisplayName: string | null
}

export type Split =
  | { mode: 'equal';   members: string[] }
  | { mode: 'percent'; shares: Record<string, number> }
  | { mode: 'exact';   shares: Record<string, number> }
  | { mode: 'single';  member: string }

export interface SharedExpense {
  id:        string
  spaceId:   string
  kind:      'expense' | 'settlement'
  name:      string
  emoji:     string | null
  amount:    number
  currency:  Currency
  category:  string
  date:      string
  paidBy:    string       // memberId
  split:     Split
  note:      string
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  id:                 string
  spaceId:            string
  fromMember:         string
  toMember:           string
  amount:             number
  currency:           Currency
  method:             'mbway' | 'revolut' | 'sepa' | 'cash' | 'marked'
  settledExpenseIds:  string[]
  date:               string
  createdAt:          string
}

// ── Helpers ───────────────────────────────────────────────────────────────

export const MEMBER_PALETTE = [
  '#fde8b8', '#cfe7d6', '#dcd6ff', '#f8d0c4',
  '#bcdff1', '#f0c8d8', '#ddeacf', '#e4d4b6',
]

export const SPACE_DEFAULTS: Record<SpaceType, { maxMembers: number; defaultSplit: SplitMode }> = {
  family: { maxMembers: 8,  defaultSplit: 'equal' },
  couple: { maxMembers: 2,  defaultSplit: 'equal' },
  house:  { maxMembers: 6,  defaultSplit: 'equal' },
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function now() { return new Date().toISOString() }

function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TRK-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ── Store ─────────────────────────────────────────────────────────────────

interface FamilyState {
  spaces:              Space[]
  members:             Member[]
  invites:             Invite[]
  sharedExpenses:      SharedExpense[]
  settlements:         Settlement[]
  activeSpaceId:       string | null

  // Space
  createSpace:   (input: { name: string; type: SpaceType; currency: Currency; userId: string; displayName: string; initial: string }) => Space
  setActiveSpace: (id: string | null) => void
  archiveSpace:  (id: string) => void
  leaveSpace:    (spaceId: string, userId: string) => void
  updateSpace:   (id: string, patch: Partial<Pick<Space, 'name' | 'currency' | 'monthlyBudget'>>) => void

  // Invite
  createInvite:  (spaceId: string, adminMemberId: string) => Invite
  consumeInvite: (code: string, displayName: string) => Invite | { error: 'expired' | 'invalid' | 'used' }
  approveInvite: (inviteId: string, newUserId: string) => Member | { error: string }
  rejectInvite:  (inviteId: string) => void

  // Expense
  addSharedExpense:    (e: Omit<SharedExpense, 'id' | 'createdAt' | 'updatedAt'>) => SharedExpense
  updateSharedExpense: (id: string, patch: Partial<Omit<SharedExpense, 'id' | 'createdAt'>>) => void
  removeSharedExpense: (id: string) => void

  // Settle
  settle: (input: Omit<Settlement, 'id' | 'createdAt'>) => Settlement
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      spaces:         [],
      members:        [],
      invites:        [],
      sharedExpenses: [],
      settlements:    [],
      activeSpaceId:  null,

      // ── Space ──────────────────────────────────────────────────────────
      createSpace: ({ name, type, currency, userId, displayName, initial }) => {
        const spaceId  = generateId()
        const memberId = generateId()
        const space: Space = {
          id: spaceId, name, type, createdBy: userId, currency,
          monthlyBudget: null, createdAt: now(), updatedAt: now(),
        }
        const adminMember: Member = {
          id: memberId, spaceId, userId, displayName, initial,
          color: MEMBER_PALETTE[0],
          role: 'admin', joinedAt: now(),
        }
        set(s => ({
          spaces:  [...s.spaces, space],
          members: [...s.members, adminMember],
          activeSpaceId: spaceId,
        }))
        return space
      },

      setActiveSpace: (id) => set(() => ({ activeSpaceId: id })),

      archiveSpace: (id) =>
        set(s => ({ spaces: s.spaces.filter(sp => sp.id !== id), activeSpaceId: s.activeSpaceId === id ? null : s.activeSpaceId })),

      leaveSpace: (spaceId, userId) =>
        set(s => ({
          members: s.members.filter(m => !(m.spaceId === spaceId && m.userId === userId)),
          activeSpaceId: s.activeSpaceId === spaceId ? null : s.activeSpaceId,
        })),

      updateSpace: (id, patch) =>
        set(s => ({
          spaces: s.spaces.map(sp => sp.id === id ? { ...sp, ...patch, updatedAt: now() } : sp),
        })),

      // ── Invite ─────────────────────────────────────────────────────────
      createInvite: (spaceId, adminMemberId) => {
        // Invalidate previous pending invite for this space
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
        const invite: Invite = {
          id: generateId(), spaceId, code: makeInviteCode(),
          createdBy: adminMemberId, expiresAt,
          usedAt: null, approvedAt: null, rejectedAt: null, pendingDisplayName: null,
        }
        set(s => ({
          invites: [
            // Invalidate previous open invites for this space by expiring them
            ...s.invites.map(i => i.spaceId === spaceId && !i.usedAt && !i.approvedAt && !i.rejectedAt
              ? { ...i, rejectedAt: now() }
              : i
            ),
            invite,
          ],
        }))
        return invite
      },

      consumeInvite: (code, displayName) => {
        const invite = get().invites.find(i => i.code === code)
        if (!invite) return { error: 'invalid' as const }
        if (invite.usedAt) return { error: 'used' as const }
        if (new Date(invite.expiresAt) < new Date()) return { error: 'expired' as const }
        const updated = { ...invite, usedAt: now(), pendingDisplayName: displayName }
        set(s => ({ invites: s.invites.map(i => i.id === invite.id ? updated : i) }))
        return updated
      },

      approveInvite: (inviteId, newUserId) => {
        const invite = get().invites.find(i => i.id === inviteId)
        if (!invite || !invite.usedAt || invite.approvedAt) return { error: 'invalid invite state' }
        const spaceMembers = get().members.filter(m => m.spaceId === invite.spaceId)
        const palette = MEMBER_PALETTE[spaceMembers.length % MEMBER_PALETTE.length]
        const displayName = invite.pendingDisplayName ?? 'Member'
        const newMember: Member = {
          id: generateId(), spaceId: invite.spaceId, userId: newUserId,
          displayName, initial: displayName.charAt(0).toUpperCase(),
          color: palette, role: 'member', joinedAt: now(),
        }
        set(s => ({
          invites: s.invites.map(i => i.id === inviteId ? { ...i, approvedAt: now() } : i),
          members: [...s.members, newMember],
        }))
        return newMember
      },

      rejectInvite: (inviteId) =>
        set(s => ({ invites: s.invites.map(i => i.id === inviteId ? { ...i, rejectedAt: now() } : i) })),

      // ── Expense ────────────────────────────────────────────────────────
      addSharedExpense: (e) => {
        const expense: SharedExpense = { ...e, id: generateId(), createdAt: now(), updatedAt: now() }
        set(s => ({ sharedExpenses: [...s.sharedExpenses, expense] }))
        return expense
      },

      updateSharedExpense: (id, patch) =>
        set(s => ({
          sharedExpenses: s.sharedExpenses.map(e => e.id === id ? { ...e, ...patch, updatedAt: now() } : e),
        })),

      removeSharedExpense: (id) =>
        set(s => ({ sharedExpenses: s.sharedExpenses.filter(e => e.id !== id) })),

      // ── Settle ─────────────────────────────────────────────────────────
      settle: (input) => {
        const settlement: Settlement = { ...input, id: generateId(), createdAt: now() }
        // Also push a SharedExpense of kind 'settlement' for the timeline
        const timelineEntry: SharedExpense = {
          id: generateId(), spaceId: input.spaceId, kind: 'settlement',
          name: 'Liquidação', emoji: '💸', amount: input.amount, currency: input.currency,
          category: 'Liquidação', date: input.date,
          paidBy: input.fromMember,
          split: { mode: 'single', member: input.toMember },
          note: '', createdAt: now(), updatedAt: now(),
        }
        set(s => ({
          settlements: [...s.settlements, settlement],
          sharedExpenses: [...s.sharedExpenses, timelineEntry],
        }))
        return settlement
      },
    }),
    {
      name: 'track-family-data',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
