<script lang="ts">
  import { ImageOff, FileMinus2 } from 'lucide-svelte';

  export let img = false;
</script>

<div class="w-full h-full card flex justify-center items-center gap-2 flex-col bg-surface-200-700-token p-4 opacity-50">
  {#if img}
    <ImageOff size={48} />
  {:else}
    <FileMinus2 size={48} />
  {/if}
  <span class="inline-block text-center">No image has been uploaded</span>
</div>
