<script>
  import { subscriptions } from '../stores/data.svelte.js'
  import { totalMonthlySpend, projectedYearly, coffees, monthlyEquivalent } from '../utils/calculations.js'

  const monthly  = $derived(totalMonthlySpend(subscriptions.items))
  const yearly   = $derived(projectedYearly(subscriptions.items))
  const coffeeCount = $derived(coffees(monthly))

  const breakdown = $derived(
    subscriptions.items
      .filter(s => s.active !== false)
      .map(s => ({ ...s, monthly: monthlyEquivalent(s.price, s.billingCycle) }))
      .sort((a, b) => b.monthly - a.monthly)
  )

  let timeFilter = $state('1Y')
  const filters = ['1W', '3M', '6M', '1Y', 'Max']
</script>

<div class="analytics-page">
  <!-- Summary -->
  <div class="card">
    <div class="summary-grid">
      <div class="stat">
        <p class="stat-num">{monthly.toFixed(2)}</p>
        <p class="stat-label">per month</p>
      </div>
      <div class="stat">
        <p class="stat-num">{yearly.toFixed(2)}</p>
        <p class="stat-label">per year</p>
      </div>
      <div class="stat">
        <p class="stat-num">{coffeeCount}</p>
        <p class="stat-label">coffees / mo</p>
      </div>
    </div>
  </div>

  <!-- Chart -->
  <div class="card">
    <div class="chart-header">
      <p class="card-title">Spending over time</p>
      <div class="filters">
        {#each filters as f}
          <button
            class="filter-pill"
            class:active={timeFilter === f}
            onclick={() => timeFilter = f}
          >{f}</button>
        {/each}
      </div>
    </div>
    <svg class="chart" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="M0 80 C40 68 70 28 110 38 S190 58 240 48 L300 52 L300 100 L0 100 Z" fill="url(#g2)"/>
      <path d="M0 80 C40 68 70 28 110 38 S190 58 240 48 L300 52" fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="300" cy="52" r="3" fill="#000"/>
    </svg>
  </div>

  <!-- Breakdown -->
  {#if breakdown.length > 0}
    <div class="card">
      <p class="card-title" style="margin-bottom: var(--space-5)">Breakdown</p>
      {#each breakdown as sub}
        {@const pct = monthly > 0 ? (sub.monthly / monthly) * 100 : 0}
        <div class="breakdown-row">
          <div class="breakdown-info">
            <span class="breakdown-name">{sub.emoji ?? '💳'} {sub.name}</span>
            <span class="breakdown-pct">{pct.toFixed(0)}%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: {pct}%"></div>
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
  }

  .summary-grid { display: flex; justify-content: space-between; }
  .stat-num { font-size: var(--text-xl); font-weight: 800; }
  .stat-label { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; }

  .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2); }
  .card-title { font-size: var(--text-base); font-weight: 700; }
  .chart { width: 100%; height: 100px; display: block; }

  .filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .filter-pill {
    padding: 5px 12px; border-radius: 20px;
    background: var(--color-bg); font-size: var(--text-xs); font-weight: 600;
    transition: background 150ms, color 150ms;
  }
  .filter-pill.active { background: var(--color-accent); color: var(--color-accent-fg); }

  .breakdown-row { margin-bottom: var(--space-4); }
  .breakdown-info { display: flex; justify-content: space-between; margin-bottom: var(--space-1); }
  .breakdown-name { font-size: var(--text-sm); font-weight: 500; }
  .breakdown-pct { font-size: var(--text-sm); color: var(--color-text-muted); }
  .bar-track { height: 4px; background: var(--color-border); border-radius: 2px; }
  .bar-fill { height: 100%; background: var(--color-accent); border-radius: 2px; transition: width 400ms ease; }

  .empty-card { text-align: center; padding: var(--space-8); }
  .empty { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
