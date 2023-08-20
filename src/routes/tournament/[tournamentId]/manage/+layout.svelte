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

  if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
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

  if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_staff_members', 'view_regs'])) {
    let regs = sidebar.setSection('Regs.', 'regs');

    if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_staff_members'])) {
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

    if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_regs'])) {
      let links: {
        label: string;
        path: string;
      }[] = [];

      if (data.tournament.type === 'teams') {
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

      if (data.tournament.type === 'solo') {
        links = [
          {
            label: 'Players',
            path: `${basePath}player-regs`
          }
        ];
      }

      if (data.tournament.type === 'draft') {
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

  if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_pool_suggestions', 'view_pooled_maps'])) {
    // let pooling = sidebar.setSection('Pooling', 'pooling');
  }

  if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_matches'])) {
    // let referee = sidebar.setSection('Reffing.', 'referee');
  }

  if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament', 'view_stats'])) {
    // let stats = sidebar.setSection('Stats. Calc.', 'stats calc');
  }

  if (hasPerms(data.staffMember, ['host', 'debug', 'mutate_tournament'])) {
    // let pickems = sidebar.setSection('Pickems', 'pickems');
  }
</script>

<slot />
