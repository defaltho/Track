# Architecture

## Overview

Track is a client-only Progressive Web App. There is no backend, no database, and no authentication. All data lives in the user's browser via `localStorage`.

## Technology Decisions

### Svelte 5 + Vite

Svelte compiles components to vanilla JS at build time — no virtual DOM, no runtime framework overhead. Svelte 5's rune system (`$state`, `$derived`, `$effect`) provides fine-grained reactivity with minimal boilerplate.

Vite provides fast HMR for development and an optimised production build.

**Rejected alternatives:**
- React — larger runtime, more boilerplate for this scale
- Vue — similar reactivity but heavier than Svelte
- Vanilla JS — viable but component organisation becomes unwieldy as the UI grows

### Plain CSS (CSS custom properties)

The design system is simple enough to implement directly in CSS without a utility framework. CSS custom properties provide theming, and scoped styles inside Svelte components prevent leakage.

**Rejected:** Tailwind CSS — adds a build dependency and class-name noise for a design this constrained.

### localStorage (JSON)

The data volume for a personal tracker is small (hundreds of records at most). `localStorage` provides a synchronous, zero-dependency API that is universally supported.

Data is stored as a JSON array per collection:
- `track_subscriptions`
- `track_apps`
- `track_events`
- `track_tasks`
- `track_settings`

**Rejected:** IndexedDB (via Dexie) — asynchronous complexity not warranted at this scale.

### Native SVG charts

The spending area chart is implemented as a plain SVG component. At this level of complexity (single series, area fill, responsive), a chart library adds more bundle size than it saves in code.

## Folder Structure

```
src/
├── components/
│   ├── forms/         # AddTrackForm, AddTaskForm
│   ├── ui/            # Modal, Toast
│   └── layout/        # Nav
├── pages/
│   ├── Dashboard.svelte
│   ├── Calendar.svelte
│   └── Analytics.svelte
├── stores/
│   ├── data.svelte.js   # Rune-based stores wrapping localStorage
│   └── toasts.svelte.js # Transient notifications
├── utils/
│   ├── storage.js       # localStorage read/write helpers
│   ├── calculations.js  # Monetary math, coffees, projections
│   ├── chart.js         # Spending timeline + SVG path builder
│   └── dates.js         # date-fns helpers
├── styles/
│   ├── variables.css    # Design tokens
│   └── global.css       # Reset + base styles
└── main.js
```

## Data Flow

```
User action
    → Svelte component calls store method
    → Store updates $state
    → utils/storage.js persists to localStorage
    → Derived stores re-compute aggregates
    → UI re-renders
```

## PWA

vite-plugin-pwa generates a service worker with Workbox. The app caches all static assets and works offline after first load. No network requests are ever made during normal operation.
