<script lang="ts">
  import { portal } from 'svelte-portal';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
</script>

<span use:portal={'#page-title'}>Home</span>
<ol class="breadcrumb" use:portal={'#breadcrumbs'}>
  <li class="crumb">{data.tournament.acronym}</li>
</ol>
<main class="main justify-center items-center h-full">
  <div class="flex gap-4 flex-wrap justify-center h-max">
    WIP. Imagine you're seeing a super cool page right now.
  </div>
</main>
