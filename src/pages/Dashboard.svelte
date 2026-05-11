<script>
  import { subscriptions, apps, tasks, events, settings } from '../stores/data.svelte.js'
  import { toasts } from '../stores/toasts.svelte.js'
  import { totalMonthlySpend, coffees } from '../utils/calculations.js'
  import { buildSpendingTimeline, pointsToPath, RANGE_DAYS } from '../utils/chart.js'
  import Modal from '../components/ui/Modal.svelte'
  import AddTrackForm from '../components/forms/AddTrackForm.svelte'
  import AddTaskForm from '../components/forms/AddTaskForm.svelte'
  import { format, parseISO, differenceInCalendarDays } from 'date-fns'
  import { fly, slide } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  const now    = $derived(new Date())
  const today  = $derived(format(now, 'yyyy-MM-dd'))
  const month  = $derived(format(now, 'yyyy-MM'))

  const currency = $derived(settings.value.defaultCurrency ?? 'EUR')
  const symbol   = $derived({ EUR: '€', USD: '$', GBP: '£', BRL: 'R$' }[currency] ?? '')

  const monthly     = $derived(totalMonthlySpend(subscriptions.items))
  const coffeeCount = $derived(coffees(monthly))
  const monthEvents = $derived(events.items.filter(e => e.date?.startsWith(month)))
  const todayTasks  = $derived(tasks.items.filter(t => t.dueDate === today))
  const dueSubs     = $derived(
    subscriptions.items.filter(s => {
      const diff = differenceInCalendarDays(parseISO(s.nextChargeDate), now)
      return diff >= 0 && diff <= 7
    })
  )
  const hasToday = $derived(dueSubs.length > 0 || todayTasks.length > 0)

  let timeRange  = $state('1Y')
  const timeline = $derived(buildSpendingTimeline(subscriptions.items, RANGE_DAYS[timeRange]))
  const path     = $derived(pointsToPath(timeline, 300, 80))

  let showAddTrack = $state(false)
  let showAddTask  = $state(false)
  let showConfirm  = $state(null)

  function handleAddTrack(data) {
    if (data.type === 'subscription') { subscriptions.add(data); toasts.push('Subscription added', 'success') }
    else if (data.type === 'app')     { apps.add(data); toasts.push('App added', 'success') }
    else if (data.type === 'event')   { events.add(data); toasts.push('Event added', 'success') }
    showAddTrack = false
  }

  function handleAddTask(data) {
    tasks.add(data)
    toasts.push('Task added', 'success')
    showAddTask = false
  }

  function toggleTask(t) {
    tasks.update(t.id, { done: !t.done })
  }

  function askRemove(kind, id, name) {
    showConfirm = { kind, id, name }
  }

  function confirmRemove() {
    const { kind, id, name } = showConfirm
    if (kind === 'sub') { subscriptions.remove(id); toasts.push(`Removed ${name}`) }
    else                { tasks.remove(id); toasts.push(`Removed ${name}`) }
    showConfirm = null
  }
</script>

