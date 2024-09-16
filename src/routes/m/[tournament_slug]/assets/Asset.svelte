<script lang="ts">
  import { Loader2, Trash, Upload } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { NoFile } from '$lib/components/general';

  export let label: string;
  export let src: string | undefined;
  export let imgAspectRatio: string;
  export let onUpload: () => void;
  export let onDelete: () => void;
  let imgWidth: number | undefined;
  let isImgLoading = true;

  onMount(() => {
    setTimeout(() => {
      if (imgWidth || 0 > 0) {
        isImgLoading = false;
      }
    }, 10);
  });

  function onLoad() {
    isImgLoading = false;
  }

  $: {
    if (!src) {
      isImgLoading = true;
    }
  }
</script>

<div class="card p-4 max-2sm:w-full flex flex-col">
  <div class="grid grid-cols-[auto_auto]">
    <span class="font-medium text-xl flex items-center">{label}</span>
    <div class="flex gap-2 justify-end">
      <button class="btn-icon btn-icon-sm variant-filled-primary" on:click={onUpload}>
        <Upload size={20} />
      </button>
      {#if src}
        <button class="btn-icon btn-icon-sm variant-filled-error" on:click={onDelete}>
          <Trash size={20} />
        </button>
      {/if}
    </div>
  </div>
  <div class="2sm:h-48 mt-4" style={`aspect-ratio: ${imgAspectRatio};`}>
    {#if src}
      <div class="w-full h-full card bg-surface-200-700-token relative">
        {#if isImgLoading}
          <div class="absolute w-full h-full flex justify-center items-center top-0 left-0 z-[1]">
            <Loader2 size={64} class="dark:stroke-white stroke-black animate-spin opacity-50" />
          </div>
        {/if}
        <img
          {src}
          alt="asset"
          class="w-full h-full"
          on:load={onLoad}
          bind:naturalWidth={imgWidth}
        />
      </div>
    {:else}
      <NoFile img />
    {/if}
  </div>
</div>
