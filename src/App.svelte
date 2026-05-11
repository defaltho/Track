<script>
  import Nav from './components/layout/Nav.svelte'
  import Toast from './components/ui/Toast.svelte'
  import Dashboard from './pages/Dashboard.svelte'
  import Calendar from './pages/Calendar.svelte'
  import Analytics from './pages/Analytics.svelte'
  import { fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'

  let page = $state('dashboard')

  const titles = {
    dashboard: 'Track — Dashboard',
    calendar:  'Track — Calendar',
    analytics: 'Track — Analytics',
  }

  $effect(() => { document.title = titles[page] ?? 'Track' })
</script>

<div class="app">
  <main class="main">
    {#key page}
      <div
        class="page"
        in:fly={{ y: 12, duration: 280, easing: cubicOut, delay: 60 }}
      >
        {#if page === 'dashboard'}
          <Dashboard />
        {:else if page === 'calendar'}
          <Calendar />
        {:else if page === 'analytics'}
          <Analytics />
        {/if}
      </div>
    {/key}
  </main>
  <Nav {page} onNavigate={(p) => page = p} />
</div>

<Toast />

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
    overflow-x: hidden;
  }

  .page { width: 100%; }

  @media (min-width: 900px) {
    .app { flex-direction: row; }
    .main { max-width: none; flex: 1; }
  }
</style>
