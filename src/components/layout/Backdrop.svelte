<script lang="ts">
  import { portal } from 'svelte-portal';
  import { fade } from 'svelte/transition';
</script>

<div class="backdrop z-20 flex justify-center items-center" use:portal transition:fade={{ duration: 150 }}>
  <slot />
</div>
