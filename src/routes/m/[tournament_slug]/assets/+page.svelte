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
  let showLogoModal = false;
  let showBannerModal = false;
  let showDeleteLogoPrompt = false;
  let showDeleteBannerPrompt = false;
  let logoSrc: string | undefined;
  let bannerSrc: string | undefined;
  const toast = getToastStore();
  const logoUpload = createUploadClient<Assets['tournamentLogo']>(toast, '/api/assets/tournament_logo');
  const bannerUpload = createUploadClient<Assets['tournamentBanner']>(toast, '/api/assets/tournament_banner');
  
  function toggleShowLogoModal() {
    showLogoModal = !showLogoModal;
  }

  function toggleShowBannerModal() {
    showBannerModal = !showBannerModal;
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

    toggleShowLogoModal();
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

    toggleShowBannerModal();
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
    toastSuccess(toast, 'Deleted logo successfully');
  }

  $: logoSrc = data.tournament.logoMetadata
    ? `${$page.url.origin}/api/assets/tournament_logo?tournament_id=${data.tournament.id}&file_id=${data.tournament.logoMetadata.fileId}&size=full`
    : undefined;
</script>

<SEO page={$page} title={`${data.tournament.acronym} - Assets`} description="User settings" noIndex />
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
{#if showLogoModal}
  <Backdrop>
    <UploadImgModal imgAspectRatio="1/1" currentSrc={logoSrc} onUpload={uploadLogo} onCancel={toggleShowLogoModal}>
      <span class="title">Upload Logo</span>
      <p><strong>Aspect ratio:</strong> 1:1</p>
      <p><strong>Dimensions:</strong> 250x250 (or greater)</p>
      <p class="mb-4">An image with a transparent background is preferred.</p>
    </UploadImgModal>
  </Backdrop>
{/if}
<span use:portal={'#page-title'}>Assets</span>
<ol class="breadcrumb py-2 px-4" use:portal={'#breadcrumbs'}>
  <li class="crumb"><a class="anchor" href={`/m/${data.tournament.urlSlug}`}>{data.tournament.acronym}</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
  <li class="crumb">Assets</li>
</ol>
<main class="main flex justify-center items-center h-full">
  <div class="flex gap-4 flex-wrap justify-center h-max">
    <Asset label="Logo" imgAspectRatio="1/1" src={logoSrc} onUpload={toggleShowLogoModal} onDelete={toggleShowDeleteLogoPrompt} />
    <!-- <Asset label="Banner" show={!!data.tournament.bannerMetadata} class="aspect-[21/9]" /> -->
  </div>
</main>