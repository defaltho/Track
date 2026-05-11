<script>
  import { toasts } from '../../stores/toasts.svelte.js'
  import { fly, fade } from 'svelte/transition'
</script>

<div class="toast-stack" aria-live="polite" aria-atomic="true">
  {#each toasts.items as t (t.id)}
    <div
      class="toast"
      class:success={t.type === 'success'}
      class:warning={t.type === 'warning'}
      in:fly={{ y: 16, duration: 240 }}
      out:fade={{ duration: 180 }}
    >
      {t.message}
    </div>
  {/each}
</div>

<style>
  .toast-stack {
    position: fixed;
    bottom: 88px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    z-index: 200;
    pointer-events: none;
  }

  .toast {
    background: var(--color-text);
    color: var(--color-surface);
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-lg);
    font-size: var(--text-sm);
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    pointer-events: auto;
    white-space: nowrap;
  }

  .toast.success { background: #1a1a1a; }
  .toast.warning { background: #b14a3a; }

  @media (min-width: 900px) {
    .toast-stack {
      bottom: var(--space-6);
      left: auto;
      right: var(--space-6);
      transform: none;
    }
  }
</style>
