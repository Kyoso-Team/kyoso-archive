<script lang="ts">
  import NotAllowed from './NotAllowed.svelte';
  import Warning from './Warning.svelte';
  import { slide } from 'svelte/transition';
  import { dateToHtmlInput, fillDateDigits, formatTime } from '$lib/format';
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
    ? dateToHtmlInput($form.value[label])
    : undefined;
  let error = $form.errors?.[label];
  let utc = 'mm/dd/yyyy --:-- --';

  function onInput() {
    hasSelected = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'nullable';
  }

  $: {
    form.setValue(label, !value ? null : new Date(value));
  }

  $: {
    error = $form.errors?.[label];
  }

  $: {
    if ($form.overwritten?.[label]) {
      hasSelected = false;
      value = $form.value[label] ? dateToHtmlInput($form.value[label]) : undefined;
      form.setOverwrittenState(label, false);
    }
  }

  $: {
    if (value) {
      const offset = new Date().getTimezoneOffset();
      const utcDate = new Date(new Date(value).getTime() - offset * 60 * 1000);

      const mm = fillDateDigits(utcDate.getMonth() + 1);
      const dd = fillDateDigits(utcDate.getDate());
      const yyyy = utcDate.getFullYear();

      utc = `${mm}/${dd}/${yyyy} ${formatTime(utcDate)}`;
    } else {
      utc = 'mm/dd/yyyy --:-- --';
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
    type="datetime-local"
    class={`input dark:[color-scheme:dark] ${error && hasSelected ? 'input-error' : ''}`}
    {disabled}
    on:input={onInput}
    bind:value
  />
  <span class="block text-sm text-surface-600-300-token">
    {utc} UTC
  </span>
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
  {#if error && hasSelected}
    <span class="block text-sm text-error-600" transition:slide={{ duration: 150 }}>{error}.</span>
  {/if}
</label>
