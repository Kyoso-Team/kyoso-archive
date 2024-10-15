<script lang="ts">
  import NotAllowed from './NotAllowed.svelte';
  import Warning from './Warning.svelte';
  import type { FormStore } from '$lib/types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let disabled = false;
  export let warningMsg: string | undefined = undefined;
  export let notAllowedMsg: string | undefined = undefined;
  let value = $form.value[label] !== undefined ? $form.value[label] : false;

  $: {
    form.setValue(label, value);
  }

  $: {
    if ($form.overwritten?.[label]) {
      value = $form.value[label] !== undefined ? $form.value[label] : false;
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
  <div class="grid grid-cols-[min-content_1fr] items-center gap-x-2 !mt-0">
    <input
      type="checkbox"
      class="checkbox disabled:opacity-50 disabled:cursor-not-allowed duration-150"
      {disabled}
      bind:checked={value}
    />
    <legend>{legend}</legend>
    <div />
    {#if $$slots.default}
      <p class="inline-block text-sidenote">
        <slot />
      </p>
    {/if}
  </div>
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
</label>
