<script lang="ts">
  import { portal } from 'svelte-portal';
  import { page } from '$app/stores';
  import type { LayoutServerData } from './$types';

  export let data: LayoutServerData;
</script>

<h1 class="m-title" use:portal={'#page-title'}>-</h1>
<ol class="breadcrumb" use:portal={'#breadcrumbs'}>
  <li class="crumb">
    <a class="anchor" href={`/m/${data.tournament.urlSlug}`}>{data.tournament.acronym}</a>
  </li>
  <li class="crumb-separator" aria-hidden>&rsaquo;</li>
  <li class="crumb">Error</li>
</ol>
<div class="w-full h-[calc(100vh-41px)] flex flex-col text-center justify-center items-center">
  <h1 class="text-primary-500">{$page.status}</h1>
  <p class="font-medium">{$page.error?.message}</p>
</div>
