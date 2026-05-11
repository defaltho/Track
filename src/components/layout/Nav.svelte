<script>
  let { page, onNavigate } = $props()

  const links = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calendar',  label: 'Calendar'  },
    { id: 'analytics', label: 'Analytics' },
  ]
</script>

<nav class="nav">
  {#each links as link}
    <button
      class="nav-item"
      class:active={page === link.id}
      onclick={() => onNavigate(link.id)}
    >
      {link.label}
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
  }

  .nav-item {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    transition: color 150ms ease, background 150ms ease;
  }

  .nav-item.active {
    color: var(--color-accent);
    background: var(--color-bg);
  }

  @media (min-width: 900px) {
    .nav {
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      border-top: none;
      border-right: 1px solid var(--color-border);
      padding: var(--space-6) var(--space-4);
      position: sticky;
      top: 0;
      height: 100dvh;
      width: 160px;
      gap: var(--space-1);
    }

    .nav-item { width: 100%; }
  }
</style>
