<script lang="ts">
  import CreateTournamentForm from './CreateTournamentForm.svelte';
  import Tournament from './Tournament.svelte';
  import { page } from '$app/stores';
  import { SEO } from '$components/general';
  import { Backdrop } from '$components/layout';
  import { portal } from 'svelte-portal';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let showForm = false;

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
<nav class="relative h-full w-64 line-r p-4 bg-surface-50-900-token" use:portal={'#sidebar'}>
  <div class="absolute inset-0 flex h-[calc(100%-74px)] flex-col gap-y-6 overflow-y-scroll p-4">
    <div>
      <span class="block pb-4 font-bold text-primary-500">STAFFING</span>
      {#if data.tournamentsStaffing.length === 0}
        <span class="inline-block text-sm text-surface-700 dark:text-surface-300"
          >You're currently not staffing in any tournaments</span
        >
      {:else}
        <div class="flex flex-col gap-4">
          {#each data.tournamentsStaffing as tournament}
            <Tournament {tournament} />
          {/each}
        </div>
      {/if}
    </div>
    <div>
      <span class="block pb-4 font-bold text-primary-500">PLAYING</span>
      {#if data.tournamentsPlaying.length === 0}
        <span class="inline-block text-sm text-surface-700 dark:text-surface-300"
          >You're currently not playing in any tournaments</span
        >
      {:else}
        <div class="flex flex-col gap-4">
          {#each data.tournamentsPlaying as tournament}
            <Tournament {tournament} playing />
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <div class="absolute bottom-0 left-0 w-full line-t p-4">
    <button class="btn variant-filled-primary w-full" on:click={toggleShowForm}>Create Tournament</button>
  </div>
</nav>