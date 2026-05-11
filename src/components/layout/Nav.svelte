<script>
  let { page, onNavigate } = $props()

  const links = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calendar',  label: 'Calendar'  },
    { id: 'analytics', label: 'Analytics' },
  ]
</script>

<nav class="nav" aria-label="Primary">
  {#each links as link}
    <button
      class="nav-item"
      class:active={page === link.id}
      aria-current={page === link.id ? 'page' : undefined}
      onclick={() => onNavigate(link.id)}
    >
      <span class="label">{link.label}</span>
      <span class="dot"></span>
    </button>
  {/each}
</nav>

<style>
  .nav {
    display: flex;
    justify-content: center;
    gap: var(--space-2);
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: var(--space-3) var(--space-4);
    position: sticky;
    bottom: 0;
    z-index: 10;
    backdrop-filter: saturate(160%) blur(8px);
  }

  .nav-item {
    position: relative;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    transition: color 180ms ease, transform 180ms ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .nav-item:hover { color: var(--color-text); transform: translateY(-1px); }

  .nav-item .dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: transparent;
    transition: background 200ms ease, transform 200ms ease;
  }

  .nav-item.active { color: var(--color-accent); }
  .nav-item.active .dot { background: var(--color-accent); transform: scale(1.4); }

  @media (min-width: 900px) {
    .nav {
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      border-top: none;
      border-right: 1px solid var(--color-border);
      padding: var(--space-6) var(--space-4);
      position: sticky;
      top: 0;
      height: 100dvh;
      width: 180px;
      gap: var(--space-1);
    }

    .nav-item { flex-direction: row; justify-content: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); }
    .nav-item .dot { order: -1; }
  }
</style>
