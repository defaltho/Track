# Track — Roadmap

> Strategic product vision. For sprint-level tasks and bug tracking use the issue tracker or CLAUDE.md.
> Last updated: May 2026 — v0.1.5

---

## Product Vision

Track is a mobile-first universal life tracker. The core idea is simple: anything in your life that repeats, costs money, has a deadline, or needs attention deserves a place to live. Subscriptions are just the beginning — Track is designed to become the single place where users record and monitor everything that matters to them.

**What users track:** subscriptions, one-time purchases, events, tasks, habits, goals, possessions, warranties, health metrics, reading lists, projects, relationships — anything.

**What Track gives back:** a clear timeline of what's coming, what's overdue, what's been spent, and how life is trending over time.

**Target user:** Anyone who feels like important things slip through the cracks — renewal dates, upcoming events, habits they meant to keep, things they own but forgot about. Age and technical skill don't matter; if you have things to track, Track is for you.

**Core differentiator:** Fully offline-first. No account required. No server. No sync fees. The user owns all their data, always. Track works on iOS, Android, and Web from a single codebase.

---

## Current State — v0.1.5 ✅

- Dashboard with spending widget, today's items list, sparkline chart, and quick actions
- Calendar month view with dot indicators per type and day-click detail modal
- Analytics with area chart (1W / 3M / 6M / 1Y / Max ranges), category breakdown, and period comparison
- Four entry types: Subscription, App (one-time), Event, Task
- Zustand + AsyncStorage — fully offline, no network required
- React Native + Expo — iOS, Android, Web from one codebase

---

## Phase 1 — Polish & Foundation (v0.2)

### Objective
Make the existing foundation solid and trustworthy before expanding the types of things users can track.

### Features

#### 1.1 Edit Existing Items
- Pre-filled edit modal for all four entry types (Subscription, App, Event, Task)
- Trigger from list items, day-detail modal, and long-press on cards
- `updatedAt` written on every save

#### 1.2 Input Validation
- Block negative or zero prices; block invalid date strings
- NaN and empty-string guards on all fields before saving
- Toast error messages explaining what's wrong

#### 1.3 Overdue Indicators
- Subscriptions whose `nextChargeDate` has passed show a distinct visual state
- Calendar day cells turn red for overdue items
- Dashboard "Today's Items" pins overdue entries at the top

#### 1.4 Settings Page
- Default currency (EUR, USD, GBP, BRL — persisted to store)
- Coffee-equivalent price input
- Week start day (Monday / Sunday)
- App version displayed
- Reset data option (with confirmation)

#### 1.5 Accessibility & Modal Polish
- Focus trap inside modals; Escape key dismisses on Web
- Form labels with `for`/`id` pairing
- ARIA roles on interactive elements
- Orientation change no longer breaks Modal dimensions

#### 1.6 Schema Versioning
- `settings.version` drives a migration path so new fields never break existing data

### Success Criteria
- All forms validate before submit, no silent data corruption
- Overdue items visually distinct across Dashboard, Calendar, and Analytics
- Settings changes persist across cold restarts

---

## Phase 2 — More of What You Track (v1.0)

### Objective
Expand the types of things users can record. Move Track from a subscription manager to a genuine universal tracker.

### Features

#### 2.1 Habits
- Create a habit with a name, emoji, color, and target frequency (daily / X times per week / weekly)
- Check off completions on the Dashboard or Calendar
- Streak tracking: current streak and longest streak
- Calendar dots show habit completion state per day (filled = done, empty = missed)
- Analytics: habit completion rate over time (line or bar chart)

#### 2.2 Goals
- Create a goal with a target value, unit (kg, km, books, hours, €…), and optional deadline
- Manual progress entries: log a new value at any time
- Progress visualised as a ring or bar on the Dashboard
- Optional link to a habit ("reading 20 min/day → goal: finish 12 books this year")
- Milestone celebration when a goal is reached

