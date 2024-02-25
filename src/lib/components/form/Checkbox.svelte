<script lang="ts">
  import type { FormStore } from '$types';

  export let form: FormStore;
  export let label: string;
  export let legend: string;
  let value = false;

  $: {
    form.setValue(label, value);
  }
</script>

<label class="label">
  {#if $$slots.default}
    <p class="inline-block my-2 text-sm dark:text-surface-300 text-surface-700">
      <slot />
    </p>
  {/if}
  <div class="flex items-center gap-2">
    <input type="checkbox" class="checkbox" bind:checked={value} />
    <legend>{legend}</legend>
  </div>
  {#if $$slots.preview}
    <span class="block text-xs text-primary-500">
      <slot name="preview" />
    </span>
  {/if}
</label>
