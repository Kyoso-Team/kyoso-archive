<script lang="ts">
  import { SlideToggle } from '@skeletonlabs/skeleton';

  export let value: string | number | boolean;
  export let label: string;
  export let type: 'string' | 'text' | 'number' | 'boolean';
  export let error: string | undefined = undefined;
  export let final: boolean = false;
  export let disabled: boolean = false;
</script>

<div class={`grid grid-cols-[50%_50%] p-4 ${final ? '' : 'border-b-2 border-surface-900'}`}>
  <span class={`flex items-center duration-200 ${disabled ? 'opacity-70' : ''}`}>{label}</span>
  {#if type === 'string'}
    <input
      type="text"
      class="block input py-1 px-2"
      bind:value={value}
      {disabled}
    >
  {:else if type === 'number'}
    <input
      type="number"
      class="block input py-1 px-2"
      bind:value={value}
      {disabled}
    >
  {:else if type === 'boolean' && typeof value === 'boolean'}
    <input type="checkbox" class="hidden" />
    <SlideToggle
      name={label}
      active="bg-primary-500"
      {disabled}
      bind:checked={value}
    />
  {/if}
  {#if error}
    <span class="block col-span-2 text-error-600 text-sm mt-2">{error}</span>
  {/if}
</div>