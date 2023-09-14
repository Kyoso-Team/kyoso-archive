<script lang="ts">
  import { DashboardTournament as Tournament } from '$components';
  import { dashboardSidebar } from '$stores';
</script>

{#if $dashboardSidebar}
  <nav class="relative h-full w-64 border-r border-surface-500/50 p-4 bg-surface-50-900-token">
    <div class="absolute inset-0 flex h-[calc(100%-65px)] flex-col gap-y-6 overflow-y-scroll p-4">
      <div>
        <span class="block pb-4 font-bold text-primary-500">STAFFING</span>
        {#if $dashboardSidebar.tournamentsStaffing.length === 0}
          <span class="inline-block text-sm text-gray-300"
            >You're currently not staffing in any tournaments</span
          >
        {:else}
          <div class="flex flex-col gap-4">
            {#each $dashboardSidebar.tournamentsStaffing as tournament}
              <Tournament {tournament} />
            {/each}
          </div>
        {/if}
      </div>
      <div>
        <span class="block pb-4 font-bold text-primary-500">PLAYING</span>
        {#if $dashboardSidebar.tournamentsPlaying.length === 0}
          <span class="inline-block text-sm text-gray-300"
            >You're currently not playing in any tournaments</span
          >
        {:else}
          <div class="flex flex-col gap-4">
            {#each $dashboardSidebar.tournamentsPlaying as tournament}
              <Tournament {tournament} />
            {/each}
          </div>
        {/if}
      </div>
    </div>
    <div class="absolute bottom-0 left-0 w-full border-t border-surface-500/50 p-4">
      <button
        class="btn btn-sm variant-filled-primary w-full"
        on:click={$dashboardSidebar.onCreateTournament}>Create Tournament</button
      >
    </div>
  </nav>
{/if}
