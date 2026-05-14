# Roadmap

## Current Status — v0.1.0

Foundation complete. Dashboard, Calendar, and Analytics pages implemented with dynamic data, real charts, page transitions, toast notifications, and per-item interactions.

---

## v0.1 — Foundation ✅

- [x] Project scaffolding (Svelte 5 + Vite + CSS)
- [x] Design tokens and global styles
- [x] localStorage storage layer + export/import
- [x] **Dashboard**
  - [x] Date widget (today's date, large typography)
  - [x] Events count widget (dot calendar, badge count)
  - [x] Today's items list (subscriptions + tasks due today)
  - [x] Spending widget (monthly total + coffees equivalent)
  - [x] Quick actions (Add Track, Add Task)
- [x] **Calendar** — monthly grid with dot indicators per type + day-click modal
- [x] **Analytics** — real area chart + working time filters (1W, 3M, 6M, 1Y, Max)
- [x] Add / Delete for all track types
- [x] Task done toggle
- [x] PWA (installable, offline-capable)

---

## v0.2 — Polish

- [ ] Edit existing items (pre-filled forms)
- [ ] Input validation (negative price, invalid dates, NaN guards)
- [ ] localStorage QuotaExceededError handling with user feedback
- [ ] Focus trap + Escape key in Modal
- [ ] Form labels with `for`/`id` for full a11y
- [ ] Content Security Policy
- [ ] Category breakdown charts
- [ ] Overdue indicators (subscriptions past due date)
- [ ] Settings page (currency, coffee price, week start day)
- [ ] Keyboard shortcuts
- [ ] Schema versioning + migration path

---

## v1.0 — Stable

- [ ] Custom quantitative & qualitative data entries
- [ ] Recurring events
- [ ] Tags / custom categories
- [ ] Multiple currencies with display conversion
- [ ] Dark mode (opt-in)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Full mobile gesture support

---

## Backlog

- Shared export links (read-only, URL-encoded — no server)
- Browser extension widget
- Print / PDF export
- Budget alerts and thresholds
- Drag-to-reorder lists
