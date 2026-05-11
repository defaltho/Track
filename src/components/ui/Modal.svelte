<script>
  let { open = false, title = '', onClose, children } = $props()
</script>

{#if open}
  <div class="overlay" onclick={onClose} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
      <div class="modal-header">
        <h2 class="modal-title">{title}</h2>
        <button class="close-btn" onclick={onClose} aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,0.25);
    display: flex; align-items: flex-end; justify-content: center;
    animation: fade-in 150ms ease;
  }

  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }

  .modal {
    background: var(--color-surface);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    width: 100%;
    max-width: 520px;
    max-height: 88dvh;
    overflow-y: auto;
    animation: slide-up 200ms ease;
  }

  @keyframes slide-up {
    from { transform: translateY(24px); opacity: 0 }
    to   { transform: translateY(0);    opacity: 1 }
  }

  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-5) var(--space-5) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    position: sticky; top: 0; background: var(--color-surface);
  }

  .modal-title { font-size: var(--text-lg); font-weight: 700; }

  .close-btn {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--color-bg); font-size: 18px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    color: var(--color-text-muted);
  }

  .modal-body { padding: var(--space-5); }

  @media (min-width: 600px) {
    .overlay { align-items: center; padding: var(--space-4); }
    .modal { border-radius: var(--radius-xl); }
  }
</style>
