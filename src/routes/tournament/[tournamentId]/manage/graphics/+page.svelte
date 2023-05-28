<!-- UNFINISHED PAGE -->
<script lang="ts">
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { error, sidebar } from '$stores';
  import { onMount } from 'svelte';
  import { FileButton } from '@skeletonlabs/skeleton';
  import { Upload } from '$classes';
  import type { PageServerData } from './$types';

  let bannerFile: FileList | undefined;
  let currentBanner: string | undefined =
    'http://127.0.0.1:5173/uploads/tournament-banners/00001.png';
  let newBanner: string | undefined;

  onMount(() => {
    sidebar.setSelected('Settings', 'Settings', 'Graphics');
  });

  async function onUpload() {
    await new Upload(bannerFile?.item(0) as File).tournamentBanner({
      tournamentId: 1
    });
  }

  $: {
    if (bannerFile && bannerFile.length > 0) {
      console.log(bannerFile.item(0)?.name);
      newBanner = URL.createObjectURL(bannerFile.item(0) as File);
    }
  }
</script>

<div class="center-content">
  <h1>Graphics</h1>
  <div class="my-4">
    <h2 class="pb-2 text-center">Banner</h2>
    <span>Current banner:</span>
    <div class="card relative aspect-[21/9] w-80 overflow-hidden border border-primary-600">
      {#if newBanner || currentBanner}
        <img
          src={newBanner || currentBanner}
          alt="banner"
          class="absolute -inset-full m-auto h-auto w-full"
        />
      {/if}
    </div>
    <div>
      <button class="btn variant-filled-primary" on:click={onUpload}>Upload</button>
      <button class="btn variant-ringed-primary">Undo Change</button>
      <FileButton name="banner-file" accept=".png, .jpg, .jpeg, .gif" bind:files={bannerFile}
        >Choose File</FileButton
      >
    </div>
  </div>
</div>
