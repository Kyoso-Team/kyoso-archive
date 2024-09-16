<script lang="ts">
  import NotAllowed from './NotAllowed.svelte';
  import Warning from './Warning.svelte';
  import { slide } from 'svelte/transition';
  import { dateToHtmlInput } from '$lib/utils';
  import type { FormStore } from '$lib/types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let disabled = false;
  export let warningMsg: string | undefined = undefined;
  export let notAllowedMsg: string | undefined = undefined;
  let hasSelected = false;
  let optional = false;
  let value: string | undefined = $form.value[label]
    ? dateToHtmlInput($form.value[label], true)
    : undefined;
  let error = $form.errors?.[label];

  function onInput() {
    hasSelected = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'nullable';
  }

  $: {
    if (!value) {
      form.setValue(label, null);
    } else {
      const date = new Date(value);
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
      form.setValue(label, !value ? null : localDate);
    }
  }

  $: {
    error = $form.errors?.[label];
  }

  $: {
    if ($form.overwritten?.[label]) {
      hasSelected = false;
      value = $form.value[label] ? dateToHtmlInput($form.value[label], true) : undefined;
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
  <input
    type="date"
    class={`input dark:[color-scheme:dark] ${error && hasSelected ? 'input-error' : ''}`}
    {disabled}
    on:input={onInput}
    bind:value
  />
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
  {#if error && hasSelected}
    <span class="block text-sm text-error-600" transition:slide={{ duration: 150 }}>{error}.</span>
  {/if}
</label>
