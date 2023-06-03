<!-- NEEDS UPDATE -->
<script lang="ts">
  import { sidebar } from '$stores';
  import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';
  import {
    SettingsIcon,
    PickemsIcon,
    PoolingIcon,
    RefereeIcon,
    RegistrationsIcon,
    StatsIcon
  } from '$components';

  let group: number | undefined;
  let currentTile: number = 0;
  let selectedSection = sidebar.selectedSection;
</script>

{#if $sidebar}
  <div class="grid h-full grid-cols-[auto_auto] fill-white">
    <AppRail background="bg-surface-50-900-token">
      {#each Array.from($sidebar.sections.entries()) as [label, { icon }]}
        <AppRailTile value={label} name={`section-${label}`} regionLead="flex items-center flex-col" bind:group={currentTile}>
          <svelte:fragment slot="lead">
            {#if icon === 'settings'}
              <SettingsIcon w={30} h={30} />
            {:else if icon === 'pickems'}
              <PickemsIcon w={42} h={30} />
            {:else if icon === 'pooling'}
              <PoolingIcon w={30} h={30} />
            {:else if icon === 'referee'}
              <RefereeIcon w={38} h={32} />
            {:else if icon === 'regs'}
              <RegistrationsIcon w={35} h={32} />
            {:else}
              <StatsIcon w={30} h={30} />
            {/if}
            <span class="text-sm block mt-1">{label}</span>
          </svelte:fragment>
        </AppRailTile>
      {/each}
    </AppRail>
    <nav
      class="flex h-full w-64 flex-col gap-y-6 border-l border-r border-surface-500/50 p-4 bg-surface-50-900-token"
    >
      {#if $selectedSection}
        {#each Array.from($sidebar.sections.get($selectedSection)?.subsections || []) as [subsectionLabel, links], i}
          <div class="flex flex-col gap-y-1">
            <span class="block px-4 pb-2 font-bold text-primary-500"
              >{subsectionLabel.toUpperCase()}</span
            >
            {#each links as { label, path }}
              <a href={path} class="!no-underline">
                <span
                  class={`block rounded-full px-4 py-2 ${
                    $sidebar.selectedLink?.inSection === $selectedSection &&
                    $sidebar.selectedLink?.inSubsection === subsectionLabel &&
                    $sidebar.selectedLink?.label === label
                      ? 'variant-filled-primary'
                      : 'text-white hover:variant-soft-primary'
                  }`}>{label}</span
                >
              </a>
            {/each}
            {#if i !== Array.from($sidebar.sections.get($selectedSection)?.subsections || []).length - 1}
              <div class="mt-4 border-t border-surface-500/50" />
            {/if}
          </div>
        {/each}
      {/if}
    </nav>
  </div>
{/if}
