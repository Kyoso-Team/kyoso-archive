<script lang="ts">
  import { onDestroy } from 'svelte';
  import { hasPerms } from '$lib/utils';
  import { sidebar } from '$stores';
  import type { LayoutServerData } from './$types';

  export let data: LayoutServerData;

  onDestroy(() => {
    sidebar.destroy();
  });

  sidebar.create();
  let basePath = `/tournament/${data.tournament.id}/manage/`;

  if (hasPerms(data.staffMember, ['Host', 'Debug', 'MutateTournament'])) {
    let settings = sidebar.setSection('Settings', 'settings');

    let settingsPath = `${basePath}settings/`;
    settings.setSubsection('Settings', [
      {
        label: 'General',
        path: `${settingsPath}general`
      },
      {
        label: 'Dates',
        path: `${settingsPath}dates`
      },
      {
        label: 'Links',
        path: `${settingsPath}links`
      },
      {
        label: 'Stages',
        path: `${settingsPath}stages`
      },
      {
        label: 'Prizes',
        path: `${settingsPath}prizes`
      },
      {
        label: 'Graphics',
        path: `${settingsPath}graphics`
      }
    ]);

    let refSettingsPath = `${basePath}referee-settings/`;
    settings.setSubsection('Referee', [
      {
        label: 'General',
        path: `${refSettingsPath}general`
      },
      {
        label: 'Mod Multipliers',
        path: `${refSettingsPath}mod-multipliers`
      },
      {
        label: 'Rules',
        path: `${refSettingsPath}rules`
      }
    ]);
  }

  if (hasPerms(data.staffMember, ['Host', 'Debug', 'ViewStaffMembers', 'ViewRegs'])) {
    let regs = sidebar.setSection('Regs.', 'regs');

    if (hasPerms(data.staffMember, ['Host', 'Debug', 'ViewStaffMembers'])) {
      let staffPath = `${basePath}staff/`;
      regs.setSubsection('Staff', [
        {
          label: 'Team',
          path: `${staffPath}team`
        },
        {
          label: 'Roles',
          path: `${staffPath}roles`
        },
        {
          label: 'Applications',
          path: `${staffPath}staff-applications`
        }
      ]);
    }

    if (hasPerms(data.staffMember, ['Host', 'Debug', 'ViewRegs'])) {
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
      'Debug',
      'ViewPoolSuggestions',
      'ViewPooledMaps'
    ])
  ) {
    let pooling = sidebar.setSection('Pooling', 'pooling');
  }

  if (hasPerms(data.staffMember, ['Host', 'Debug', 'ViewMatches'])) {
    let referee = sidebar.setSection('Reffing.', 'referee');
  }

  if (hasPerms(data.staffMember, ['Host', 'Debug', 'ViewStats'])) {
    let stats = sidebar.setSection('Stats. Calc.', 'stats calc');
  }

  if (hasPerms(data.staffMember, ['Host', 'Debug'])) {
    let pickems = sidebar.setSection('Pickems', 'pickems');
  }
</script>

<slot />
