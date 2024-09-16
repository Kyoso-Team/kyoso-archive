<script lang="ts">
  import Warning from './Warning.svelte';
  import NotAllowed from './NotAllowed.svelte';
  import { slide } from 'svelte/transition';
  import type { FormStore } from '$lib/types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let long = false;
  export let disabled = false;
  export let warningMsg: string | undefined = undefined;
  export let notAllowedMsg: string | undefined = undefined;
  let hasWritten = false;
  let optional = false;
  let value: string | undefined | null = $form.value[label];
  let error = $form.errors?.[label];

  function onInput() {
    hasWritten = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'nullable';
  }

  $: {
    form.setValue(label, value === undefined || value === null ? null : value.trim());
  }

  $: {
    error = $form.errors?.[label];
  }

  $: {
    if ($form.overwritten?.[label]) {
      hasWritten = false;
      value = $form.defaults[label];
      form.setOverwrittenState(label, false);
    }
  }
</script>

<label class="label relative">
  <div class="flex gap-1 absolute top-0 right-0 !mt-0">
    {#if warningMsg}
      <Warning inputLabel={label} tooltipLabel={warningMsg} />
    {/if}
    {#if notAllowedMsg}
      <NotAllowed inputLabel={label} tooltipLabel={notAllowedMsg} />
    {/if}
  </div>
  <legend class="!mt-0">
    {legend}<span class="text-error-600">{optional ? '' : '*'}</span>
  </legend>
  {#if $$slots.default}
    <p class="inline-block my-2 text-sm text-surface-600-300-token">
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
</label>
