<script lang="ts">
  import NotAllowed from './NotAllowed.svelte';
  import Warning from './Warning.svelte';
  import { slide } from 'svelte/transition';
  import type { FormStore } from '$lib/types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let disabled = false;
  export let time = false;
  export let warningMsg: string | undefined = undefined;
  export let notAllowedMsg: string | undefined = undefined;
  let hasWritten = false;
  let optional = false;
  let value: number | null = !$form.value[label] ? null : $form.value[label];
  let error = $form.errors?.[label];
  const timeValue = {
    multiplier: 'undefined',
    value: 0
  };

  function onInput() {
    hasWritten = true;
  }

  $: {
    optional = (form.schemas[label] as any)?.type === 'nullable';
  }

  $: {
    form.setValue(label, value);
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

  $: {
    if ($form.overwritten?.[label]) {
      hasWritten = false;
      value = !$form.value[label] ? null : $form.value[label];
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
  {#if time}
    <div class="input-group input-group-divider grid-cols-[1fr_auto]">
      <input
        type="number"
        step="any"
        class={`input ${error && hasWritten ? 'input-error' : ''}`}
        {disabled}
        on:input={onInput}
        bind:value={timeValue.value}
      />
      <select {disabled} bind:value={timeValue.multiplier}>
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
      step="any"
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
