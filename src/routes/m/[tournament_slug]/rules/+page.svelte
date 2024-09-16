<script lang="ts">
  import { SEO } from '$lib/components/general';
  import { page } from '$app/stores';
  import { portal } from 'svelte-portal';
  // import { Backdrop, Modal, UploadImgModal } from '$components/layout';
  // import { createUploadClient } from '$lib/upload';
  // import { getToastStore } from '@skeletonlabs/skeleton';
  // import { invalidate } from '$app/navigation';
  // import { toastSuccess } from '$lib/utils';
  // import { loading } from '$stores';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
</script>

<SEO
  page={$page}
  title={`${data.tournament.acronym} - Rules`}
  description={`Manage rules for ${data.tournament.acronym}`}
  noIndex
/>
<h1 class="m-title" use:portal={'#page-title'}>Rules</h1>
<ol class="breadcrumb" use:portal={'#breadcrumbs'}>
  <li class="crumb">
    <a class="anchor" href={`/m/${data.tournament.urlSlug}`}>{data.tournament.acronym}</a>
  </li>
  <li class="crumb-separator" aria-hidden>&rsaquo;</li>
  <li class="crumb">
    <a class="anchor" href={`/m/${data.tournament.urlSlug}/settings`}>Settings</a>
  </li>
  <li class="crumb-separator" aria-hidden>&rsaquo;</li>
  <li class="crumb">Rules</li>
</ol>
<main class="main flex justify-center items-center h-full"></main>
