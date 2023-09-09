<script lang="ts">
  import { DashboardTournament as Tournament } from '$components';
  import { dashboardSidebar } from '$stores';
</script>

{#if $dashboardSidebar}
  <nav class="h-full w-64 border-r border-surface-500/50 p-4 bg-surface-50-900-token relative">
    <div class="absolute inset-0 h-[calc(100%-65px)] flex flex-col gap-y-6 overflow-y-scroll p-4">
      <div>
        <span class="block pb-4 font-bold text-primary-500">STAFFING</span>
        {#if $dashboardSidebar.tournamentsStaffing.length === 0}
          <span class="text-gray-300 text-sm inline-block">You're currently not staffing in any tournaments</span>
        {:else}
          <div class="flex gap-4 flex-col">
            {#each $dashboardSidebar.tournamentsStaffing as tournament}
              <Tournament {tournament} />
            {/each}
          </div>
        {/if}
      </div>
      <div>
        <span class="block pb-4 font-bold text-primary-500">PLAYING</span>
        {#if $dashboardSidebar.tournamentsPlaying.length === 0}
          <span class="text-gray-300 text-sm inline-block">You're currently not playing in any tournaments</span>
        {:else}
          <div class="flex gap-4 flex-col">
            {#each $dashboardSidebar.tournamentsPlaying as tournament}
              <Tournament {tournament} />
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <div class="absolute bottom-0 left-0 border-t border-surface-500/50 p-4 w-full">
      <button class="btn btn-sm w-full variant-filled-primary" on:click={$dashboardSidebar.onCreateTournament}>Create Tournament</button>
    </div>
  </nav>
{/if}