<script lang="ts">
  import NotAllowed from './NotAllowed.svelte';
  import Warning from './Warning.svelte';
  import { slide } from 'svelte/transition';
  import type { FormStore } from '$lib/types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let options: Record<string, string>;
  export let disabled = false;
  export let onChange: (() => void) | undefined = undefined;
  export let warningMsg: string | undefined = undefined;
  export let notAllowedMsg: string | undefined = undefined;
  let hasSelected = false;
  let optional = false;
  let value: string = !$form.value[label] ? 'null' : $form.value[label];
  let error = $form.errors?.[label];

  function onInput() {
    hasSelected = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'nullable';
  }

  $: {
    form.setValue(label, value === 'null' ? null : value);
  }

  $: {
    error = $form.errors?.[label];
  }

  $: {
    if ($form.overwritten?.[label]) {
      hasSelected = false;
      value = !$form.value[label] ? 'null' : $form.value[label];
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
  <select
    class={`select ${error && hasSelected ? 'input-error' : ''}`}
    {disabled}
    on:input={onInput}
    on:change={onChange}
    bind:value
  >
    <option value="null">---</option>
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
    <span class="block text-sm text-error-600" transition:slide={{ duration: 150 }}>{error}.</span>
  {/if}
</label>
