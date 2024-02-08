<!-- <script lang="ts">
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { tournamentSidebar, upload, error } from '$stores';
  import { onMount } from 'svelte';
  import { getFileUrl, format, modal } from '$lib/utils';
  import { invalidateAll } from '$app/navigation';
  import { SEO } from '$components';
  import type { Upload } from '$classes';
  import type { PageServerData } from './$types';

  export let data: PageServerData;

  let bannerUrl = data.hasBanner
    ? getFileUrl($page, `tournament-banners/${format.digits(data.id, 8)}-full.jpeg`)
    : undefined;
  let logoUrl = data.hasLogo
    ? getFileUrl($page, `tournament-logos/${format.digits(data.id, 8)}-full.jpeg`)
    : undefined;

  onMount(() => {
    tournamentSidebar.setSelected('Settings', 'Settings', 'Graphics');
  });

  function onChangeBanner() {
    upload.create({
      accept: ['gif', 'jpeg', 'jpg', 'png', 'webp'],
      onUpload: uploadBanner,
      isImg: true,
      limitBy: 'width'
    });
  }

  function onChangeLogo() {
    upload.create({
      accept: ['gif', 'jpeg', 'jpg', 'png', 'webp'],
      onUpload: uploadLogo,
      isImg: true,
      imgAspectRatio: '1/1'
    });
  }

  async function uploadBanner(upload: Upload) {
    let resp = await upload.tournamentBanner({
      tournamentId: data.id
    });

    if (resp.includes('success')) {
      await invalidateAll();
    }

    return resp;
  }

  async function uploadLogo(upload: Upload) {
    let resp = await upload.tournamentLogo({
      tournamentId: data.id
    });

    if (resp.includes('success')) {
      await invalidateAll();
    }

    return resp;
  }

  async function onDeleteBanner() {
    modal.yesNo(
      'Confirm Banner Deletion',
      'Are you sure you want to delete the banner for this tournament?',
      async () => {
        try {
          await trpc($page).uploads.delete.tournamentBanner.mutate({
            tournamentId: data.id
          });

          await invalidateAll();
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    );
  }

  async function onDeleteLogo() {
    modal.yesNo(
      'Confirm Logo Deletion',
      'Are you sure you want to delete the logo for this tournament?',
      async () => {
        try {
          await trpc($page).uploads.delete.tournamentLogo.mutate({
            tournamentId: data.id
          });

          await invalidateAll();
        } catch (err) {
          console.error(err);
          error.set($error, err, 'close');
        }
      }
    );
  }

  $: {
    bannerUrl = data.hasBanner
      ? getFileUrl($page, `tournament-banners/${format.digits(data.id, 8)}-full.jpeg`)
      : undefined;
    logoUrl = data.hasLogo
      ? getFileUrl($page, `tournament-logos/${format.digits(data.id, 8)}-full.jpeg`)
      : undefined;
  }
</script>

<SEO
  page={$page}
  title={`Graphics - ${data.acronym}`}
  description={`Manage the graphics for ${data.acronym} (${data.name})`}
  noIndex
/>
<div class="center-content">
  <h1>Graphics</h1>
  <div class="mt-4">
    <h2 class="pb-2 text-center">Banner</h2>
    <span>Current banner:</span>
    <div class="card relative aspect-[21/9] w-80 overflow-hidden border border-primary-600">
      <img src={bannerUrl} alt="banner" class="absolute -inset-full m-auto h-auto w-full" />
    </div>
    <div class="my-2 flex justify-end gap-2">
      <button class="btn variant-filled-primary" on:click={onChangeBanner}>Change</button>
      <button class="btn variant-filled-error" disabled={!data.hasBanner} on:click={onDeleteBanner}
        >Delete</button
      >
    </div>
    <h2 class="py-2 text-center">Logo</h2>
    <span>Current logo:</span>
    <div class="card flex justify-center">
      <div
        class="card relative flex aspect-[1/1] w-[132px] items-center overflow-hidden border border-primary-600"
      >
        <img src={logoUrl} alt="banner" class="absolute -inset-full m-auto h-auto w-full" />
      </div>
    </div>
    <div class="mt-2 flex justify-end gap-2">
      <button class="btn variant-filled-primary" on:click={onChangeLogo}>Change</button>
      <button class="btn variant-filled-error" disabled={!data.hasLogo} on:click={onDeleteLogo}
        >Delete</button
      >
    </div>
  </div>
</div> -->
