# Track — LLM Context Document

> Ingest this file at the start of a session to quickly understand the project.
> Last updated: 2026-05-14

---

## 1. Project Overview

**Track** is a personal finance and life-tracking app built with React Native + Expo.

| Item | Value |
|------|-------|
| Platform | iOS, Android, Web (expo-router) |
| Framework | React Native 0.76.7 / Expo SDK 52 |
| Language | TypeScript 5.3 |
| Router | expo-router 4.0 (file-based, tabs) |
| State | Zustand 5.0 with `persist` + AsyncStorage |
| Charts | react-native-svg 15.8 (custom SVG paths) |
| Date lib | date-fns 4.1 |
| Min Node | whatever Expo SDK 52 requires (Node 18+) |

**Purpose:** Track subscriptions, one-off app purchases, calendar events, and to-do tasks. Show spending analytics and a monthly calendar view.

---

## 2. Architecture

### File Tree

```
app/                          # expo-router entry points (thin re-exports)
  _layout.tsx                 # Root layout: SafeAreaProvider + Toast overlay + Stack
  (tabs)/
    _layout.tsx               # Tab bar config (Dashboard / Calendar / Analytics)
    index.tsx                 # → re-exports Dashboard
    calendar.tsx              # → re-exports Calendar
    analytics.tsx             # → re-exports Analytics

src/
  pages/
    Dashboard.tsx             # Main screen: date, events badge, today tasks/subs, chart, quick actions
    Analytics.tsx             # Summary stats + SVG chart + breakdown list
    Calendar.tsx              # Monthly grid, event dots, day-detail modal

  components/
    forms/
      AddTrackForm.tsx        # Multi-type form: subscription | app | event
      AddTaskForm.tsx         # Task creation form
    ui/
      Modal.tsx               # Bottom-sheet modal (RNModal + KeyboardAvoidingView)
      Toast.tsx               # Overlay toast renderer (reads useToastStore)

  stores/
    data.ts                   # Zustand persisted store (subscriptions, apps, events, tasks, settings)
    toasts.ts                 # Ephemeral toast queue

  utils/
    calculations.ts           # monthlyEquivalent, totalMonthlySpend, coffees, projectedYearly, daysLeft
    chart.ts                  # buildSpendingTimeline, pointsToPath, RANGE_DAYS
    dates.ts                  # computeNextChargeDate, todayStr, formatDate
    storage.js                # DEAD FILE — localStorage-based, not imported, kept for reference

  theme.ts                    # Design tokens (colors, spacing, radius, font sizes, shadows)
```

### Data Flow

```
AsyncStorage (device)
  └─ Zustand persist (track-data key)
       └─ useDataStore()
            ├─ Dashboard.tsx   (reads + writes via store actions)
            ├─ Analytics.tsx   (reads only)
            └─ Calendar.tsx    (reads only)

useToastStore()   (in-memory, no persistence)
  └─ Toast.tsx    (rendered in root _layout.tsx, z-index 999)
```

### How Zustand Persist Works

- Key in AsyncStorage: `"track-data"`
- Storage adapter: `createJSONStorage(() => AsyncStorage)` from `zustand/middleware`
- All five slices (subscriptions, apps, events, tasks, settings) are persisted together in one JSON blob
- On first load: defaults from store initialiser are used if key is absent
- `makeEntry()` stamps new items with `crypto.randomUUID()`, `createdAt`, `updatedAt`
- `stampUpdate()` merges a patch and refreshes `updatedAt`

---

## 3. Data Model

All items are plain JS objects with no class instances. Fields are inferred from form submits + store helpers.

### Subscription

```ts
{
  id: string              // crypto.randomUUID()
  createdAt: string       // ISO 8601
  updatedAt: string       // ISO 8601
  type: 'subscription'
  name: string
  emoji: string           // default '💳'
  color: string           // default '#000000'
  price: number
  currency: string        // 'EUR' | 'USD' | 'GBP' | 'BRL'
  billingCycle: string    // 'weekly' | 'monthly' | 'yearly'
  nextChargeDate: string  // 'YYYY-MM-DD' — used for calendar dots and due-in-7-days logic
  purchaseDate: string    // 'YYYY-MM-DD' (same as nextChargeDate on creation)
  category: string        // 'Streaming' | 'Music' | 'Gaming' | 'Cloud' | 'Productivity' | 'News' | 'Fitness' | 'Education' | 'Other'
  paymentMethod: string   // 'Card' | 'PayPal' | 'Apple Pay' | 'Google Pay' | 'Bank Transfer' | 'Other'
  note: string
  active: boolean         // default true; false = excluded from spend calculations
}
```

