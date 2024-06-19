<script lang="ts">
  import { Loader2 } from 'lucide-svelte';
  import { NoFile } from '$components/general';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';

  export let label: string;
  export let src: string | undefined;
  export let imgAspectRatio: string;
  export let onUpload: () => void;
  export let onDelete: () => void;
  export let invertColorOnDark = false;
  export let disabled = false;
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

<div class="w-full 2md:w-max flex flex-col items-center 2md:items-start justify-center card bg-surface-200-700-token p-4">
  <span class="font-medium text-lg">{label}</span>
  <div>
    <div class="max-h-28 h-2max-h-28 xs:max-h-36 xs:h-36 2sm:max-h-40 2sm:h-40 sm:max-h-44 sm:h-44 md:max-h-56 md:h-56 2md:max-h-64 2md:h-64 card dark:bg-surface-800/50 bg-surface-300/50 mt-2 flex items-center justify-center overflow-hidden rounded-md" style={`aspect-ratio: ${imgAspectRatio};`}>
      {#if src}
        <div class="w-full h-full relative">
          {#if isImgLoading}
            <div class="absolute w-full h-full flex justify-center items-center top-0 left-0 z-[1]" transition:fade={{ duration: 150 }}>
              <Loader2 size={64} class="animate-spin" />
            </div>
          {/if}
          <img
            {src}
            alt="asset"
            class={`w-full h-full ${!isImgLoading ? 'animate-fade-in' : ''} ${invertColorOnDark ? 'invert dark:invert-0' : ''}`.trim()}
            on:load={onLoad}
            bind:naturalWidth={imgWidth}
          />
        </div>
      {:else}
        <NoFile img />
      {/if}
    </div>
  </div>
  <div class="flex gap-2 mt-4">
    <button class="btn variant-filled" {disabled} on:click={onUpload}>
      Upload
    </button>
    <button class="btn variant-filled-error" disabled={!src || disabled} on:click={onDelete}>
      Delete
    </button>
  </div>
</div>
