<script lang="ts">
  import { SlideToggle, popup } from '@skeletonlabs/skeleton';
  import { tooltip, dateToHtmlInput } from '$lib/utils';
  import { Tooltip } from '$components';

  export let value: string | number | boolean | undefined | null | Date;
  export let type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'date';
  export let label: string;
  export let values: string[] = [];
  export let error: string | undefined = undefined;
  export let final: boolean = false;
  export let disabled: boolean = false;
  export let isLink: boolean = false;
  export let sub: string | undefined = undefined;
  export let link: string | undefined = undefined;

  let dateString = type === 'date' && value instanceof Date ? dateToHtmlInput(value) : '';
  let linkTooltipTarget = `link-${label.toLowerCase().replaceAll(' ', '-')}`;

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
        <input type="text" class="input py-1 px-2" bind:value {disabled} />
      {:else if type === 'number'}
        <input type="number" class="input py-1 px-2" bind:value {disabled} />
      {:else if type === 'boolean' && typeof value === 'boolean'}
        <input type="checkbox" class="hidden" />
        <SlideToggle name={label} active="bg-primary-500" {disabled} bind:checked={value} />
      {:else if type === 'select'}
        <select class="select" bind:value>
          {#each values as selectable}
            <option value={selectable}>{selectable}</option>
          {/each}
        </select>
      {:else if type === 'date'}
        <input type="datetime-local" class="input py-1 px-2" bind:value={dateString} {disabled} />
      {:else}
        <textarea class="input h-28 resize-none py-1 px-2" bind:value {disabled} />
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            width="18"
            height="18"
            class="fill-primary-500"
          >
            <path
              d="m87.5 151.52l64-64a12 12 0 0 1 17 17l-64 64a12 12 0 0 1-17-17Zm131-114a60.08 60.08 0 0 0-84.87 0l-30.12 30.09a12 12 0 0 0 17 17l30.07-30.06a36 36 0 0 1 50.93 50.92l-30.11 30.05a12 12 0 1 0 17 17l30.08-30.06a60.09 60.09 0 0 0-.03-84.91ZM135.52 171.4l-30.07 30.08a36 36 0 0 1-50.92-50.93l30.06-30.07a12 12 0 0 0-17-17l-30.04 30.1a60 60 0 0 0 84.88 84.87l30.06-30.07a12 12 0 0 0-17-17Z"
            />
          </svg>
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
</div>
