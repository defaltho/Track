<script>
  let { onSubmit, onCancel } = $props()

  let name     = $state('')
  let dueDate  = $state('')
  let priority = $state('medium')
  let category = $state('Other')
  let note     = $state('')

  const priorities = ['low', 'medium', 'high']
  const categories = ['Personal', 'Work', 'Finance', 'Health', 'Travel', 'Other']

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      done: false,
      dueDate: dueDate || null,
      priority,
      category,
      note: note.trim(),
      amount: null,
      currency: null,
    })
  }
</script>

<form onsubmit={submit}>
  <div class="fields">
    <div class="field">
      <label>Task name *</label>
      <input type="text" bind:value={name} placeholder="Cancel gym membership" required />
    </div>

    <div class="field">
      <label>Due date</label>
      <input type="date" bind:value={dueDate} />
    </div>

    <div class="field">
      <label>Priority</label>
      <div class="pills">
        {#each priorities as p}
          <button type="button" class="pill" class:active={priority === p} onclick={() => priority = p}>
            {p}
          </button>
        {/each}
      </div>
    </div>

    <div class="field">
      <label>Category</label>
      <select bind:value={category}>
        {#each categories as c}<option>{c}</option>{/each}
      </select>
    </div>

    <div class="field">
      <label>Note</label>
      <input type="text" bind:value={note} placeholder="Optional" />
    </div>
  </div>

  <div class="actions">
    <button type="button" class="btn-secondary" onclick={onCancel}>Cancel</button>
    <button type="submit" class="btn-primary">Add Task</button>
  </div>
</form>

<style>
  .fields { display: flex; flex-direction: column; gap: var(--space-4); }

  .field { display: flex; flex-direction: column; gap: var(--space-1); }

  label { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

  input, select {
    padding: var(--space-3);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    background: var(--color-bg);
    width: 100%;
    transition: border-color 150ms;
  }
  input:focus, select:focus { outline: none; border-color: var(--color-accent); }

  .pills { display: flex; gap: var(--space-2); }
  .pill {
    flex: 1; padding: var(--space-2) 0; border-radius: var(--radius-md);
    font-size: var(--text-xs); font-weight: 600;
    background: var(--color-bg); color: var(--color-text-muted);
    border: 1.5px solid var(--color-border);
    transition: all 150ms;
  }
  .pill.active { background: var(--color-accent); color: var(--color-accent-fg); border-color: var(--color-accent); }

  .actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); }
  .btn-primary {
    flex: 1; padding: var(--space-3) 0; border-radius: var(--radius-md);
    background: var(--color-accent); color: var(--color-accent-fg);
    font-size: var(--text-sm); font-weight: 700;
  }
  .btn-secondary {
    padding: var(--space-3) var(--space-5); border-radius: var(--radius-md);
    background: var(--color-bg); color: var(--color-text-muted);
    font-size: var(--text-sm); font-weight: 600;
  }
</style>
