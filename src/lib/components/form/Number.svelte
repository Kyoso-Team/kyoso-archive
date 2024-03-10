<script lang="ts">
  import type { FormStore } from '$types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let time = false;
  let hasWritten = false;
  let optional = false;
  let value: number | null;
  let error = $form.errors?.[label];
  const timeValue = {
    multiplier: 'undefined',
    value: 0
  };

  function onInput() {
    hasWritten = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'optional';
  }

  $: {
    form.setValue(label, value === null ? undefined : value);
  }

  $: {
    error = $form.errors?.[label];
  }

  $: {
    if (time) {
      if (timeValue.multiplier !== 'undefined') {
        value = timeValue.value * Number(timeValue.multiplier);
      } else {
        value = null;
      }
    }
  }
</script>

<label class="label">
  <legend>
    {legend}<span class="text-error-600">{optional ? '' : '*'}</span>
  </legend>
  {#if $$slots.default}
    <p class="inline-block my-2 text-sm dark:text-surface-300 text-surface-700">
      <slot />
    </p>
  {/if}
  {#if time}
    <div class="input-group input-group-divider grid-cols-[1fr_auto]">
      <input
        type="number"
        class={`input ${error && hasWritten ? 'input-error' : ''}`}
        on:input={onInput}
        bind:value={timeValue.value}
      />
      <select bind:value={timeValue.multiplier}>
        <option value="undefined">---</option>
        <option value="1000">Seconds</option>
        <option value="60000">Minutes</option>
        <option value="3600000">Hours</option>
        <option value="86400000">Days</option>
        <option value="604800000">Weeks</option>
        <option value="2592000000">Months</option>
        <option value="31536000000">Years</option>
      </select>
    </div>
  {:else}
    <input
      type="number"
      class={`input ${error && hasWritten ? 'input-error' : ''}`}
      on:input={onInput}
      bind:value
    />
  {/if}
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
  {#if error && hasWritten}
    <span class="block text-sm text-error-600">{error}.</span>
  {/if}
</label>
