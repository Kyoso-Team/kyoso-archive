<script lang="ts">
  import { AlertTriangle } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  export let show: boolean;
</script>

{#if show}
  <div
    class="card ![box-shadow:none] w-full gap-4 py-2 px-4 !bg-warning-800/25 border border-warning-800/25 dark:border-warning-500/25 flex items-center mt-2"
    transition:fade={{ duration: 150 }}
  >
    <AlertTriangle size={20} />
    <div>
      <slot />
    </div>
  </div>
{/if}
