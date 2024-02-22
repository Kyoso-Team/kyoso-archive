<!-- <script lang="ts">
  import { SlideToggle, popup } from '@skeletonlabs/skeleton';
  import { tooltip, dateToHtmlInput } from '$lib/utils';
  import { Tooltip } from '$components';
  import { Link } from 'lucide-svelte';

  export let value: string | number | boolean | undefined | null | Date;
  export let type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'date';
  export let label: string;
  export let values: (
    | string
    | {
        label: string;
        value: string;
      }
  )[] = [];
  export let error: string | undefined = undefined;
  export let final: boolean = false;
  export let disabled: boolean = false;
  export let isLink: boolean = false;
  export let sub: string | undefined = undefined;
  export let link: string | undefined = undefined;

  const dateString = type === 'date' && value instanceof Date ? dateToHtmlInput(value) : '';
  const linkTooltipTarget = `link-${label.toLowerCase().replaceAll(' ', '-')}`;

  $: {
    if (type === 'date') {
      value = dateString === '' ? null : new Date(dateString);
    } else if (typeof value === 'string') {
      value = value === '' ? null : value;
    }
  }
</script>

<div class={`grid grid-cols-[50%_50%] p-4 ${final ? '' : 'border-b-2 border-surface-900'}`}>
  <span class={`flex items-center pr-4 duration-200 ${disabled ? 'opacity-70' : ''}`}>{label}</span>
  <div class="flex flex-wrap">
    <div class="flex w-full">
      {#if type === 'string'}
        <input type="text" class="input px-2 py-1" bind:value {disabled} />
      {:else if type === 'number'}
        <input type="number" class="input px-2 py-1" bind:value {disabled} />
      {:else if type === 'boolean' && typeof value === 'boolean'}
        <input type="checkbox" class="hidden" />
        <SlideToggle name={label} active="bg-primary-500" {disabled} bind:checked={value} />
      {:else if type === 'select'}
        <select class="select" bind:value>
          {#each values as selectable}
            {#if typeof selectable === 'string'}
              <option value={selectable}>{selectable}</option>
            {:else}
              <option value={selectable.value}>{selectable.label}</option>
            {/if}
          {/each}
        </select>
      {:else if type === 'date'}
        <input type="datetime-local" class="input px-2 py-1" bind:value={dateString} {disabled} />
      {:else}
        <textarea class="input h-28 resize-none px-2 py-1" bind:value {disabled} />
      {/if}
      {#if isLink}
        <a
          href={link || 'javascript:void(0)'}
          class={`btn variant-ghost-surface ml-2 p-2 ${
            link
              ? ''
              : 'cursor-not-allowed opacity-50 hover:filter-none active:transform-none active:fill-none'
          }`}
          use:popup={tooltip(linkTooltipTarget)}
          target={link ? '_blank' : undefined}
        >
          <Link size={18} class="text-primary-500" />
        </a>
        <Tooltip label="Open in new tab" target={linkTooltipTarget} />
      {/if}
    </div>
    {#if sub}
      <span class="mt-1 block text-xs">{sub}</span>
    {/if}
  </div>
  {#if error}
    <span class="col-span-2 mt-2 block text-sm text-error-600">{error}</span>
  {/if}
</div> -->
