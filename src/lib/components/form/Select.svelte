<script lang="ts">
  import type { FormStore } from '$types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let options: Record<string, string>;
  let hasSelected = false;
  let optional = false;
  let value: string | undefined;
  let error = $form.errors?.[label];

  function onInput() {
    hasSelected = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'optional';
  }

  $: {
    form.setValue(label, value === 'undefined' ? undefined : value);
  }

  $: {
    error = $form.errors?.[label];
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
  <select class={`select ${error && hasSelected ? 'input-error' : ''}`} on:input={onInput} bind:value>
    <option value="undefined">---</option>
    {#each Object.entries(options) as [value, option]}
      <option {value}>{option}</option>
    {/each}
  </select>
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
  {#if error && hasSelected}
    <span class="block text-sm text-error-600">{error}.</span>
  {/if}
</label>
