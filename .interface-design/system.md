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
| `< 768px` mobile | Widget grid with drag-and-drop reorder. Cards on `surface`. Floating tab bar. |
| `≥ 768px` desktop | **Same widget grid as mobile**, centered single column max-width **480px**. Sidebar 240px on the left with brand card + nav sections + user card. |

The widget grid is the canonical Dashboard layout — desktop is not a different surface, it's the same surface centered. Calendar keeps its own notebook treatment (masthead, grid, dotted leaders, side panel inside a shared bordered frame).

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

### Widget DNA (mono — only two shapes)

Every dashboard widget shares one shell. Only **two sizes** exist:

| Size | Shape | Layout |
|------|-------|--------|
| `square` | 1×1 (aspectRatio 1) | Pairs into a row of two with `gap: theme.sp3`. |
| `rectangle` | 2×1 (full row) | Takes the entire column width, `minHeight: 160`. |

**Shell rules** (identical on both sizes):
- Background `colors.surface` (no border, no shadow — elevation comes from `surface` vs `bg` lightness difference).
- `borderRadius: theme.radiusXl` (22).
- `padding: theme.sp5` (20) on all sides.
- Required top header: lowercase marginalia `tag` (10 px Roboto Medium tracking 1.6) on the left + optional `action` (Button/IconButton `sm`) on the right.
- Body has `flex: 1, gap: theme.sp4` between children — body fills the widget height so metric widgets can vertically center.
- Hero content scales proportional to the widget. Square metric widgets center their hero on both axes (`alignItems: 'center', justifyContent: 'center'`).
- Optional `onPress` makes the whole widget animate (press scale 0.96, web hover 1.025 + surfaceHigh).

**Hero typography** (numbers inside widgets):
- All hero numbers use **`theme.fontMonoBold`** (SpaceMono_700Bold). Bold is the default weight for any number rendered as the focal element of a widget — RingBadge counts, big spend, stat numbers, ring-goal values, top-expense prices, line-trend hero values, breakdown values.
- Supporting / secondary numbers (sub-labels like "at €1.50", "/ €110 target", delta percentages, dates) stay in regular `theme.fontMono`.
- Tags and labels remain Roboto. Never bold the marginalia tag.
- Sizes are sized to fill the box: square hero ≈ 48–56 px; rectangle hero ≈ 32 px; ring-center scales as `~22%` of ring diameter; RingBadge number scales as `36%` of ring diameter. Numbers should look weighty against the rest of the page — a number is the loudest thing in its widget.

**Layout rule**: consecutive squares in the dashboard order auto-pair into a row of two. A rectangle breaks the pairing and takes the next row. Mono spacing — never mix three-up or odd-width cells.

**Components**:
- `Widget` — the shell, takes `tag, action, size, onPress`.
- `WidgetRow` — explicit row of squares (most widgets use the auto-pairing layout instead).
- `BreakdownWidget` — rectangle preset: stacked color bar + list of rows (label / value / optional delta arrow). Used for "by category" and any breakdown stat.

**Catalog (`src/components/widgets/*`)**:

| Widget | Size | Purpose |
|--------|------|---------|
| `active` | square | RingBadge with count of active subscriptions |
| `spend` | square | Big Space Mono number — current month spend |
| `monthGoal` | square | `RingGoalWidget` — radial ring, value/target with center label |
| `clock` | square | `ClockWidget` — analog clock (Braun-style) ticking from device time |
| `coffees` | square | Coffee-equivalent of monthly spend |
| `events` | square | Count of events this month |
| `topExpense` | square | Highest-priced active subscription |
| `ytd` | square | Year-to-date spend (Jan → current month) |
| `heatmap` | rectangle | 26-week ActivityHeatmap dot grid |
| `due` | rectangle | "this week" — list of due subs + tasks |
| `spendTrend` | rectangle | `LineTrendWidget` — big number + ↑/↓ delta + minimalist line chart |
| `category` | rectangle | `BreakdownWidget` — categories with stacked bar |
| `upcoming` | rectangle | Next 30 days — subs + events list |

All 10 ship in the default order. Reorder mode lets users swap; pairing of squares is automatic.

### Button DNA (the "Next →" pill)

Every pressable control in the app — primary CTAs, currency selectors, segmented tabs, icon buttons, reorder controls, calendar chevrons — uses the same DNA:

| Variant | Treatment |
|---------|-----------|
| `primary` | dark gradient `#201E25 → #323137`, hairline border `#3a3942`, double drop-shadow `0 2px 4px rgba(0,0,0,0.10), 0 0 0 1px #0D0D0D`, faint top highlight `rgba(255,255,255,0.08)`, white label |
| `secondary` | transparent bg, hairline border `rgba(128,128,128,0.4)`, ink label |
| `ghost` | no bg, no border, ink label — hover adds `rgba(0,0,0,0.06)` |
| `danger` | red gradient `#B91C1C → #991B1B`, hairline border `#7A1212`, double drop-shadow, white label |

Sizes: `sm` (h≈30, fontSize 13/Medium), `md` (h≈40, 14/Bold), `lg` (h≈44, 15/Bold). Border radius **12**. Press feedback: scale 0.97. Web hover: scale 1.02 + slightly brighter gradient.

**Components**:
- `Button` — text-only or text+icon. Props: `label, variant, size, iconLeft, iconRight, fullWidth, loading, disabled`.
- `IconButton` — square icon-only with same DNA. Sizes: sm 32×32, md 38×38, lg 44×44.
- `Segmented` — row of `Button`s where the active option is `primary` and inactive options are `secondary`. Layouts: `equal` (flex:1 each), `fit` (hug content, wraps), `scroll` (horizontal scroll).

**Rule:** never reinvent a button. If a control is pressable and has a label/icon, use `Button` / `IconButton` / `Segmented`. The only allowed exceptions are list rows (settings list items) and provider mimicry (the Google/Apple sign-in modals).

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
| `src/components/ui/Button.tsx` | Button DNA — `Button` + `IconButton` |
| `src/components/ui/Segmented.tsx` | Segmented control built on Button DNA |
| `src/components/ui/Widget.tsx` | Widget DNA — `Widget` + `WidgetRow` (mono sizes) |
| `src/components/widgets/BreakdownWidget.tsx` | Rectangle breakdown: stacked bar + delta rows |
| `src/components/widgets/RingGoalWidget.tsx` | Square radial-ring goal: value / target + center label |
| `src/components/widgets/LineTrendWidget.tsx` | Rectangle line chart: hero number + delta + minimalist line |
| `src/components/widgets/ClockWidget.tsx` | Square analog clock — Braun-style, device time, second hand yellow |

---

## Consistency checks

When adding new UI:

1. Are numbers in Space Mono? If not, fix.
2. Is the section label lowercase + Roboto Medium + tracking 1.6? If not, fix.
3. Are you adding a card with a shadow on desktop? If yes, replace with a hairline rule.
4. Are you adding a status pill? Ask: does Track have this state? If not, drop it.
5. Are you adding a bar/line chart? Ask: can ActivityHeatmap or a number column carry this? Probably yes.
6. Are you about to write "Welcome back" or "Total Revenue"? Stop. Track is personal.
