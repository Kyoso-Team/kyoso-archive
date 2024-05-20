<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { FormStore } from '$types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let long = false;
  export let disabled = false;
  let hasWritten = false;
  let optional = false;
  let value: string | undefined = $form.value[label];
  let error = $form.errors?.[label];

  function onInput() {
    hasWritten = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'optional';
  }

  $: {
    form.setValue(label, value === '' ? undefined : value);
  }

  $: {
    error = $form.errors?.[label];
  }
</script>

<label class="label relative">
  <legend>
    {legend}<span class="text-error-600">{optional ? '' : '*'}</span>
  </legend>
  {#if $$slots.default}
    <p class="inline-block my-2 text-sm dark:text-surface-300 text-surface-700">
      <slot />
    </p>
  {/if}
  {#if long}
    <textarea
      class={`textarea resize-none h-32 ${error && hasWritten ? 'input-error' : ''}`}
      {disabled}
      on:input={onInput}
      bind:value
    />
  {:else}
    <input
      type="text"
      class={`input ${error && hasWritten ? 'input-error' : ''}`}
      {disabled}
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
    <span class="block text-sm text-error-600" transition:slide={{ duration: 150 }}>{error}.</span>
  {/if}
  <slot name="corner" />
</label>
