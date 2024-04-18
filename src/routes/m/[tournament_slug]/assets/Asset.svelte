<script lang="ts">
  import { Upload, Trash, Loader2 } from 'lucide-svelte';
  import { NoFile } from '$components/general';

  export let label: string;
  export let src: string | undefined;
  export let imgAspectRatio: string;
  export let onUpload: () => void;
  export let onDelete: () => void;
  let isImgLoading = true;

  function onLoad() {
    isImgLoading = false;
  }

  $: {
    if (!src) {
      isImgLoading = true;
    }
  }
</script>

<div class="card p-4">
  <div class="grid grid-cols-[auto_auto]">
    <span class="font-medium text-xl flex items-center">{label}</span>
    <div class="flex gap-2 justify-end">
      <button class="btn-icon btn-icon-sm variant-filled-primary" on:click={onUpload}>
        <Upload size={16} />
      </button>
      {#if src}
        <button class="btn-icon btn-icon-sm variant-filled-error" on:click={onDelete}>
          <Trash size={16} />
        </button>
      {/if}
    </div>
  </div>
  <div class="h-48 mt-4" style={`aspect-ratio: ${imgAspectRatio};`}>
    {#if src}
      <div class="w-full h-full card bg-surface-200-700-token relative">
        <div class="absolute w-full h-full flex justify-center items-center top-0 left-0 z-[1]">
          {#if isImgLoading}
            <Loader2 size={64} class="dark:stroke-white stroke-black animate-spin" />
          {/if}
        </div>
        <img {src} alt="asset" class="w-full h-full" on:load={onLoad} />
      </div>
    {:else}
      <NoFile img />
    {/if}
  </div>
</div>