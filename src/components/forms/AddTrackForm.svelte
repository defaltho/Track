<script>
  let { onSubmit, onCancel } = $props()

  let type         = $state('subscription')
  let name         = $state('')
  let emoji        = $state('💳')
  let price        = $state('')
  let currency     = $state('EUR')
  let billingCycle = $state('monthly')
  let nextDate     = $state('')
  let category     = $state('Other')
  let payment      = $state('Card')
  let note         = $state('')

  const types    = ['subscription', 'app', 'event']
  const currencies = ['EUR', 'USD', 'GBP', 'BRL']
  const cycles   = ['weekly', 'monthly', 'yearly']
  const cats     = ['Streaming', 'Music', 'Gaming', 'Cloud', 'Productivity', 'News', 'Fitness', 'Education', 'Other']
  const payments = ['Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other']

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || !price || !nextDate) return
    onSubmit({
      type,
      name: name.trim(),
      emoji,
      color: '#000000',
      price: parseFloat(price),
      currency,
      billingCycle,
      nextChargeDate: nextDate,
      purchaseDate: nextDate,
      date: nextDate,
      category,
      paymentMethod: payment,
      note: note.trim(),
      active: true,
    })
  }
</script>

<form onsubmit={submit}>
  <div class="type-tabs">
    {#each types as t}
      <button type="button" class="tab" class:active={type === t} onclick={() => type = t}>
        {t.charAt(0).toUpperCase() + t.slice(1)}
      </button>
    {/each}
  </div>

  <div class="fields">
    <div class="row">
      <div class="field emoji-field">
        <label>Icon</label>
        <input type="text" bind:value={emoji} maxlength="2" />
      </div>
      <div class="field grow">
        <label>Name *</label>
        <input type="text" bind:value={name} placeholder="Netflix" required />
      </div>
    </div>

    <div class="row">
      <div class="field grow">
        <label>Price *</label>
        <input type="number" bind:value={price} min="0" step="0.01" placeholder="9.99" required />
      </div>
      <div class="field">
        <label>Currency</label>
        <select bind:value={currency}>
          {#each currencies as c}<option>{c}</option>{/each}
        </select>
      </div>
    </div>

    {#if type === 'subscription'}
      <div class="field">
        <label>Billing cycle</label>
        <div class="pills">
          {#each cycles as c}
            <button type="button" class="pill" class:active={billingCycle === c} onclick={() => billingCycle = c}>
              {c}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="field">
      <label>{type === 'event' ? 'Date' : type === 'app' ? 'Purchase date' : 'Next charge'} *</label>
      <input type="date" bind:value={nextDate} required />
    </div>

    <div class="row">
      <div class="field grow">
        <label>Category</label>
        <select bind:value={category}>
          {#each cats as c}<option>{c}</option>{/each}
        </select>
      </div>
      {#if type === 'subscription'}
        <div class="field grow">
          <label>Payment</label>
          <select bind:value={payment}>
            {#each payments as m}<option>{m}</option>{/each}
          </select>
        </div>
      {/if}
    </div>

    <div class="field">
      <label>Note</label>
      <input type="text" bind:value={note} placeholder="Optional" />
    </div>
  </div>

  <div class="actions">
    <button type="button" class="btn-secondary" onclick={onCancel}>Cancel</button>
    <button type="submit" class="btn-primary">Add</button>
  </div>
</form>

<style>
  .type-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); }
  .tab {
    flex: 1; padding: var(--space-2) 0; border-radius: var(--radius-md);
    font-size: var(--text-sm); font-weight: 600;
    background: var(--color-bg); color: var(--color-text-muted);
    transition: background 150ms, color 150ms;
  }
  .tab.active { background: var(--color-accent); color: var(--color-accent-fg); }

  .fields { display: flex; flex-direction: column; gap: var(--space-4); }

  .row { display: flex; gap: var(--space-3); align-items: flex-end; }
  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .field.grow { flex: 1; }
  .field.emoji-field { width: 60px; }

  label { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

  input, select {
    padding: var(--space-3) var(--space-3);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    background: var(--color-bg);
    width: 100%;
    transition: border-color 150ms;
  }
  input:focus, select:focus { outline: none; border-color: var(--color-accent); }

  .field.emoji-field input { text-align: center; font-size: 18px; padding: var(--space-2); }

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
