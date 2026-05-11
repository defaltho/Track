<script>
  import Nav from './components/layout/Nav.svelte'
  import Dashboard from './pages/Dashboard.svelte'
  import Calendar from './pages/Calendar.svelte'
  import Analytics from './pages/Analytics.svelte'

  let page = $state('dashboard')
</script>

<div class="app">
  <main class="main">
    {#if page === 'dashboard'}
      <Dashboard />
    {:else if page === 'calendar'}
      <Calendar />
    {:else if page === 'analytics'}
      <Analytics />
    {/if}
  </main>
  <Nav {page} onNavigate={(p) => page = p} />
</div>

<style>
  .app {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    padding: var(--space-4);
    padding-bottom: var(--space-2);
    max-width: 640px;
    margin: 0 auto;
    width: 100%;
  }

  @media (min-width: 900px) {
    .app { flex-direction: row; }
    .main { max-width: none; flex: 1; }
  }
</style>
