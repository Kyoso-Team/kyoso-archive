<script lang="ts">
  import { ImageOff, FileMinus2 } from 'lucide-svelte';

  export let img = false;
</script>

<div class="flex flex-col items-center gap-2 p-4">
  {#if img}
    <ImageOff size={48} />
  {:else}
    <FileMinus2 size={48} />
  {/if}
  <span class="inline-block text-center">No image has been uploaded</span>
</div>
