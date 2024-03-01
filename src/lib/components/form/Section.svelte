<script lang="ts">
  import { slide } from 'svelte/transition';
</script>

<div class="flex flex-col gap-4" transition:slide={{ duration: 150 }}>
  <slot />
</div>
