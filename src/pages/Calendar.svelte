<script>
  import { events, subscriptions } from '../stores/data.svelte.js'
  import Modal from '../components/ui/Modal.svelte'
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns'
  import { fade } from 'svelte/transition'

  let current = $state(new Date())
  let selectedDay = $state(null)

  const label = $derived(format(current, 'MMMM yyyy'))
  const days  = $derived(eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) }))
  const padCount = $derived((() => {
    const dow = getDay(days[0])
    return dow === 0 ? 6 : dow - 1
  })())

  const eventDates = $derived(new Set(events.items.map(e => e.date)))
  const subDates   = $derived(new Set(subscriptions.items.map(s => s.nextChargeDate)))
  const todayStr   = format(new Date(), 'yyyy-MM-dd')

  const upcoming = $derived(
    events.items
      .filter(e => e.date?.startsWith(format(current, 'yyyy-MM')))
      .sort((a, b) => a.date.localeCompare(b.date))
  )

  const dayEvents = $derived(selectedDay
    ? events.items.filter(e => e.date === selectedDay)
    : [])
  const daySubs = $derived(selectedDay
    ? subscriptions.items.filter(s => s.nextChargeDate === selectedDay)
    : [])

  function prev() { current = new Date(current.getFullYear(), current.getMonth() - 1, 1) }
  function next() { current = new Date(current.getFullYear(), current.getMonth() + 1, 1) }

  function openDay(str) {
    selectedDay = str
  }
</script>

<div class="calendar-page">
  <div class="card">
    <div class="cal-header">
      <button class="nav-btn" onclick={prev} aria-label="Previous month">‹</button>
      <h2 class="month-label">{label}</h2>
      <button class="nav-btn" onclick={next} aria-label="Next month">›</button>
    </div>

    <div class="cal-grid">
      {#each ['Mo','Tu','We','Th','Fr','Sa','Su'] as d}
        <span class="weekday">{d}</span>
      {/each}

      {#each Array(padCount) as _}
        <span></span>
      {/each}

      {#each days as day}
        {@const str = format(day, 'yyyy-MM-dd')}
        {@const isToday = str === todayStr}
        {@const hasEv = eventDates.has(str)}
        {@const hasSub = subDates.has(str)}
        {@const hasAny = hasEv || hasSub}
        <button
          class="day-cell"
          class:today={isToday}
          class:has-data={hasAny}
          onclick={() => openDay(str)}
          aria-label="{format(day, 'd MMMM')}{hasAny ? ' — has items' : ''}"
        >
          <span class="day-num">{format(day, 'd')}</span>
          <div class="day-dots">
            {#if hasEv}<span class="dot event"></span>{/if}
            {#if hasSub}<span class="dot sub"></span>{/if}
          </div>
        </button>
      {/each}
    </div>
  </div>

  {#if upcoming.length > 0}
    <div class="card">
      <p class="section-title">
        This month <span class="count">{upcoming.length}</span>
      </p>
      {#each upcoming as ev, i (ev.id)}
        <div class="event-item" in:fade={{ duration: 200, delay: i * 30 }}>
          <span class="event-date">{format(parseISO(ev.date), 'd MMM')}</span>
          <span class="event-name">{ev.emoji ?? '•'} {ev.name}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal
  open={selectedDay !== null}
  title={selectedDay ? format(parseISO(selectedDay), 'EEEE, d MMMM') : ''}
  onClose={() => selectedDay = null}
>
  {#if selectedDay}
    {#if dayEvents.length === 0 && daySubs.length === 0}
      <p class="day-empty">Nothing on this day</p>
    {/if}

    {#each dayEvents as ev (ev.id)}
      <div class="day-row">
        <span class="day-tag event">Event</span>
        <span class="day-name">{ev.emoji ?? '📅'} {ev.name}</span>
      </div>
    {/each}

    {#each daySubs as sub (sub.id)}
      <div class="day-row">
        <span class="day-tag sub">Charge</span>
        <span class="day-name">{sub.emoji ?? '💳'} {sub.name} — {sub.currency} {sub.price}</span>
      </div>
    {/each}
  {/if}
</Modal>

<style>
  .calendar-page { display: flex; flex-direction: column; gap: var(--space-4); padding-bottom: var(--space-6); }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--space-5);
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

  .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
  .month-label { font-size: var(--text-lg); font-weight: 700; }
  .nav-btn { font-size: 22px; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); transition: background 150ms; }
  .nav-btn:hover { background: var(--color-bg); }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-1); }
  .weekday { font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 600; text-align: center; padding-bottom: var(--space-2); }

  .day-cell {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: var(--space-2) 0; border-radius: var(--radius-sm);
    transition: background 180ms ease, transform 180ms ease;
    min-height: 38px;
  }
  .day-cell:hover { background: var(--color-bg); }
  .day-cell.has-data:hover { transform: scale(1.05); }
  .day-cell.today .day-num { background: var(--color-accent); color: var(--color-accent-fg); border-radius: 50%; }
  .day-num { font-size: var(--text-xs); font-weight: 500; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; }
  .day-dots { display: flex; gap: 2px; min-height: 6px; }
  .dot { width: 5px; height: 5px; border-radius: 50%; }
  .dot.event { background: var(--color-accent); }
  .dot.sub   { background: var(--color-text-muted); }

  .section-title { font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-4); display: flex; align-items: center; gap: var(--space-2); }
  .count { background: var(--color-accent); color: var(--color-accent-fg); border-radius: 20px; padding: 2px 8px; font-size: var(--text-xs); }

  .event-item { display: flex; gap: var(--space-4); align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
  .event-item:last-child { border-bottom: none; }
  .event-date { font-size: var(--text-xs); color: var(--color-text-muted); width: 40px; flex-shrink: 0; }
  .event-name { font-size: var(--text-sm); font-weight: 500; }

  /* Day modal */
  .day-empty { font-size: var(--text-sm); color: var(--color-text-muted); padding: var(--space-2) 0; }
  .day-row { display: flex; gap: var(--space-3); align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
  .day-row:last-child { border-bottom: none; }
  .day-tag {
    font-size: var(--text-xs); font-weight: 700;
    padding: 3px 8px; border-radius: 6px;
    background: var(--color-bg); color: var(--color-text-muted);
    text-transform: uppercase; letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .day-tag.event { background: var(--color-accent); color: var(--color-accent-fg); }
  .day-name { font-size: var(--text-sm); font-weight: 500; }
</style>