### AppEntry

```ts
{
  id: string
  createdAt: string
  updatedAt: string
  type: 'app'
  name: string
  emoji: string
  color: string
  price: number
  currency: string
  billingCycle: string    // present but ignored in calculations for apps
  nextChargeDate: string  // used as purchaseDate on creation
  purchaseDate: string
  date: string            // same as nextChargeDate on creation
  category: string
  note: string
  active: boolean
}
```

### EventEntry

```ts
{
  id: string
  createdAt: string
  updatedAt: string
  type: 'event'
  name: string
  emoji: string
  price: number           // present but not used in spend calculations
  currency: string
  date: string            // 'YYYY-MM-DD' — used for calendar matching
  nextChargeDate: string  // same as date on creation
  category: string
  note: string
  active: boolean
}
```

### Task

```ts
{
  id: string
  createdAt: string
  updatedAt: string
  name: string
  done: boolean           // default false
  dueDate: string | null  // 'YYYY-MM-DD' — used for "today tasks" filter
  priority: 'low' | 'medium' | 'high'
  category: string        // 'Personal' | 'Work' | 'Finance' | 'Health' | 'Travel' | 'Other'
  note: string
  amount: null            // always null, reserved
  currency: null          // always null, reserved
}
```

### Settings

```ts
{
  defaultCurrency: string  // 'EUR'
  coffeePrice: number      // 4.50
  theme: string            // 'light' (dark mode not implemented)
  startOfWeek: number      // 1 = Monday
  version: string          // '0.1.0'
}
```

---

## 4. State Management

### Store: `useDataStore` (`src/stores/data.ts`)

Persisted. Type is `any` throughout (no strict TS generics on the store).

**State slices:** `subscriptions[]`, `apps[]`, `events[]`, `tasks[]`, `settings{}`

**Actions:**

| Action | Signature | Effect |
|--------|-----------|--------|
| `addSubscription` | `(item) => void` | Appends with makeEntry |
| `addApp` | `(item) => void` | Appends with makeEntry |
| `addEvent` | `(item) => void` | Appends with makeEntry |
| `addTask` | `(item) => void` | Appends with makeEntry |
| `updateSubscription` | `(id, patch) => void` | Merges patch + stamps updatedAt |
| `updateTask` | `(id, patch) => void` | Merges patch + stamps updatedAt |
| `removeSubscription` | `(id) => void` | Filters out by id |
| `removeTask` | `(id) => void` | Filters out by id |
| `updateSettings` | `(patch) => void` | Shallow merges into settings |

Note: there are no `updateApp`, `updateEvent`, `removeApp`, or `removeEvent` actions. This is intentional (not a bug) given current scope, but it means apps and events cannot be edited or deleted from the UI.

### Store: `useToastStore` (`src/stores/toasts.ts`)

Not persisted. In-memory only.

| Method | Signature | Effect |
|--------|-----------|--------|
| `push` | `(message, type?, duration?) => void` | Adds toast; auto-removes after `duration` ms (default 2400) |
| `dismiss` | `(id) => void` | Removes toast immediately |

Toast types used in practice: `'success'`, `'info'` (default).

---

## 5. Navigation

expo-router file-based routing. No programmatic navigation exists yet.

```
/                    → app/(tabs)/index.tsx     → Dashboard
/calendar            → app/(tabs)/calendar.tsx  → Calendar
/analytics           → app/(tabs)/analytics.tsx → Analytics
```

Root layout (`app/_layout.tsx`) wraps everything in `<SafeAreaProvider>` and renders the `<Toast />` overlay absolutely positioned above all screens.

