<script lang="ts">
  import CreateTournamentForm from './CreateTournamentForm.svelte';
  import Tournament from './Tournament.svelte';
  import { Tooltip } from '$components/general';
  import { page } from '$app/stores';
  import { SEO } from '$components/general';
  import { Backdrop } from '$components/layout';
  import { portal } from 'svelte-portal';
  import { tooltip } from '$lib/utils';
  import { popup } from '@skeletonlabs/skeleton';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let showForm = false;
  const tooltips = {
    notApprovedHost: 'tooltip-not-approved-host'
  };

  function toggleShowForm() {
    showForm = !showForm;
  }
</script>

{#if showForm}
  <Backdrop>
    <CreateTournamentForm bind:show={showForm} />
  </Backdrop>
{/if}
<SEO page={$page} title="Dashboard" description="User dashboard" noIndex />
<nav class="h-full w-64 line-r p-4 relative" use:portal={'#sidebar'}>
  <div class="absolute inset-0 flex h-[calc(100%-74px)] flex-col gap-y-6 overflow-y-auto p-4">
    <div>
      <span class="font-bold text-primary-500">STAFFING</span>
      {#if data.tournamentsStaffing.length === 0}
        <span class="inline-block text-sm text-surface-700/75 dark:text-surface-300/75 mt-2"
          >You're currently not staffing in any tournaments</span
        >
      {:else}
        <div class="flex flex-col gap-4 mt-4">
          {#each data.tournamentsStaffing as tournament}
            <Tournament {tournament} />
          {/each}
        </div>
      {/if}
    </div>
    <div>
      <span class="font-bold text-primary-500">PLAYING</span>
      {#if data.tournamentsPlaying.length === 0}
        <span class="inline-block text-sm text-surface-700/75 dark:text-surface-300/75 mt-2"
          >You're currently not playing in any tournaments</span
        >
      {:else}
        <div class="flex flex-col gap-4 mt-4">
          {#each data.tournamentsPlaying as tournament}
            <Tournament {tournament} playing />
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <div class="absolute bottom-0 left-0 w-full line-t p-4">
    <button
      class="btn variant-filled-primary w-full [&>*]:pointer-events-none"
      on:click={toggleShowForm}
      use:popup={tooltip(tooltips.notApprovedHost)}
      disabled={!data.session.approvedHost}>Create Tournament</button
    >
    <Tooltip label="You're not approved to host a tournament" target={tooltips.notApprovedHost} visibility={data.session.approvedHost ? 'hidden' : 'block'} />
  </div>
</nav>
