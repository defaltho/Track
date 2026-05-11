# Data Model

All data is stored in `localStorage` as JSON arrays. Each collection has its own key.

## Collections

| localStorage key | Type |
|-----------------|------|
| `track_subscriptions` | Subscription[] |
| `track_apps` | App[] |
| `track_events` | Event[] |
| `track_tasks` | Task[] |
| `track_settings` | Settings |

---

## Subscription

Recurring monetary commitments (Netflix, Spotify, cloud services, etc.).

```json
{
  "id": "uuid",
  "name": "Netflix",
  "emoji": "🎬",
  "color": "#000000",
  "price": 15.99,
  "currency": "EUR",
  "billingCycle": "monthly",
  "nextChargeDate": "2026-06-11",
  "lastPaidDate": null,
  "category": "Streaming",
  "paymentMethod": "Card",
  "note": "",
  "active": true,
  "createdAt": "2026-05-11T00:00:00.000Z",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

**Field reference:**

| Field | Type | Values |
|-------|------|--------|
| `billingCycle` | string | `weekly` `monthly` `yearly` |
| `currency` | string | `EUR` `USD` `GBP` `BRL` |
| `category` | string | `Streaming` `Music` `Gaming` `Cloud` `Productivity` `News` `Fitness` `Education` `Other` |
| `paymentMethod` | string | `Card` `PayPal` `Apple Pay` `Google Pay` `Bank Transfer` `Other` |

---

## App

One-time or lifetime software purchases.

```json
{
  "id": "uuid",
  "name": "Sketch",
  "emoji": "✏️",
  "color": "#000000",
  "price": 99.00,
  "currency": "USD",
  "purchaseDate": "2026-01-15",
  "platform": "macOS",
  "category": "Productivity",
  "note": "",
  "createdAt": "2026-05-11T00:00:00.000Z",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

**`platform`:** `macOS` `iOS` `Windows` `Android` `Web` `Other`

---

## Event

Calendar events with an optional monetary value.

```json
{
  "id": "uuid",
  "name": "Annual insurance renewal",
  "emoji": "📋",
  "color": "#000000",
  "date": "2026-07-01",
  "endDate": null,
  "allDay": true,
  "time": null,
  "category": "Finance",
  "note": "",
  "amount": 450.00,
  "currency": "EUR",
  "createdAt": "2026-05-11T00:00:00.000Z",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

**`category`:** `Personal` `Work` `Finance` `Health` `Travel` `Other`

---

## Task

To-do items with optional due date and monetary association.

```json
{
  "id": "uuid",
  "name": "Cancel unused gym membership",
  "done": false,
  "dueDate": "2026-05-20",
  "priority": "medium",
  "category": "Finance",
  "note": "",
  "amount": null,
  "currency": null,
  "createdAt": "2026-05-11T00:00:00.000Z",
  "updatedAt": "2026-05-11T00:00:00.000Z"
}
```

**`priority`:** `low` `medium` `high`

---

## Settings

```json
{
  "defaultCurrency": "EUR",
  "coffeePrice": 4.50,
  "theme": "light",
  "startOfWeek": 1,
  "version": "0.1.0"
}
```

---

## Export Format

The full export (Settings → Export) is a single JSON object:

```json
{
  "version": "0.1.0",
  "exportedAt": "2026-05-11T21:00:00.000Z",
  "subscriptions": [],
  "apps": [],
  "events": [],
  "tasks": [],
  "settings": {}
}
```