#### 2.3 Possessions / Inventory
- Log physical items: name, emoji, purchase date, price paid, and optional warranty period
- Warranty expiry alert (push notification before it expires)
- Filterable list: still under warranty, expired, no warranty
- Calendar integration: warranty expiry dates appear as events
- Use cases: gadgets, appliances, vehicles, musical instruments, sports gear

#### 2.4 Recurring Events
- Any event can have a recurrence rule: daily / weekly / monthly / yearly
- Calendar auto-projects future occurrences
- Edit one vs. edit all future option for recurring series
- Examples: gym session, medication, rent payment, birthday reminder

#### 2.5 Notes / Journal Entries
- Lightweight free-text entries attached to a date
- Optional category and emoji
- Searchable from a dedicated list view
- Not financial — no price field; purely text-based record-keeping
- Use cases: mood log, meeting notes, ideas, travel memories

#### 2.6 Dark Mode
- Wire `ThemeContext` toggle to `theme.ts` dark tokens throughout all screens
- Persist preference in settings store
- Respect `Appearance.getColorScheme()` on first launch

#### 2.7 Multiple Currencies with Conversion
- Exchange rate snapshot stored locally (user refreshes manually or on app open)
- Dashboard total converts all items to the user's default currency
- Per-item display keeps original currency; aggregated totals show converted amount

### Success Criteria
- User can create a Habit, log completions for 7 days, and see a streak of 7
- Goals ring on Dashboard updates immediately when a progress entry is added
- Possession warranty alert fires on a real device before expiry

---

## Phase 3 — Intelligence & Insights (v1.5)

### Objective
Surface patterns and predictions the user didn't know to look for. Make Track feel like it understands your life, not just stores it.

### Features

#### 3.1 Smart Push Notifications
- Renewal alert: X days before a subscription's next charge (user-configurable: 1 / 3 / 7 days)
- Habit miss alert: end-of-day notification if a daily habit wasn't completed
- Goal deadline warning: "14 days left to reach your goal"
- Weekly digest (configurable day): summary of the week — spending, habits completed, events coming up
- All scheduled locally via `expo-notifications` — no push server needed

#### 3.2 Spending Forecast
- 30-day projection from active subscription `nextChargeDate` values
- "You have €X committed in the next 30 days" widget on Dashboard
- Calendar heat map: shade days with high spend concentration
- Scenario view: what happens to monthly spend if you cancel X

#### 3.3 Budget Thresholds
- Monthly spending cap per category (optional, user-set)
- Progress bar on Analytics turns amber at 80%, red at 100% of budget
- Push notification when a threshold is crossed
- Dashboard indicator: "You're 87% through your Streaming budget"

#### 3.4 Pattern Recognition (On-Device)
- Identify months where spending in a category is significantly above the user's own average
- Surface anomalies as a card on Dashboard: "Streaming cost +34% vs your average this month"
- No external ML — computed from the existing data set using simple statistical methods
- Seasonal pattern hints: "You tend to spend more in December — here's last year's breakdown"

#### 3.5 Life Score
- 0–100 composite score across all tracked areas:
  - Financial: overdue payments, budget compliance
  - Habits: completion rate over the last 30 days
  - Goals: on-track progress toward active goals
  - Tasks: overdue task count
- Monthly trend graph with score over time
- Actionable tips: "Cancel 1 unused subscription to improve your Financial score"
- Optional badges for milestones ("30-day habit streak", "All tasks on time this week")

#### 3.6 Category Breakdown Drill-Down
- Tap any category bar in Analytics → filtered list of all items in that category
- Per-category monthly trend (this month vs last month vs 3-month average)
- Habit completion rate per category alongside spending (if both exist for that category)

### Success Criteria
- Forecast widget matches manual sum of upcoming charges within €0.01
- Pattern anomaly card appears when a category is ≥20% above a 3-month average
- Life Score changes within 1 second of any data update

---

## Phase 4 — Social & Sharing (v2.0)

### Objective
Make Track useful beyond a single person — shared tracking, collaborative expenses, and data portability without a server.

