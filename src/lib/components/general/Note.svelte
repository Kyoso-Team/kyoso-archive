<script lang="ts">
  import { AlertTriangle, CircleX } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  export let show: boolean;
  export let type: 'warning' | 'error';

  $: styles = type === 'warning'
    ? '!bg-warning-800/25 border-warning-800/25 dark:border-warning-500/25'
    : '!bg-error-800/25 border-error-800/25 dark:border-error-500/25';
</script>

{#if show}
  <div
    class={`card ![box-shadow:none] w-full gap-4 py-2 px-4 border flex items-center mt-2 ${styles}`}
    transition:fade={{ duration: 150 }}
  >
    {#if type === 'warning'}
      <AlertTriangle size={20} />
    {:else}
      <CircleX size={20} />
    {/if}
    <div>
      <slot />
    </div>
  </div>
{/if}
