<script lang="ts">
  import type { PageServerData } from './$types';

  export let data: PageServerData;
</script>

{JSON.stringify(data.general)}
{JSON.stringify(data.dates)}
{JSON.stringify(data.links)}
{#await data.streamed.counts}
  Loading counts...
{:then counts}
  {JSON.stringify(counts)}
{/await}
{#await data.streamed.prizes}
  Loading prizes...
{:then prizes}
  {JSON.stringify(prizes)}
{/await}
{#await data.streamed.stages}
  Loading stages...
{:then stages}
  {JSON.stringify(stages)}
{/await}
{#await data.streamed.staffMembers}
  Loading staff members...
{:then staffMembers}
  {JSON.stringify(staffMembers)}
{/await}