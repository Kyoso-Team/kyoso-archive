<script lang="ts">
  import { Pencil, X } from 'lucide-svelte';
  import type { ModMultiplier } from '$types';

  export let modMultiplier: ModMultiplier;
  export let onUpdate: () => void;
  export let onDelete: () => void;
</script>

<div class="w-full grid grid-cols-[auto_auto] items-center gap-4 card bg-surface-200-700-token p-4">
  <div class="font-lg grid grid-cols-[max-content_auto] items-center grid-rows-2">
    <div class="row-span-2 mr-4 font-medium">
      {modMultiplier.mods.join('').toUpperCase()}
    </div>
    {#if typeof modMultiplier.multiplier === 'number'}
      <div class="row-span-2">
        &times; {modMultiplier.multiplier.toString()}
      </div>
    {:else}
      <div>
        <span class="text-surface-600-300-token italic">Pass</span>
        &times; {modMultiplier.multiplier.ifSuccessful.toString()}
      </div>
      <div>
        <span class="text-surface-600-300-token italic">Fail</span>
        &times; {modMultiplier.multiplier.ifFailed.toString()}
      </div>
    {/if}
  </div>
  <div class="flex items-center justify-end gap-2">
    <button class="btn btn-icon variant-filled" on:click={onUpdate}>
      <Pencil size={20} />
    </button>
    <button class="btn btn-icon variant-filled-error" on:click={onDelete}>
      <X size={20} />
    </button>
  </div>
</div>