<div class="dashboard">
  <!-- Row 1 -->
  <div class="row-2">
    <div class="card date-card">
      <p class="date-top">
        <strong>{format(now, 'EEE')}</strong>
        <span class="muted">{format(now, 'MMM')}</span>
      </p>
      <p class="date-hero">{format(now, 'd')}</p>
    </div>

    <div class="card events-card">
      <span class="badge">{monthEvents.length}</span>
      <p class="card-label">Events</p>
      <div class="dot-grid">
        {#each Array(31) as _, i}
          <span class="dot" class:filled={i < monthEvents.length}></span>
        {/each}
      </div>
    </div>
  </div>

  <!-- Today -->
  <div class="card today-card">
    <p class="section-title">Today, {format(now, 'EEEE')}</p>

    {#if !hasToday}
      <p class="empty">Nothing due today</p>
    {/if}

    {#each dueSubs as sub (sub.id)}
      <div class="list-item" animate:flip={{ duration: 240 }} in:slide={{ duration: 180 }} out:slide={{ duration: 180 }}>
        <span class="bullet"></span>
        <div class="item-body">
          <p class="item-name">{sub.emoji ?? '💳'} {sub.name}</p>
          <p class="item-meta">{symbol}{sub.price} · {format(parseISO(sub.nextChargeDate), 'd MMM')}</p>
        </div>
        <button class="row-action" onclick={() => askRemove('sub', sub.id, sub.name)} aria-label="Remove {sub.name}">×</button>
      </div>
    {/each}

    {#each todayTasks as task (task.id)}
      <div class="list-item" animate:flip={{ duration: 240 }} in:slide={{ duration: 180 }} out:slide={{ duration: 180 }}>
        <button class="checkbox" class:checked={task.done} onclick={() => toggleTask(task)} aria-label={task.done ? 'Mark as not done' : 'Mark as done'}>
          {#if task.done}✓{/if}
        </button>
        <div class="item-body">
          <p class="item-name" class:done={task.done}>{task.name}</p>
          {#if task.note}<p class="item-meta">{task.note}</p>{/if}
        </div>
        <button class="row-action" onclick={() => askRemove('task', task.id, task.name)} aria-label="Remove {task.name}">×</button>
      </div>
    {/each}

    <div class="today-footer">
      <button class="btn-circle lg" onclick={() => showAddTrack = true} aria-label="Add track">+</button>
    </div>
  </div>

  <!-- Spending -->
  <div class="card spending-card">
    <div class="spending-top">
      <div>
        <p class="spending-amount">{symbol}{monthly.toFixed(0)}</p>
        <p class="spending-sub">Per Month = {coffeeCount} coffees</p>
      </div>
      <p class="card-label right">Your Subscriptions</p>
    </div>

    <svg class="chart" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      {#if subscriptions.items.length > 0}
        <path d={path.area} fill="url(#g1)" class="chart-area" />
        <path d={path.line} fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round" class="chart-line" />
        <circle cx={path.last.x} cy={path.last.y} r="3" fill="#000" />
      {:else}
        <text x="150" y="44" text-anchor="middle" font-size="11" fill="#888">No subscriptions yet</text>
      {/if}
    </svg>

    <div class="filters">
      {#each Object.keys(RANGE_DAYS) as f}
        <button
          class="filter-pill"
          class:active={timeRange === f}
          aria-pressed={timeRange === f}
          onclick={() => timeRange = f}
        >{f}</button>
      {/each}
    </div>
  </div>

  <!-- Quick actions -->
  <div class="row-2">
    <button class="card action-card" onclick={() => showAddTrack = true}>
      <div class="action-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="32" height="32" rx="8" stroke="#ccc" stroke-width="1.5"/>
          <line x1="8" y1="24" x2="40" y2="24" stroke="#ccc" stroke-width="1.5"/>
          <line x1="24" y1="8" x2="24" y2="40" stroke="#ccc" stroke-width="1.5"/>
        </svg>
      </div>
      <p class="action-label">Add Track</p>
    </button>

    <button class="card action-card" onclick={() => showAddTask = true}>
      <div class="action-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="18" stroke="#111" stroke-width="2"/>
          <polyline points="15,24 21,30 33,18" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="action-label">Add Task</p>
    </button>
  </div>
</div>

<Modal open={showAddTrack} title="Add Track" onClose={() => showAddTrack = false}>
  {#key showAddTrack}
    <AddTrackForm onSubmit={handleAddTrack} onCancel={() => showAddTrack = false} />
  {/key}
</Modal>

<Modal open={showAddTask} title="Add Task" onClose={() => showAddTask = false}>
  {#key showAddTask}
    <AddTaskForm onSubmit={handleAddTask} onCancel={() => showAddTask = false} />
  {/key}
</Modal>

<Modal open={showConfirm !== null} title="Remove?" onClose={() => showConfirm = null}>
  {#if showConfirm}
    <p class="confirm-text">Remove <strong>{showConfirm.name}</strong>? This cannot be undone.</p>
    <div class="confirm-actions">
      <button class="btn-secondary" onclick={() => showConfirm = null}>Cancel</button>
      <button class="btn-danger" onclick={confirmRemove}>Remove</button>
    </div>
  {/if}
</Modal>

<style>
  .dashboard { display: flex; flex-direction: column; gap: var(--space-4); padding-bottom: var(--space-6); }

  .row-2  { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--space-5);
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

  /* Date */
  .date-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
  .date-top  { font-size: var(--text-base); }
  .muted     { color: var(--color-text-muted); font-weight: 400; }
  .date-hero { font-size: var(--text-hero); font-weight: 800; line-height: 1; }

  /* Events */
  .events-card { position: relative; min-height: 140px; }
  .badge {
    position: absolute; top: var(--space-4); right: var(--space-4);
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--color-accent); color: var(--color-accent-fg);
    display: flex; align-items: center; justify-content: center;
    font-size: var(--text-xs); font-weight: 700;
  }
  .card-label       { font-size: var(--text-base); font-weight: 700; margin-bottom: var(--space-3); }
  .card-label.right { text-align: right; }
  .dot-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
  .dot       { width: 7px; height: 7px; border-radius: 50%; background: var(--color-border); transition: background 200ms ease; }
  .dot.filled { background: var(--color-accent); }

  /* Today */
  .section-title { font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-4); }
  .list-item  { display: flex; gap: var(--space-3); margin-bottom: var(--space-3); align-items: flex-start; }
  .item-body  { flex: 1; min-width: 0; }
  .bullet     { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); margin-top: 6px; flex-shrink: 0; }
  .item-name  { font-size: var(--text-sm); font-weight: 600; transition: color 200ms ease, text-decoration-color 200ms ease; }
  .item-name.done { color: var(--color-text-muted); text-decoration: line-through; }
  .item-meta  { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }
  .empty      { font-size: var(--text-sm); color: var(--color-text-muted); padding: var(--space-4) 0; }
  .today-footer { display: flex; justify-content: flex-end; align-items: center; margin-top: var(--space-5); }

  .checkbox {
    width: 18px; height: 18px; border-radius: 6px;
    border: 1.5px solid var(--color-border);
    background: var(--color-bg);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; color: var(--color-accent-fg);
    margin-top: 2px; flex-shrink: 0;
    transition: background 180ms ease, border-color 180ms ease;
  }
  .checkbox.checked { background: var(--color-accent); border-color: var(--color-accent); }

  .row-action {
    width: 24px; height: 24px; border-radius: 50%;
    color: var(--color-text-muted); font-size: 16px; line-height: 1;
    opacity: 0; transition: opacity 180ms ease, background 180ms ease, color 180ms ease;
    flex-shrink: 0;
  }
  .list-item:hover .row-action { opacity: 1; }
  .row-action:hover { background: var(--color-bg); color: var(--color-text); }

  .btn-circle {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--color-accent); color: var(--color-accent-fg);
    font-size: 16px; display: flex; align-items: center; justify-content: center;
    transition: transform 180ms ease;
  }
  .btn-circle:hover { transform: scale(1.06); }
  .btn-circle.lg { width: 44px; height: 44px; font-size: 22px; font-weight: 300; }

  /* Spending */
  .spending-top    { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
  .spending-amount { font-size: var(--text-xl); font-weight: 800; }
  .spending-sub    { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }
  .chart  { width: 100%; height: 80px; display: block; margin-bottom: var(--space-4); }
  .chart-line, .chart-area { transition: d 400ms ease; }
  .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .filter-pill {
    padding: 5px 14px; border-radius: 20px;
    background: var(--color-bg); font-size: var(--text-xs); font-weight: 600;
    transition: background 200ms ease, color 200ms ease;
  }
  .filter-pill.active { background: var(--color-accent); color: var(--color-accent-fg); }

  /* Actions */
  .action-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: var(--space-3); min-height: 140px; text-align: center;
    cursor: pointer; border: none; width: 100%;
  }

  /* Confirm modal */
  .confirm-text { font-size: var(--text-sm); margin-bottom: var(--space-5); }
  .confirm-actions { display: flex; gap: var(--space-3); }
  .btn-secondary {
    flex: 1; padding: var(--space-3) 0; border-radius: var(--radius-md);
    background: var(--color-bg); color: var(--color-text-muted);
    font-size: var(--text-sm); font-weight: 600;
  }
  .btn-danger {
    flex: 1; padding: var(--space-3) 0; border-radius: var(--radius-md);
    background: #b14a3a; color: white;
    font-size: var(--text-sm); font-weight: 700;
  }
</style>
