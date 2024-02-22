<script lang="ts">
  import { fly } from 'svelte/transition';
</script>

<div class="modal" transition:fly={{ duration: 150, y: 100 }}>
  <slot />
</div>
