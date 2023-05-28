<script lang="ts">
  import { onDestroy } from 'svelte';
  import { hasPerms } from '$lib/utils';
  import { sidebar } from '$stores';
  import type { LayoutServerData } from './$types';

  export let data: LayoutServerData;

  sidebar.create();
  let basePath = `/tournament/${data.tournament.id}/manage/`;

  if (hasPerms(data.staffMember, ['Host', 'MutateTournament'])) {
    let settings = sidebar.setSection('Settings', 'settings');

    settings.setSubsection('Settings', [
      {
        label: 'General',
        path: `${basePath}settings`
      },
      {
        label: 'Dates',
        path: `${basePath}dates`
      },
      {
        label: 'Links',
        path: `${basePath}links`
      },
      {
        label: 'Stages',
        path: `${basePath}stages`
      },
      {
        label: 'Prizes',
        path: `${basePath}prizes`
      },
      {
        label: 'Graphics',
        path: `${basePath}graphics`
      }
    ]);

    settings.setSubsection('Referee', [
      {
        label: 'General',
        path: `${basePath}referee-settings`
      },
      {
        label: 'Mod Multipliers',
        path: `${basePath}mod-multipliers`
      },
      {
        label: 'Rules',
        path: `${basePath}rules`
      }
    ]);
  }

  if (hasPerms(data.staffMember, ['Host', 'ViewStaffMembers', 'ViewRegs'])) {
    let regs = sidebar.setSection('Regs.', 'regs');

    if (hasPerms(data.staffMember, ['Host', 'ViewStaffMembers'])) {
      regs.setSubsection('Staff', [
        {
          label: 'Staff Team',
          path: `${basePath}staff-team`
        },
        {
          label: 'Staff Apps.',
          path: `${basePath}staff-applications`
        }
      ]);
    }

    if (hasPerms(data.staffMember, ['Host', 'ViewRegs'])) {
      let links: {
        label: string;
        path: string;
      }[] = [];

      if (data.tournament.type === 'Teams') {
        links = [
          {
            label: 'Teams',
            path: `${basePath}team-regs`
          },
          {
            label: 'Free Agents',
            path: `${basePath}free-agent-regs`
          }
        ];
      }

      if (data.tournament.type === 'Solo') {
        links = [
          {
            label: 'Players',
            path: `${basePath}player-regs`
          }
        ];
      }

      if (data.tournament.type === 'Draft') {
        links = [
          {
            label: 'Players',
            path: `${basePath}player-regs`
          },
          {
            label: 'Formed Teams',
            path: `${basePath}formed-teams`
          }
        ];
      }

      regs.setSubsection('Player', links);
    }
  }

  if (
    hasPerms(data.staffMember, [
      'Host',
      'ViewPoolStructure',
      'ViewPoolSuggestions',
      'ViewPooledMaps',
      'ViewMapsToPlaytest'
    ])
  ) {
    let pooling = sidebar.setSection('Pooling', 'pooling');
  }

  if (hasPerms(data.staffMember, ['Host', 'ViewMatches'])) {
    let referee = sidebar.setSection('Reffing.', 'referee');
  }

  if (hasPerms(data.staffMember, ['Host', 'ViewStats'])) {
    let stats = sidebar.setSection('Stats. Calc.', 'stats calc');
  }

  if (hasPerms(data.staffMember, ['Host'])) {
    let pickems = sidebar.setSection('Pickems', 'pickems');
  }

  onDestroy(() => {
    sidebar.destroy();
  });
</script>

<slot />
