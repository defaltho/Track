<script>
  import { subscriptions, settings } from '../stores/data.svelte.js'
  import { totalMonthlySpend, projectedYearly, coffees, monthlyEquivalent } from '../utils/calculations.js'
  import { buildSpendingTimeline, pointsToPath, RANGE_DAYS } from '../utils/chart.js'
  import { fade } from 'svelte/transition'
  import { tweened } from 'svelte/motion'
  import { cubicOut } from 'svelte/easing'

  const currency = $derived(settings.value.defaultCurrency ?? 'EUR')
  const symbol   = $derived({ EUR: '€', USD: '$', GBP: '£', BRL: 'R$' }[currency] ?? '')

  const monthly     = $derived(totalMonthlySpend(subscriptions.items))
  const yearly      = $derived(projectedYearly(subscriptions.items))
  const coffeeCount = $derived(coffees(monthly))

  const breakdown = $derived(
    subscriptions.items
      .filter(s => s.active !== false)
      .map(s => ({ ...s, monthly: monthlyEquivalent(s.price, s.billingCycle) }))
      .sort((a, b) => b.monthly - a.monthly)
  )

  let timeRange  = $state('1Y')
  const timeline = $derived(buildSpendingTimeline(subscriptions.items, RANGE_DAYS[timeRange]))
  const path     = $derived(pointsToPath(timeline, 300, 100))

  // Animated counters
  const monthlyAnim = tweened(0, { duration: 600, easing: cubicOut })
  const yearlyAnim  = tweened(0, { duration: 600, easing: cubicOut })
  const coffeeAnim  = tweened(0, { duration: 600, easing: cubicOut })
  $effect(() => { monthlyAnim.set(monthly) })
  $effect(() => { yearlyAnim.set(yearly) })
  $effect(() => { coffeeAnim.set(coffeeCount) })
</script>

<div class="analytics-page">
  <!-- Summary -->
  <div class="card">
    <div class="summary-grid">
      <div class="stat">
        <p class="stat-num">{symbol}{$monthlyAnim.toFixed(0)}</p>
        <p class="stat-label">per month</p>
      </div>
      <div class="stat">
        <p class="stat-num">{symbol}{$yearlyAnim.toFixed(0)}</p>
        <p class="stat-label">per year</p>
      </div>
      <div class="stat">
        <p class="stat-num">{$coffeeAnim.toFixed(0)}</p>
        <p class="stat-label">coffees / mo</p>
      </div>
    </div>
  </div>

  <!-- Chart -->
  <div class="card">
    <div class="chart-header">
      <p class="card-title">Spending over time</p>
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
    <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      {#if subscriptions.items.length > 0}
        <path d={path.area} fill="url(#g2)" />
        <path d={path.line} fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx={path.last.x} cy={path.last.y} r="3" fill="#000"/>
      {:else}
        <text x="150" y="54" text-anchor="middle" font-size="12" fill="#888">Add a subscription to see the chart</text>
      {/if}
    </svg>
  </div>

  <!-- Breakdown -->
  {#if breakdown.length > 0}
    <div class="card">
      <p class="card-title" style="margin-bottom: var(--space-5)">Breakdown</p>
      {#each breakdown as sub, i (sub.id)}
        {@const pct = monthly > 0 ? (sub.monthly / monthly) * 100 : 0}
        <div class="breakdown-row" in:fade={{ duration: 240, delay: 60 + i * 50 }}>
          <div class="breakdown-info">
            <span class="breakdown-name">{sub.emoji ?? '💳'} {sub.name}</span>
            <span class="breakdown-pct">{symbol}{sub.monthly.toFixed(2)} · {pct.toFixed(0)}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="--target: {pct}%; animation-delay: {60 + i * 50}ms"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="card empty-card">
      <p class="empty">No subscriptions yet</p>
    </div>
  {/if}
</div>

<style>
  .analytics-page { display: flex; flex-direction: column; gap: var(--space-4); padding-bottom: var(--space-6); }

  .card {
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--space-5);
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

  .summary-grid { display: flex; justify-content: space-between; gap: var(--space-3); }
  .stat-num { font-size: var(--text-xl); font-weight: 800; font-variant-numeric: tabular-nums; }
  .stat-label { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }

  .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2); }
  .card-title { font-size: var(--text-base); font-weight: 700; }
  .chart { width: 100%; height: 100px; display: block; }

  .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .filter-pill {
    padding: 5px 12px; border-radius: 20px;
    background: var(--color-bg); font-size: var(--text-xs); font-weight: 600;
    transition: background 200ms ease, color 200ms ease;
  }
  .filter-pill.active { background: var(--color-accent); color: var(--color-accent-fg); }

  .breakdown-row { margin-bottom: var(--space-4); }
  .breakdown-info { display: flex; justify-content: space-between; margin-bottom: var(--space-1); }
  .breakdown-name { font-size: var(--text-sm); font-weight: 500; }
  .breakdown-pct { font-size: var(--text-sm); color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
  .bar-track { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }

  .bar-fill {
    height: 100%; background: var(--color-accent); border-radius: 2px;
    width: 0;
    animation: bar-grow 600ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  }

  @keyframes bar-grow {
    from { width: 0; }
    to   { width: var(--target); }
  }

  .empty-card { text-align: center; padding: var(--space-8); }
  .empty { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
