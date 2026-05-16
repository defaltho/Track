# Track — Design System

## Direction

**A notebook page that happens to be on a screen.**

Track is a personal app for tracking subscriptions, events and tasks. It is *not* a SaaS admin dashboard. The desktop UI reads like a single page of a personal ledger: quiet, paper-textured, tight typography, ink on paper.

Intent applies to every choice:
- Quiet over loud
- Marginalia tags over uppercase SECTION HEADERS
- Numbers as a column (Space Mono) over numbers as cards
- Hairlines over shadows
- Centered page (≤720px) over full-width grid

---

## Color world

Track lives between *open notebook on a desk* and *Nothing.tech product page*. Colors that belong there:

| Token | Light | Dark | Nothing |
|-------|-------|------|---------|
| `bg` (paper) | #F2F1EE ivory | #0A0A0A carbon | #0A0A0A carbon |
| `surface` (paper edge) | #FFFFFF | #141414 | #111111 |
| `text` (ink) | #111111 | #FFFFFF | #FFFFFF |
| `textMuted` (graphite) | #888880 | #666666 | #666666 |
| `textFaint` (pencil) | #B5B3AD | #2E2E2E | #2A2A2A |
| `border` (rule) | #E4E2DC | #242424 | #1E1E1E |
| `accentRed` (mark/due-today) | #FF2B2B | #FF2B2B | #FF2B2B |

**Rules:**
- `accentRed` is reserved for "due today" / urgent state. Never decorative.
- Same hue across surfaces — shift only lightness for elevation.
- Tinted backgrounds (`surfaceEl`) only inside small elements like emoji badges, never as page sections.

---

## Typography

| Use | Family | Size | Weight | Tracking |
|-----|--------|------|--------|----------|
| Masthead (month name) | Roboto Black | 56 | 900 | −2.5 |
| Mobile page title | Roboto Black | 34 | 900 | −1 |
| All numbers (counts, prices, dates) | Space Mono | varies | 400 | tight |
| Section tags (lowercase) | Roboto Medium | 10 | 500 | +1.6 |
| Subscription / task name | Roboto Bold | 15 | 700 | −0.3 |
| Body / labels | Roboto Regular / Medium | 11–14 | 400/500 | 0 |

**Rules:**
- **Space Mono for every numeric value** (currency, counts, dates, percentages). Non-negotiable signature.
- Section tags are lowercase (`"the year, in dots"`, `"this week"`, `"by category"`), never UPPERCASE.
- Never mix two display weights in the same heading.

---

## Depth strategy

**Borders-only.** No shadows on cards in the notebook view.

| Boundary | Treatment |
|----------|-----------|
| Page rules between sections | `StyleSheet.hairlineWidth` × `colors.border` |
| Dotted leader (between category and price) | `borderBottomWidth: hairline, borderStyle: 'dotted'`, opacity 0.6 |
| Card edges (mobile widgets) | `borderRadius` only, no border + soft shadow |
| Modal sheets | shadow upward (mobile native pattern) |

The desktop has **zero box-shadows on content**. Mobile keeps subtle shadow on widget cards (different surface model).

---

## Spacing

Base unit: **4px**.

Scale exported from `theme.ts`:

```
sp1=4  sp2=8  sp3=12  sp4=16  sp5=20  sp6=24  sp8=32
```

Notebook-specific:
- Section gap (between hairline-separated blocks): **28px** (sp7-ish)
- Page padding: **32px** horizontal × **56px** vertical
- Ledger row inner gap: **24px** between stats
- Category row vertical padding: **6px**

---

## Layout

| Viewport | Treatment |
|----------|-----------|
| `< 768px` mobile | Existing widget grid with drag-and-drop reorder. Cards on `surface`. Floating tab bar. |
| `≥ 768px` desktop | Notebook page. Single column max-width **720px**, centered. Sidebar 200px on the left (paper-on-paper, no fill). |

---

## Signature elements (must appear)

1. **`ActivityHeatmap`** (26 weeks × 7 days, dot grid) — the only data viz on desktop. Never replaced by bar/line charts.
2. **Space Mono numbers** everywhere — counts, money, dates.
3. **Dotted leader lines** between left-aligned name and right-aligned monospace price (category list).
4. **Lowercase marginalia tags** as section labels.
5. **"coffees" stat** in the ledger row — domain-specific quirk that translates abstract money into something tactile.
6. **`RingBadge`** (radial progress) for "active subscriptions" count on mobile.
7. **`DotGrid` texture** on cards when `themeKey === 'nothing'`.

---

## Rejected defaults (do not reintroduce)

1. ❌ "Welcome back, [name]" header → just the month + date line
2. ❌ KPI cards with sparklines + delta arrows → flat 4-number ledger row
3. ❌ Sparklines / mini bar charts → not enough historical data; would be fake
4. ❌ `PixelChart` / generic bar chart → ActivityHeatmap is the chart
5. ❌ `DataTable` with Status/ID/Date/Amount columns → SubRow ledger or dotted leader
6. ❌ Status pills "Success / Pending / Refunded" → Track has no transaction states
7. ❌ Full-width SaaS grid → 720px centered notebook column
8. ❌ Workspace switcher / user card in sidebar → quiet wordmark only
9. ❌ Filled active item background in sidebar → 2px ink rule + bold weight
10. ❌ Uppercase section headers → lowercase tags

---

## Key component patterns

### Stat (ledger cell)

Used in the desktop masthead row. 4 of these in a horizontal ledger.

```
value:  Space Mono, 30px, tracking -1
unit:   Space Mono, 13px, muted (e.g. currency symbol)
label:  Roboto Medium, 10px, tracking +1.4, lowercase, muted
gap:    4px between number and label
```

### Section block (notebook)

```
sectionTag (lowercase marginalia)
content (heatmap / list of rows / category rows)
gap: 14px between tag and content
```

Sections separated by `hairlineWidth` rule with `colors.border`. Vertical gap **28px**.

### Category row (dotted leader)

```
[name, Roboto Medium 14] [—— dotted hairline, flex:1 ——] [price, Space Mono 14]
```

Dotted leader: `borderBottomWidth: hairlineWidth, borderStyle: 'dotted', opacity: 0.6, marginBottom: 4px`.

### Sidebar item

```
[2px tall ink bar — visible only when active]  [icon 16px]  [label 13px]
- Active: ink color + Roboto Bold
- Inactive: muted color + Roboto Medium
- No filled background, ever
```

---

## File map

| File | Owns |
|------|------|
| `src/theme.ts` | All color palettes, spacing scale, typography tokens |
| `src/context/ThemeContext.tsx` | Theme switching (light/dark/nothing) |
| `src/pages/Dashboard.tsx` | Mobile widget grid + desktop notebook page |
| `app/(tabs)/_layout.tsx` | Sidebar (desktop) + floating tab bar (mobile) |
| `src/components/ui/Modal.tsx` | Bottom sheet modal |
| `src/components/ui/DotGrid.tsx` | Nothing-theme texture |
| `src/components/ui/Toast.tsx` | Transient feedback |

---

## Consistency checks

When adding new UI:

1. Are numbers in Space Mono? If not, fix.
2. Is the section label lowercase + Roboto Medium + tracking 1.6? If not, fix.
3. Are you adding a card with a shadow on desktop? If yes, replace with a hairline rule.
4. Are you adding a status pill? Ask: does Track have this state? If not, drop it.
5. Are you adding a bar/line chart? Ask: can ActivityHeatmap or a number column carry this? Probably yes.
6. Are you about to write "Welcome back" or "Total Revenue"? Stop. Track is personal.
