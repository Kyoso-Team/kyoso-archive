<script lang="ts">
  import { AlertTriangle } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import type { MaybePromise } from '@sveltejs/kit';

  export let hasUpdated: boolean;
  export let onUpdate: () => MaybePromise<void>;
  export let disableUpdateBtn: boolean;
  export let onReset: () => MaybePromise<void>;
  export let disableAddBtn: boolean | undefined = undefined;
  export let onAdd: (() => MaybePromise<void>) | undefined = undefined;
</script>

<div class="grid grid-cols-[auto_auto] gap-2 mt-4">
  <div class="flex gap-2 max-2md:col-span-2">
    <button
      class="btn variant-filled-error hidden 2md:block"
      disabled={!hasUpdated}
      on:click={onReset}
    >
      Reset
    </button>
    {#if hasUpdated}
      <div
        class="card variant-soft-warning flex justify-center items-center p-btn w-full 2md:w-max"
        transition:fade={{ duration: 150 }}
      >
        <AlertTriangle size={20} class="mr-2" />
        You have unsaved changes
      </div>
    {/if}
  </div>
  <div class="block 2md:hidden">
    <button class="btn variant-filled-error" disabled={!hasUpdated} on:click={onReset}>
      Reset
    </button>
  </div>
  <div class="flex justify-end w-full gap-2">
    {#if disableAddBtn !== undefined && onAdd}
      <button class="btn btn-sm variant-filled" disabled={disableAddBtn} on:click={onAdd}
        >Add</button
      >
    {/if}
    <button class="btn variant-filled-primary" disabled={disableUpdateBtn} on:click={onUpdate}
      >Update</button
    >
  </div>
</div>
