<script lang="ts">
  import type { FormStore } from '$types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  export let disabled = false;
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

<label class="label">
  {#if $$slots.default}
    <p class="inline-block my-2 text-sm text-surface-600-300-token">
      <slot />
    </p>
  {/if}
  <div class="flex items-center gap-2">
    <input type="checkbox" class="checkbox disabled:opacity-50 disabled:cursor-not-allowed duration-150" {disabled} bind:checked={value} />
    <legend>{legend}</legend>
  </div>
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
</label>
