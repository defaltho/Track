# Changelog

All notable changes to Track will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Changed
- Migrated frontend stack from Svelte 5 + Vite to React Native Web (Expo Router)
- Replaced Svelte stores with Zustand + AsyncStorage for cross-platform persistence
- Replaced CSS variables with typed theme constants (`src/theme.ts`)
- Replaced SVG HTML elements with `react-native-svg` (chart logic unchanged)
- Navigation moved to Expo Router file-based tab routing (`app/(tabs)/`)

### Added
- Dashboard widget grid (date, events, today, spending sparkline, quick actions)
- Calendar page with dot indicators and day-click event modal
- Analytics page with real chart, working time filters, animated breakdown bars
- Data types: subscriptions, apps, events, tasks
- Toast notifications on add/remove
- Page transitions between Dashboard/Calendar/Analytics
- Per-item delete buttons and task done toggle on Today card
- Currency symbol display from settings
- PWA support (installable, offline)

### Fixed
- `apps` store not imported in Dashboard (silent ReferenceError)
- `padCount` in Calendar wrapping a function instead of a value
- Timezone hazard from `new Date(string)` — now uses `parseISO`
- Form labels missing `for`/`id` associations (a11y)

---

## [0.1.0] — 2026-05-11

### Added
- Repository initialised
- Project documentation (README, CONTRIBUTING, ARCHITECTURE, DATA_MODEL, DESIGN_SYSTEM, ROADMAP)
- MIT License
