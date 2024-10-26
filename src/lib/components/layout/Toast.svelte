<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { toast } from '$lib/stores';
  import type { ToastItem } from '$lib/types';

  function onItemMouseEnter(itemId: string) {
    toast.pause(itemId);
  }

  function onItemMouseLeave() {
    toast.resume();
  }

  const colors: Record<ToastItem['type'], string> = {
    success: 'bg-success-500/10 border-success-500',
    error: 'bg-error-500/10 border-error-500',
    important: 'bg-warning-500/10 border-warning-500',
    notification: 'bg-primary-500/10 border-primary-500'
  };
</script>

<div class="fixed bottom-4 left-4 z-[101] flex flex-col gap-2">
  {#each $toast.showing as itemId (itemId)}
    {@const { message, type } = $toast.items.get(itemId) ?? { message: '', type: 'success' }}
    <div
      role="presentation"
      class="text-white bg-surface-900 rounded-md overflow-hidden max-w-xl"
      in:fly={{ duration: 150, x: -50 }}
      out:fly={{ duration: 150, x: -50, y: 0 }}
      animate:flip={{ duration: 150 }}
      on:mouseenter={() => onItemMouseEnter(itemId)}
      on:mouseleave={onItemMouseLeave}
    >
      <div class={`${colors[type]} border-l-4 p-4 w-full h-full`}>
        {message}
      </div>
    </div>
  {/each}
</div>
