<script lang="ts">
  import Warning from './Warning.svelte';
  import NotAllowed from './NotAllowed.svelte';
  import { slide } from 'svelte/transition';
  import type { FormStore } from '$types/general';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let options: Record<string, string>;
  export let disabledOptions: Partial<Record<string, boolean>> = {};
  export let disabled = false;
  export let onChange: (() => void) | undefined = undefined;
  export let warningMsg: string | undefined = undefined;
  export let notAllowedMsg: string | undefined = undefined;
  let hasSelected = false;
  let optional = false;
  let value: string[] = !$form.value[label] ? [] : $form.value[label];
  let selectedOptions: Record<string, boolean> = Object.keys(options).reduce(
    (obj, key) => ({ ...obj, [key]: value.includes(key) }),
    {}
  );
  let error = $form.errors?.[label];

  function change() {
    hasSelected = true;

    if (onChange) {
      onChange();
    }
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
    value = Object.entries(selectedOptions).reduce((arr: string[], [value, selected]) => {
      if (selected) {
        arr.push(value);
      }
      return arr;
    }, []);
  }

  $: {
    if ($form.overwritten?.[label]) {
      hasSelected = false;
      value = $form.defaults[label];
      selectedOptions = Object.keys(options).reduce(
        (obj, key) => ({ ...obj, [key]: value.includes(key) }),
        {}
      );
      form.setOverwrittenState(label, false);
    }
  }
</script>

<div class="label relative">
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
  <div class="flex flex-col gap-2">
    {#each Object.entries(options) as [value, option]}
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          class="checkbox disabled:opacity-50 disabled:cursor-not-allowed duration-150"
          disabled={disabledOptions[value] || disabled}
          bind:checked={selectedOptions[value]}
          on:change={change}
        />
        <legend class={`duration-150 ${disabledOptions[value] || disabled ? 'opacity-50' : ''}`}
          >{option}</legend
        >
      </label>
    {/each}
  </div>
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
  {#if error && hasSelected}
    <span class="block text-sm text-error-600" transition:slide={{ duration: 150 }}>{error}.</span>
  {/if}
</div>
