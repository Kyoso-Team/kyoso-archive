<script lang="ts">
  import { portal } from 'svelte-portal';
  import type { PageServerData } from './$types';
  
  export let data: PageServerData;
</script>

<span use:portal={'#page-title'}>Home</span>
<ol class="breadcrumb py-2 px-4" use:portal={'#breadcrumbs'}>
  <li class="crumb">{data.tournament.acronym}</li>
</ol>
