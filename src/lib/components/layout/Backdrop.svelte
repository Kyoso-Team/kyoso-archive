<script lang="ts">
  import { portal } from 'svelte-portal';
  import { fade } from 'svelte/transition';

  export let zIndex = 'z-20';
</script>

<div
  class={`bg-surface-backdrop-token fixed inset-0 p-4 sm:p-8 h-screen w-screen overflow-y-auto flex justify-center items-center ${zIndex}`}
  use:portal
  transition:fade={{ duration: 150 }}
>
  <slot />
</div>
