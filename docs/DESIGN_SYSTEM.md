# Design System

Track uses a monochromatic light design: white cards on a light grey background, black typography, zero decorative colour. The only accent is pure black.

## Colours

```css
--color-bg:         #ebebeb;   /* Page background */
--color-surface:    #ffffff;   /* Cards, modals */
--color-border:     #e0e0e0;   /* Subtle dividers */
--color-text:       #111111;   /* Primary text */
--color-text-muted: #888888;   /* Secondary text, labels */
--color-accent:     #000000;   /* Buttons, active states, badges */
--color-accent-fg:  #ffffff;   /* Text on accent backgrounds */
```

## Typography

Font: **Inter** (fallback: `-apple-system, sans-serif`)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--text-xs` | 11px | 400 | Labels, badges |
| `--text-sm` | 13px | 400 | Body, descriptions |
| `--text-base` | 15px | 500 | Card titles, list items |
| `--text-lg` | 18px | 600 | Section headings |
| `--text-xl` | 24px | 700 | Widget values |
| `--text-hero` | 64px | 800 | Date widget day number |

## Spacing

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
```

## Border Radius

```css
--radius-sm:  8px    /* Badges, small tags */
--radius-md:  16px   /* Buttons, inputs */
--radius-lg:  20px   /* Modals */
--radius-xl:  28px   /* Dashboard cards */
```

## Shadows

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
```

Used only on cards to lift them from the background. Nowhere else.

## Components

### Card

```css
background: var(--color-surface);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-card);
padding: var(--space-5);
transition: transform 200ms ease, box-shadow 200ms ease;
```

On hover: `translateY(-2px)` + deeper shadow.

### Button — Primary

```css
background: var(--color-accent);
color: var(--color-accent-fg);
border-radius: var(--radius-md);
height: 40px;
font-weight: 600;
```

### Button — Icon (circle)

```css
width: 40px;
height: 40px;
border-radius: 50%;
background: var(--color-accent);
color: var(--color-accent-fg);
```

### Badge

```css
background: var(--color-accent);
color: var(--color-accent-fg);
border-radius: var(--radius-sm);
font-size: var(--text-xs);
padding: 4px 8px;
```

### Dot Indicator (Calendar)

```
5px circle
Black  → day has events
Grey   → day has subscription charge
```

## Layout

- **Mobile (< 600px)**: single column, 16px padding
- **Tablet (≥ 600px)**: 2-column grid for top widgets
- **Desktop (≥ 900px)**: sidebar navigation + content area

Dashboard grid areas:

```
"date    events"
"today   today"
"chart   chart"
"add     task"
```

## Motion

- Hover states: `180–200ms ease`
- Modal open/close: `200ms ease`
- Page transitions: `280ms cubic-out`, fly + fade
- Bar chart entrance: `600ms cubic-bezier(0.22, 0.61, 0.36, 1)` with stagger
- Toast: fly-in `240ms`, fade-out `180ms`