### Features

#### 4.1 Shared Export Links
- Compress and encode current data (or a filtered subset) into a URL-safe string
- Read-only link opens in any browser and renders a static view — no server, no account
- Optional: QR code for in-person sharing
- User controls exactly what data is included before generating the link

#### 4.2 Expense Splitting
- Create a group (household, trip, couple, project)
- Add any tracked expense to a group with a split rule (equal / percentage / custom amounts)
- Running balance: who owes whom, simplified to the minimum number of transfers
- Settle up: mark debts as paid; log the settlement as an event
- Export split summary as a share link or PDF

#### 4.3 Collaborative Tracking
- Invite another Track user to share a specific list (subscriptions, habits, goals)
- Each member can add entries; deletions require confirmation from the owner
- Shared lists are identified with a different visual treatment
- Sync via QR code or share link — no account or server required (P2P via encoded state)

#### 4.4 Print / PDF Export
- Monthly or custom-range summary: totals, category breakdown, full item list
- Clean layout for sharing with an accountant, partner, or for personal records
- React Native: `expo-print` with an HTML template
- Web: browser print dialog with a print-optimised stylesheet

#### 4.5 Widgets (Platform Native)
- iOS: Home Screen widget showing today's items and upcoming charges (WidgetKit via Expo)
- Android: App widget with the same content
- Web: new-tab extension showing today's summary (read-only, uses exported data format)

#### 4.6 Workspaces
- A **Workspace** is a named, self-contained context that groups all Track data — subscriptions, expenses, tasks, events, goals, habits, notes — under a single label and budget.
- Every user always has a default **Personal** workspace (their existing data, unchanged UX).
- Additional workspaces: **Work**, **Freelance**, **Side Project**, **Trip**, or anything the user names.
- Workspaces can be **private** (single-user) or **shared** (like the Family space — multiple members, role-based permissions, invite flow).
- Data isolation: items belong to exactly one workspace. Dashboard, Calendar, and Analytics all filter by the active workspace. A "All Workspaces" aggregate view shows totals across all.
- Workspace switching: compact switcher in the app header (name + avatar chip). The Family tab becomes a shortcut to shared workspaces.
- Settings per workspace: name, emoji, currency, monthly budget cap, member list (shared only).
- Architecture: all entity types (`Subscription`, `Task`, `EventEntry`, `AppEntry`, `Expense`, `Habit`, `Goal`) gain an optional `workspaceId` field (`null` = Personal). The router pattern (`src/stores/familyData.ts`) scales to cover all types.

### Success Criteria
- Share link opens and renders correctly in Chrome, Safari, and Firefox without any server
- Split totals reconcile to zero across all group members
- iOS widget updates within 15 minutes of a data change in the app
- Switching workspaces re-renders Dashboard, Calendar, and Analytics within 200ms with no data leakage between contexts

---

## Phase 5 — Full Ecosystem (v3.0)

### Objective
Cover every category of life tracking — health, learning, projects, possessions, travel — and make Track the only app that holds it all.

### Features

#### 5.1 Health & Fitness Tracking
- Log workouts: type, duration, distance, calories (manual entry)
- Body metrics: weight, resting heart rate, sleep hours — one value per day
- Trend charts on Analytics (reuses existing chart infrastructure)
- Integration read from Apple Health / Google Fit (optional, on-device only)
- Goal link: "Run 200 km this year" → auto-update from workout log

#### 5.2 Learning Tracker
- Log books, courses, podcasts, articles with a status (to read / reading / done)
- Pages or percentage progress for books; episodes for podcasts
- Reading goal: books per year with progress ring
- Completion celebration and "finished" archive view

#### 5.3 Travel & Trips
- Create a trip: destination, dates, companion list, budget
- Log expenses per trip (meals, transport, accommodation) — tagged to the trip
- Budget vs actual spend per trip
- Calendar integration: trip dates show as a multi-day block
- Photo attachment per trip entry (stored on device)

