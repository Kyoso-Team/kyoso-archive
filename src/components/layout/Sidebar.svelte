<script lang="ts">
  import { sidebar } from '$stores';
  import { AppRail, AppRailTile } from '@skeletonlabs/skeleton';

  let selectedSection = sidebar.selectedSection;
</script>

{#if $sidebar}
  <div class="h-full grid grid-cols-[auto_auto] fill-white">
    <AppRail selected={sidebar.selectedSection} background="bg-surface-50-900-token">
      {#each Array.from($sidebar.sections.entries()) as [label, { icon }]}
        <AppRailTile value={label} {label}>
          {#if icon === 'settings'}
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
              <path d="m9.25 22l-.4-3.2q-.325-.125-.613-.3t-.562-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.337v-.674q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2h-5.5Zm2.8-6.5q1.45 0 2.475-1.025T15.55 12q0-1.45-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12q0 1.45 1.012 2.475T12.05 15.5Z"/>
            </svg>
          {/if}
        </AppRailTile>
      {/each}
    </AppRail>
    <nav class="border-l border-r border-surface-500/50 h-full bg-surface-50-900-token w-64 p-4 flex gap-y-6 flex-col">
      {#if $selectedSection}
        {#each Array.from($sidebar.sections.get($selectedSection)?.subsections || []) as [subsectionLabel, links], i}
          <div class="flex flex-col gap-y-1">
            <span class="block text-primary-500 font-bold px-4 pb-2">{subsectionLabel.toUpperCase()}</span>
            {#each links as { label, path }}
              <a href={path} class="!no-underline">
                <span
                  class={`block rounded-full px-4 py-2 ${$sidebar.selectedLink?.inSection === $selectedSection && $sidebar.selectedLink?.inSubsection === subsectionLabel && $sidebar.selectedLink?.label === label ? 'variant-filled-primary' : 'text-white hover:variant-soft-primary'}`}
                >{label}</span>
              </a>
            {/each}
            {#if i !== Array.from($sidebar.sections.get($selectedSection)?.subsections || []).length - 1}
              <div class="border-t border-surface-500/50 mt-4" />
            {/if}
          </div>
        {/each}
      {/if}
    </nav>
  </div>
{/if}