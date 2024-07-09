<script lang="ts">
  import { fly } from 'svelte/transition';
</script>

<div class="modal max-w-[660px]" transition:fly={{ duration: 150, y: 100 }}>
  <slot />
</div>