#### 5.4 Project Tracker
- Create projects with a name, deadline, and status (active / on hold / done)
- Sub-tasks within a project (reuses the Task model with a `projectId`)
- Progress ring based on completed sub-tasks
- Time log: manually record hours spent per session
- Dashboard card: active projects and their completion percentage

#### 5.5 BNPL & Instalment Tracker
- Log active buy-now-pay-later plans (Klarna, generic)
- Per-plan: total amount, instalment, payments remaining, next payment date
- Calendar integration: instalment dates alongside subscriptions
- Dashboard widget: total monthly BNPL commitment vs estimated income
- Final payment celebration notification

#### 5.6 Tax-Relevant Tagging
- Mark any entry as tax-relevant with a category (work expense, home office, health, education)
- Annual export: total deductible spend per category in a clean format for filing
- Configurable tax year start (January / April — varies by country)

### Success Criteria
- Health metrics chart renders for a user with 365 daily entries without frame drops
- Trip expense total matches the sum of all tagged entries within €0.01
- BNPL payment alert fires correctly on the payment date

---

## Technical Principles (All Phases)

| Principle | Rule |
|-----------|------|
| **Offline-first** | Every feature works without a network connection |
| **No required backend** | Share links use URL encoding; sync uses QR / local export |
| **User owns data** | Export to JSON at any time; delete everything with one tap |
| **Files under 500 lines** | Split into hooks or utils before a file grows past that |
| **TypeScript strict** | No `any`, no implicit undefined access |
| **One store** | All persisted state in `useDataStore`; new models extend, never replace |

### Schema Evolution Path

New types are added to `useDataStore` as new arrays. Existing types extended with optional fields only. Migrations run on hydration via `settings.version`.

```ts
// Phase 2
Habit:      { id; name; emoji; color; frequency; completions: string[] }
Goal:       { id; name; unit; target; entries: { date; value }[]; deadline? }
Possession: { id; name; emoji; price; purchaseDate; warrantyMonths?; category }
Note:       { id; body; date; category?; emoji? }

// Phase 3
BudgetThreshold: { category; monthlyLimit; currency }

// Phase 4
Group:      { id; name; members: string[]; itemIds: string[] }
GroupDebt:  { from; to; amount; currency; settled: boolean }

// Phase 5
WorkoutLog: { id; type; date; durationMin; distanceKm?; calories? }
BodyMetric: { id; type: 'weight' | 'heartRate' | 'sleep'; date; value }
Trip:       { id; name; destination; startDate; endDate; budget; currency }
Project:    { id; name; deadline?; status; taskIds: string[] }
BNPLPlan:   { id; name; provider; totalAmount; instalment; paymentsLeft; nextPaymentDate }
```

### Notification Strategy
- `expo-notifications` — local scheduling, no push server needed
- Re-schedule on every app open to stay in sync with data changes
- User controls which alert types are active from Settings

---

## Monetisation (When Ready)

Track is free today. If monetisation is introduced, privacy and offline-first must remain non-negotiable:

| Tier | Price | Limit |
|------|-------|-------|
| **Free** | €0 | Up to 15 tracked items total |
| **Pro** | €2.99/month or €24.99/year | Unlimited items, all phases, all entry types |
| **One-time** | €9.99 | Supporter purchase — unlocks Pro forever |

No ads. No data selling. No tracking of user behaviour.

---

## Implementation Order (Per Phase)

1. **Type definitions first** — extend TypeScript types in `data.ts`
2. **Store actions** — add CRUD methods, migrations if needed
3. **Utility functions** — calculations and helpers with no UI dependency
4. **Wire into existing screens** — show new data in Dashboard / Calendar / Analytics before building new pages
5. **New screens last** — only when existing pages genuinely can't accommodate the feature
6. **Notifications** — schedule after the underlying data model is stable

---

*For architecture decisions see `ARCHITECTURE.md`. For the design system see `DESIGN_SYSTEM.md`.*
