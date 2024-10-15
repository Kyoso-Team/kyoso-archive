<script lang="ts">
  import CreateTournamentForm from './CreateTournamentForm.svelte';
  import Tournament from './Tournament.svelte';
  import { portal } from 'svelte-portal';
  import { page } from '$app/stores';
  import { SEO, Tooltip } from '$lib/components/general';
  import { Backdrop } from '$lib/components/layout';
  import { popup } from '$lib/popup';
  import { tooltip } from '$lib/utils';
  import { createToggle } from '$lib/stores';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  const showForm = createToggle(false);
  const tooltips = {
    notApprovedHost: 'tooltip-not-approved-host'
  };
</script>

{#if $showForm}
  <Backdrop>
    <CreateTournamentForm bind:hide={showForm.false$} />
  </Backdrop>
{/if}
<SEO page={$page} title="Dashboard" description="User dashboard" noIndex />
<nav
  class="h-full w-64 line-r bg-surface-100-800-token grid grid-rows-[auto_max-content]"
  use:portal={'#sidebar'}
>
  <div class="flex flex-col gap-y-8 overflow-y-auto p-4">
    <div>
      <span class="font-bold text-primary-500">STAFFING</span>
      {#if data.tournamentsStaffing.length === 0}
        <span class="inline-block text-sm text-surface-600-300-token mt-2"
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
        <span class="inline-block text-sm text-surface-600-300-token mt-2"
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
  <div class="w-full line-t p-4">
    <button
      class="btn variant-filled-primary w-full [&>*]:pointer-events-none"
      on:click={showForm.true$}
      use:popup={tooltip(tooltips.notApprovedHost)}
      disabled={!data.session.approvedHost}>Create Tournament</button
    >
    <Tooltip
      label="You're not approved to host a tournament"
      target={tooltips.notApprovedHost}
      visibility={data.session.approvedHost ? 'hidden' : 'block'}
    />
  </div>
</nav>
