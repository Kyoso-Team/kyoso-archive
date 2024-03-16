<script lang="ts">
  import { portal } from 'svelte-portal';
  import { Tooltip } from '$components/general';
  import { UserMenu } from '$components/layout';
  import { Kyoso } from '$components/icons';
  import { Settings, Home, Image, Network, Users, LockKeyhole, Swords, LineChart, Table, Gamepad2, Layout } from 'lucide-svelte';
  import { hasPermissions, tooltip } from '$lib/utils';
  import { popup, Avatar } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import { showNavBar } from '$stores';
  import { buildUrl } from 'osu-web.js';
  import type { LayoutServerData } from './$types';
  import type { AnyComponent } from '$types';

  export let data: LayoutServerData;
  let links: {
    tip: string;
    tipName: string;
    href: string;
    icon: AnyComponent;
    class?: string;
  }[] = [];
  const tooltips = {
    dashboard: 'tooltip-dashboard',
    profile: 'tooltip-user'
  };

  onMount(() => {
    showNavBar.set(false);
  });

  onDestroy(() => {
    showNavBar.set(true);
  });

  $: {
    const baseRoles: typeof data.staffMember.permissions = ['host', 'debug', 'manage_tournament'];
    const shownLinks: typeof links = [{
      href: '',
      icon: Home,
      tip: 'Home',
      tipName: 'tooltip-home'
    }];

    if (hasPermissions(data.staffMember, baseRoles)) {
      shownLinks.push({
        href: '/settings',
        icon: Settings,
        tip: 'Settings',
        tipName: 'tooltip-settings'
      });

      shownLinks.push({
        href: '/staff',
        icon: LockKeyhole,
        tip: 'Staff Team',
        tipName: 'tooltip-staff'
      });

      shownLinks.push({
        href: '/format',
        icon: Network,
        tip: 'Format',
        tipName: 'tooltip-format',
        class: 'rotate-90'
      });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['manage_regs']))) {
      shownLinks.push({
        href: '/registrations',
        icon: Users,
        tip: 'Player Regs.',
        tipName: 'tooltip-regs'
      });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['view_matches', 'manage_matches', 'ref_matches', 'commentate_matches', 'stream_matches']))) {
      shownLinks.push({
        href: '/matches',
        icon: Swords,
        tip: 'Matches',
        tipName: 'tooltip-matches'
      });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['manage_pool_structure', 'view_pool_suggestions', 'create_pool_suggestions', 'delete_pool_suggestions', 'view_pooled_maps', 'manage_pooled_maps']))) {
      shownLinks.push({
        href: '/mappools',
        icon: Table,
        tip: 'Mappools',
        tipName: 'tooltip-pools'
      });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['view_feedback', 'can_playtest', 'can_submit_replays']))) {
      shownLinks.push({
        href: '/playtest',
        icon: Gamepad2,
        tip: 'Playtest',
        tipName: 'tooltip-playtest'
      });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['manage_assets']))) {
      shownLinks.push({
        href: '/assets',
        icon: Image,
        tip: 'Assets',
        tipName: 'tooltip-assets'
      });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['manage_stats']))) {
      shownLinks.push({
        href: '/stats',
        icon: LineChart,
        tip: 'Statistics',
        tipName: 'tooltip-stats'
      });
    }

    links = shownLinks;
  }
</script>

<nav class="h-full line-r grid grid-rows-[40px_auto_max-content] bg-surface-100-800-token" use:portal={'#sidebar'}>
  <div class="p-2 line-b flex justify-center items-center">
    <a href="/" class="btn p-0 duration-150 hover:opacity-75">
      <Kyoso class="w-6 h-6 dark:fill-white fill-black" />
    </a>
  </div>
  <div class="w-full flex flex-col gap-2 p-2 overflow-y-auto">
    {#each links as { href, icon, tip, tipName, class: styles }}
      <a href={`/t/m/${data.tournament.urlSlug}${href}`} class="btn p-2 duration-150 hover:variant-soft-primary [&>*]:pointer-events-none" use:popup={tooltip(tipName, 'right')}>
        <svelte:component this={icon} size={24} class={`duration-150 ${styles}`.trim()} />
      </a>
      <Tooltip target={tipName} label={tip} arrowBorders="border-l border-b" />
    {/each}
  </div>
  <div class="line-t p-2 flex flex-col gap-2">
    <a href="/dashboard" class="btn p-2 duration-150 hover:variant-soft-primary [&>*]:pointer-events-none" use:popup={tooltip(tooltips.dashboard, 'right')}>
      <Layout size={24} />
    </a>
    <Tooltip target={tooltips.dashboard} label="Dashboard" arrowBorders="border-l border-b" />
    <button class="btn duration-150 p-2 hover:variant-soft-primary" use:popup={{
      event: 'click',
      placement: 'right-end',
      target: 'tournament-user-menu',
      middleware: {
        offset: 24
      }
    }}>
      <Avatar src={buildUrl.userAvatar(data.session.osu.id)} rounded="rounded-md" width="w-6" border="border-white border-[3px]" />
    </button>
    <UserMenu session={data.session} popupName="tournament-user-menu" />
  </div>
</nav>
<div class="w-full flex line-b bg-surface-100-800-token">
  <div id="page-title" class="line-r w-52 flex items-center px-4 font-bold text-lg" />
  <div id="breadcrumbs" />
</div>
<slot />