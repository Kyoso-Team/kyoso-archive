<script lang="ts">
  import Asset from './Asset.svelte';
  import { SEO } from '$components/general';
  import { page } from '$app/stores';
  import { portal } from 'svelte-portal';
  import { Backdrop, Modal, UploadImgModal } from '$components/layout';
  import { createUploadClient } from '$lib/upload';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { invalidate } from '$app/navigation';
  import { toastSuccess } from '$lib/utils';
  import { loading } from '$stores';
  import type { Assets } from '$types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let showUploadLogoModal = false;
  let showUploadBannerModal = false;
  let showDeleteLogoPrompt = false;
  let showDeleteBannerPrompt = false;
  let logoSrc: string | undefined;
  let bannerSrc: string | undefined;
  const toast = getToastStore();
  const logoUpload = createUploadClient<Assets['tournamentLogo']>(
    toast,
    '/api/assets/tournament_logo'
  );
  const bannerUpload = createUploadClient<Assets['tournamentBanner']>(
    toast,
    '/api/assets/tournament_banner'
  );

  function toggleShowUploadLogoModal() {
    showUploadLogoModal = !showUploadLogoModal;
  }

  function toggleShowUploadBannerModal() {
    showUploadBannerModal = !showUploadBannerModal;
  }

  function toggleShowDeleteLogoPrompt() {
    showDeleteLogoPrompt = !showDeleteLogoPrompt;
  }

  function toggleShowDeleteBannerPrompt() {
    showDeleteBannerPrompt = !showDeleteBannerPrompt;
  }

  async function uploadLogo(file: File) {
    loading.set(true);
    await logoUpload.put({
      file,
      tournamentId: data.tournament.id
    });

    await invalidate('reload:manage_assets');
    loading.set(false);

    toggleShowUploadLogoModal();
    toastSuccess(toast, 'Uploaded logo successfully');
  }

  async function uploadBanner(file: File) {
    loading.set(true);
    await bannerUpload.put({
      file,
      tournamentId: data.tournament.id
    });

    await invalidate('reload:manage_assets');
    loading.set(false);

    toggleShowUploadBannerModal();
    toastSuccess(toast, 'Uploaded banner successfully');
  }

  async function deleteLogo() {
    loading.set(true);
    await logoUpload.delete({
      tournamentId: data.tournament.id
    });

    await invalidate('reload:manage_assets');
    loading.set(false);

    toggleShowDeleteLogoPrompt();
    toastSuccess(toast, 'Deleted logo successfully');
  }

  async function deleteBanner() {
    loading.set(true);
    await bannerUpload.delete({
      tournamentId: data.tournament.id
    });

    await invalidate('reload:manage_assets');
    loading.set(false);

    toggleShowDeleteBannerPrompt();
    toastSuccess(toast, 'Deleted banner successfully');
  }

  $: logoSrc = data.tournament.logoMetadata
    ? `${$page.url.origin}/api/assets/tournament_logo?tournament_id=${data.tournament.id}&file_id=${data.tournament.logoMetadata.fileId}&size=full`
    : undefined;
  $: bannerSrc = data.tournament.bannerMetadata
    ? `${$page.url.origin}/api/assets/tournament_banner?tournament_id=${data.tournament.id}&file_id=${data.tournament.bannerMetadata.fileId}&size=full`
    : undefined;
</script>

<SEO
  page={$page}
  title={`${data.tournament.acronym} - Assets`}
  description={`Manage assets for ${data.tournament.acronym}`}
  noIndex
/>
{#if showDeleteLogoPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Delete Logo</span>
      <p>Are you sure you want to delete this tournament's logo?</p>
      <div class="actions">
        <button class="btn variant-filled-error" on:click={deleteLogo}>Delete</button>
        <button class="btn variant-filled" on:click={toggleShowDeleteLogoPrompt}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showDeleteBannerPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Delete Banner</span>
      <p>Are you sure you want to delete this tournament's banner?</p>
      <div class="actions">
        <button class="btn variant-filled-error" on:click={deleteBanner}>Delete</button>
        <button class="btn variant-filled" on:click={toggleShowDeleteBannerPrompt}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showUploadLogoModal}
  <Backdrop>
    <UploadImgModal
      imgAspectRatio="1/1"
      currentSrc={logoSrc}
      onUpload={uploadLogo}
      onCancel={toggleShowUploadLogoModal}
    >
      <span class="title">Upload Logo</span>
      <p><strong>Aspect ratio:</strong> 1:1</p>
      <p><strong>Dimensions:</strong> 250x250 (or greater)</p>
      <p class="mb-4">An image with a transparent background is preferred.</p>
    </UploadImgModal>
  </Backdrop>
{/if}
{#if showUploadBannerModal}
  <Backdrop>
    <UploadImgModal
      imgAspectRatio="21/9"
      currentSrc={bannerSrc}
      onUpload={uploadBanner}
      onCancel={toggleShowUploadBannerModal}
    >
      <span class="title">Upload Banner</span>
      <p><strong>Aspect ratio:</strong> 21:9</p>
      <p class="mb-4"><strong>Dimensions:</strong> 1600x685 (or greater)</p>
    </UploadImgModal>
  </Backdrop>
{/if}
<h1 class="m-title" use:portal={'#page-title'}>Assets</h1>
<ol class="breadcrumb" use:portal={'#breadcrumbs'}>
  <li class="crumb">
    <a class="anchor" href={`/m/${data.tournament.urlSlug}`}>{data.tournament.acronym}</a>
  </li>
  <li class="crumb-separator" aria-hidden>&rsaquo;</li>
  <li class="crumb">Assets</li>
</ol>
<main class="main flex justify-center items-center h-full">
  <div class="flex gap-4 max-2sm:flex-col flex-wrap justify-center h-max max-w-5xl">
    <Asset
      label="Logo"
      imgAspectRatio="1/1"
      src={logoSrc}
      onUpload={toggleShowUploadLogoModal}
      onDelete={toggleShowDeleteLogoPrompt}
    />
    <Asset
      label="Banner"
      imgAspectRatio="21/9"
      src={bannerSrc}
      onUpload={toggleShowUploadBannerModal}
      onDelete={toggleShowDeleteBannerPrompt}
    />
  </div>
</main>
