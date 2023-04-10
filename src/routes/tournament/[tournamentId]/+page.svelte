<script lang="ts">
  import type { PageServerData } from './$types';

  export let data: PageServerData;
</script>

<h1>{data.tournament.name}</h1>
