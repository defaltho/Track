<script>
  import { subscriptions, tasks, events } from '../stores/data.svelte.js'
  import { totalMonthlySpend, coffees } from '../utils/calculations.js'
  import Modal from '../components/ui/Modal.svelte'
  import AddTrackForm from '../components/forms/AddTrackForm.svelte'
  import AddTaskForm from '../components/forms/AddTaskForm.svelte'
  import { format } from 'date-fns'

  const now    = new Date()
  const today  = format(now, 'yyyy-MM-dd')
  const month  = format(now, 'yyyy-MM')

  const monthly     = $derived(totalMonthlySpend(subscriptions.items))
  const coffeeCount = $derived(coffees(monthly))
  const monthEvents = $derived(events.items.filter(e => e.date?.startsWith(month)))
  const todayTasks  = $derived(tasks.items.filter(t => !t.done && t.dueDate === today))
  const dueSubs     = $derived(
    subscriptions.items.filter(s => {
      const diff = Math.round((new Date(s.nextChargeDate) - now) / 86400000)
      return diff >= 0 && diff <= 7
    })
  )
  const hasToday = $derived(dueSubs.length > 0 || todayTasks.length > 0)

  let showAddTrack = $state(false)
  let showAddTask  = $state(false)

  function handleAddTrack(data) {
    if (data.type === 'subscription') subscriptions.add(data)
    else if (data.type === 'app')    apps.add(data)
    else if (data.type === 'event')  events.add(data)
    showAddTrack = false
  }

  function handleAddTask(data) {
    tasks.add(data)
    showAddTask = false
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
        {#each Array(28) as _, i}
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
      <div class="list-item">
        <span class="bullet"></span>
        <div>
          <p class="item-name">{sub.emoji ?? '💳'} {sub.name}</p>
          <p class="item-meta">{sub.currency} {sub.price} · {sub.nextChargeDate}</p>
        </div>
      </div>
    {/each}

    {#each todayTasks as task (task.id)}
      <div class="list-item">
        <span class="bullet"></span>
        <div>
          <p class="item-name">{task.name}</p>
          {#if task.note}<p class="item-meta">{task.note}</p>{/if}
        </div>
      </div>
    {/each}

    <div class="today-footer">
      <button class="btn-circle lg" onclick={() => showAddTrack = true} aria-label="Add track">+</button>
      <div class="row-gap">
        <button class="btn-circle" aria-label="Edit">✎</button>
        <button class="btn-circle" aria-label="Remove">−</button>
      </div>
    </div>
  </div>

  <!-- Spending -->
  <div class="card spending-card">
    <div class="spending-top">
      <div>
        <p class="spending-amount">{monthly.toFixed(0)}</p>
        <p class="spending-sub">Per Month = {coffeeCount} coffees</p>
      </div>
      <p class="card-label right">Your Subscriptions</p>
    </div>

    <svg class="chart" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="M0 70 C50 55 80 20 120 30 S200 52 250 42 L300 46 L300 80 L0 80 Z" fill="url(#g1)"/>
      <path d="M0 70 C50 55 80 20 120 30 S200 52 250 42 L300 46" fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>

    <div class="filters">
      {#each ['1W','3M','6M','1Y','Max'] as f}
        <button class="filter-pill">{f}</button>
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

<!-- Modals -->
<Modal open={showAddTrack} title="Add Track" onClose={() => showAddTrack = false}>
  <AddTrackForm onSubmit={handleAddTrack} onCancel={() => showAddTrack = false} />
</Modal>

<Modal open={showAddTask} title="Add Task" onClose={() => showAddTask = false}>
  <AddTaskForm onSubmit={handleAddTask} onCancel={() => showAddTask = false} />
</Modal>

<style>
  .dashboard { display: flex; flex-direction: column; gap: var(--space-4); padding-bottom: var(--space-6); }

  .row-2  { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  .row-gap { display: flex; gap: var(--space-2); }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--space-5);
  }

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
  .dot       { width: 7px; height: 7px; border-radius: 50%; background: var(--color-border); }
  .dot.filled { background: var(--color-accent); }

  /* Today */
  .section-title { font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-4); }
  .list-item  { display: flex; gap: var(--space-3); margin-bottom: var(--space-3); align-items: flex-start; }
  .bullet     { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); margin-top: 4px; flex-shrink: 0; }
  .item-name  { font-size: var(--text-sm); font-weight: 600; }
  .item-meta  { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }
  .empty      { font-size: var(--text-sm); color: var(--color-text-muted); padding: var(--space-4) 0; }
  .today-footer { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-5); }

  .btn-circle {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--color-accent); color: var(--color-accent-fg);
    font-size: 16px; display: flex; align-items: center; justify-content: center;
  }
  .btn-circle.lg { width: 44px; height: 44px; font-size: 22px; font-weight: 300; }

  /* Spending */
  .spending-top    { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
  .spending-amount { font-size: var(--text-xl); font-weight: 800; }
  .spending-sub    { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }
  .chart  { width: 100%; height: 80px; display: block; margin-bottom: var(--space-4); }
  .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .filter-pill {
    padding: 5px 14px; border-radius: 20px;
    background: var(--color-bg); font-size: var(--text-xs); font-weight: 600;
  }

  /* Actions */
  .action-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: var(--space-3); min-height: 140px; text-align: center;
    cursor: pointer; transition: box-shadow 150ms;
    border: none; width: 100%;
  }
  .action-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .action-icon  { display: flex; }
  .action-label { font-size: var(--text-base); font-weight: 700; }
</style>