Tab bar: no icons (tabBarIcon returns null), text labels only. Active tint: `theme.accent` (#000). Inactive tint: `theme.textMuted` (#888).

---

## 6. Known Bugs

Bugs were catalogued from `// BUG` comments in source and code inspection. Format: `ID | File:line | Description | Severity | Status`

**Última actualização:** 2026-05-14 | **Total:** 29 bugs | **Corrigidos:** 27 | **Abertos:** 2

| ID | File:line | Description | Severity | Status |
|----|-----------|-------------|----------|--------|
| C1 | storage.js | localStorage used in React Native context — aviso + comentário adicionado | medium | [FIXED] |
| M1 | storage.js:24 | save() had no try/catch — silent write failures | medium | [FIXED] |
| M2 | storage.js:77 | importAll() didn't validate arrays before saving | medium | [FIXED] |
| L1 | storage.js:33 | getCollection/saveCollection allowed unknown type keys | low | [FIXED] |
| C2 | calculations.ts:2 | monthlyEquivalent() did not guard against invalid price | medium | [FIXED] |
| M6 | calculations.ts:16 | coffees() could divide by zero when price=0 | medium | [FIXED] |
| M7 | calculations.ts:32 | daysLeft() did not validate nextChargeDate before parsing | medium | [FIXED] |
| M3 | data.ts:26 | Store typed as `any` — no compile-time safety on store shape | low | [FIXED] |
| M4 | data.ts:— | crypto.randomUUID() without fallback for non-secure contexts | medium | [FIXED] |
| M5 | data.ts:— | No addApp / removeApp / updateApp / addEvent / removeEvent / updateEvent actions | medium | [FIXED] |
| M11 | AddTrackForm.tsx | Price validation missing for event type entries | medium | [FIXED] |
| M12 | AddTaskForm.tsx | dueDate stored without regex validation — no visual error shown | medium | [FIXED] |
| M13 | Calendar.tsx | Inactive subscriptions (active === false) shown on calendar | low | [FIXED] |
| M14 | Toast.tsx | pointerEvents prop set via StyleSheet instead of direct prop | low | [FIXED] |
| C3 | Dashboard.tsx:51 | parseISO not used when parsing YYYY-MM-DD — UTC offset bug | low | [FIXED] |
| C4 | Dashboard.tsx:63 | pointsToPath called without guarding breakdown.length | medium | [FIXED] |
| C5 | Modal.tsx | Android back-press / touch propagation not handled with Pressable | medium | [FIXED] |
| C6 | Modal.tsx:71 | Modal maxHeight computed once at load — Dimensions.get now used | low | [FIXED] |
| M8 | chart.ts | pointsToPath called with only 1 point — no guard | low | [FIXED] |
| M9 | dates.ts:22 | formatDate() crashed on invalid date strings | medium | [FIXED] |
| M10 | toasts.ts | setTimeout not cleared on dismiss — timer leak | low | [FIXED] |
| L2 | chart.ts | SVG area path offset on last coordinate | low | [FIXED] |
| L3 | dates.ts:22 | formatDate() used `new Date()` on YYYY-MM-DD causing UTC offset bug | low | [FIXED] |
| L4 | dates.ts:4 | computeNextChargeDate() had no default case for unknown cycles | low | [FIXED] |
| L5 | toasts.ts | No upper limit on toast queue — unbounded growth | low | [FIXED] |
| L6 | Calendar.tsx | Array(31) hardcoded for days-in-month instead of getDaysInMonth | low | [FIXED] |
| L9 | (tabs)/_layout.tsx:26 | tabBarIcon always returned null — no icons in tab bar | low | [FIXED] |
| L7 | Dashboard.tsx | `today` does not update after midnight while app stays open | low | [OPEN] — limitação conhecida documentada |
| L8 | AddTrackForm.tsx | purchaseDate always equals nextChargeDate — no separate field in form | low | [OPEN] — sem campo separado no formulário |

---

## 7. Design System

Defined in `src/theme.ts`. Single static object, no runtime theming.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `bg` | `#ebebeb` | Page background |
| `surface` | `#ffffff` | Card background |
| `border` | `#e0e0e0` | Input borders, dividers |
| `text` | `#111111` | Primary text |
| `textMuted` | `#888888` | Labels, meta, placeholders |
| `accent` | `#000000` | Active state, badges, buttons |
| `accentFg` | `#ffffff` | Text on accent background |

Special colors (not in theme): danger `#b14a3a`, toast success `#2d6a4f`.

### Spacing Scale

| Token | px |
|-------|----|
| sp1 | 4 |
| sp2 | 8 |
| sp3 | 12 |
| sp4 | 16 |
| sp5 | 20 |
| sp6 | 24 |
| sp8 | 32 |

### Border Radius

| Token | px |
|-------|----|
| radiusSm | 8 |
| radiusMd | 16 |
| radiusXl | 28 |

### Typography Scale

| Token | px | Usage |
|-------|----|-------|
| textXs | 11 | Labels, badges, filter pills |
| textSm | 13 | Body, list items |
| textBase | 15 | Section titles |
| textLg | 18 | Modal titles, month label |
| textXl | 24 | Stats, spend amount |
| textHero | 64 | Date number on dashboard |

### Shadows

Platform-split via `Platform.select`:
- iOS: `shadowColor #000, offset (0,1), opacity 0.06, radius 4`
- Android: `elevation: 2`
- Web: `{}`

### Currency Symbols

`CURRENCY_SYMBOL` map exported from `theme.ts`: `EUR→€`, `USD→$`, `GBP→£`, `BRL→R$`.

---

## 8. Development Notes

### Run Commands

```bash
npx expo start          # dev server (choose platform interactively)
npx expo start --ios    # iOS simulator
npx expo start --android
npx expo start --web
npx expo export         # production build
```

### Key Dependencies & Versions

| Package | Version | Notes |
|---------|---------|-------|
| expo | ~52.0.36 | SDK 52 |
| react-native | 0.76.7 | New arch enabled |
| expo-router | ~4.0.17 | File-based routing |
| zustand | ^5.0.3 | `create<any>()` pattern used |
| @react-native-async-storage/async-storage | 1.23.1 | Zustand persist target |
| react-native-svg | 15.8.0 | Charts (no chart library) |
| date-fns | ^4.1.0 | All date ops |
| @react-native-picker/picker | 2.9.0 | Dropdowns in forms |

### Code Patterns

- All pages use `useMemo` for derived data (subscriptions filtered by date, totals, breakdowns)
- StyleSheets are defined at module bottom as `const s = StyleSheet.create({...})`
- No navigation hooks used — all modals are local state `useState<boolean>`
- Forms submit plain objects; `makeEntry` in the store adds id/timestamps
- `any` is used extensively in the store — TypeScript is not enforced on data shapes
- SVG charts are custom: `buildSpendingTimeline` → `pointsToPath` → `<Path>` elements
- Charts are re-computed via `useMemo` on every subscription or timeRange change

### Known Traps

1. **localStorage does not work in React Native.** `src/utils/storage.js` uses `localStorage` and is dead code. Persistence is handled entirely by Zustand + AsyncStorage.

2. **Date string format is `YYYY-MM-DD` throughout.** Always use `parseISO()` from date-fns (not `new Date(dateStr)`) when parsing these strings. `new Date('2025-12-31')` parses as UTC midnight and will be off by hours in local timezones.

3. **`crypto.randomUUID()` requires a secure context on web.** Works natively on iOS/Android. On web via Expo, it requires HTTPS or localhost.

4. **`nextChargeDate` is NOT auto-updated after a charge.** It is set once at creation and never recalculated. Recurring subscription dates drift as time passes.

5. **The `apps` slice has no UI to list, edit, or delete entries.** Items are stored but only visible in the count (not implemented in any page).

6. **`active: false` pattern.** Subscriptions support soft-disable via `active: false` (used in calculations), but there is no UI toggle to set this.

7. **`gap` style property.** Used in `contentContainerStyle` and flex layouts. Requires React Native 0.71+ — fine for 0.76 but worth noting for older forks.

8. **Orientation change breaks Modal.** `Dimensions.get('window').height` is called at module load time in `Modal.tsx`, not reactively.
