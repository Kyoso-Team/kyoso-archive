<script lang="ts">
  import { FileButton } from '@skeletonlabs/skeleton';
  import { fly } from 'svelte/transition';
  import { NoFile } from '$lib/components/general';
  import type { MaybePromise } from '@sveltejs/kit';

  export let onUpload: (file: File) => MaybePromise<void>;
  export let onCancel: () => MaybePromise<void>;
  export let currentSrc: string | undefined;
  export let imgAspectRatio: string;
  let showNewImg = true;
  let files: FileList;
  let fileInput: HTMLInputElement | undefined;

  async function onUploadBtnclick() {
    if (!file) return;
    await onUpload(file);
  }

  function onSelectFileBtnclick() {
    fileInput?.click();
  }

  function toggleImg() {
    showNewImg = !showNewImg;
  }

  $: file = files ? files.item(0) : undefined;
  $: newSrc = file ? URL.createObjectURL(file) : undefined;
</script>

<div class="modal w-[480px]" transition:fly={{ duration: 150, y: 100 }}>
  <slot />
  <div class="p-2 border-dashed border border-surface-500 rounded-md flex items-center gap-2">
    <button class="btn btn-sm variant-filled-primary" on:click={onSelectFileBtnclick}>
      Select File
    </button>
    <span class="inline-block truncate max-w-64 [&>*]:pointer-events-none">
      {file?.name || 'No file selected'}
    </span>
  </div>
  <FileButton name="upload-files" accept="image/*" class="hidden" bind:files bind:fileInput />
  <div class="w-full flex justify-center gap-2 mt-4">
    <div class={imgAspectRatio === '1/1' ? 'w-56' : 'w-[90%]'}>
      {#if currentSrc || (showNewImg && newSrc)}
        <div
          class="card w-full bg-surface-200-700-token overflow-hidden"
          style={`aspect-ratio: ${imgAspectRatio};`}
        >
          {#if showNewImg && newSrc}
            <img src={newSrc} alt="new logo" class="w-full h-full" />
          {:else}
            <img src={currentSrc} alt="logo" class="w-full h-full" />
          {/if}
        </div>
      {:else}
        <div
          class="card w-full bg-surface-200-700-token"
          style={`aspect-ratio: ${imgAspectRatio};`}
        >
          <NoFile img />
        </div>
      {/if}
      {#if newSrc && currentSrc}
        <button class="w-full btn btn-sm variant-filled mt-2" on:click={toggleImg}>
          View {showNewImg ? 'Original' : 'Uploaded'}
        </button>
      {/if}
    </div>
  </div>
  <div class="actions">
    <button class="btn variant-filled-primary" disabled={!file} on:click={onUploadBtnclick}
      >Upload</button
    >
    <button class="btn variant-filled" on:click={onCancel}>Cancel</button>
  </div>
</div>
