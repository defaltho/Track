<script>
  import { events, subscriptions } from '../stores/data.svelte.js'
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

  let current = $state(new Date())

  const label    = $derived(format(current, 'MMMM yyyy'))
  const days     = $derived(eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) }))
  const padCount = $derived(() => { const dow = getDay(days[0]); return dow === 0 ? 6 : dow - 1 })

  const eventDates = $derived(new Set(events.items.map(e => e.date)))
  const subDates   = $derived(new Set(subscriptions.items.map(s => s.nextChargeDate)))
  const todayStr   = format(new Date(), 'yyyy-MM-dd')

  const upcoming = $derived(
    events.items
      .filter(e => e.date?.startsWith(format(current, 'yyyy-MM')))
      .sort((a, b) => a.date.localeCompare(b.date))
  )

  function prev() { current = new Date(current.getFullYear(), current.getMonth() - 1, 1) }
  function next() { current = new Date(current.getFullYear(), current.getMonth() + 1, 1) }
</script>

<div class="calendar-page">
  <div class="card">
    <div class="cal-header">
      <button class="nav-btn" onclick={prev}>‹</button>
      <h2 class="month-label">{label}</h2>
      <button class="nav-btn" onclick={next}>›</button>
    </div>

    <div class="cal-grid">
      {#each ['Mo','Tu','We','Th','Fr','Sa','Su'] as d}
        <span class="weekday">{d}</span>
      {/each}

      {#each Array(padCount()) as _}
        <span></span>
      {/each}

      {#each days as day}
        {@const str = format(day, 'yyyy-MM-dd')}
        {@const isToday = str === todayStr}
        <div class="day-cell" class:today={isToday}>
          <span class="day-num">{format(day, 'd')}</span>
          <div class="day-dots">
            {#if eventDates.has(str)}<span class="dot event"></span>{/if}
            {#if subDates.has(str)}<span class="dot sub"></span>{/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if upcoming.length > 0}
    <div class="card">
      <p class="section-title">
        This month <span class="count">{upcoming.length}</span>
      </p>
      {#each upcoming as ev (ev.id)}
        <div class="event-item">
          <span class="event-date">{format(new Date(ev.date), 'd MMM')}</span>
          <span class="event-name">{ev.emoji ?? '•'} {ev.name}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .calendar-page { display: flex; flex-direction: column; gap: var(--space-4); padding-bottom: var(--space-6); }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--space-5);
  }

  .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
  .month-label { font-size: var(--text-lg); font-weight: 700; }
  .nav-btn { font-size: 22px; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); transition: background 150ms; }
  .nav-btn:hover { background: var(--color-bg); }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-1); }
  .weekday { font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 600; text-align: center; padding-bottom: var(--space-2); }

  .day-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: var(--space-1) 0; border-radius: var(--radius-sm); }
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
</style>
