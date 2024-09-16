<script lang="ts">
  import { portal } from 'svelte-portal';
  import { Tooltip } from '$lib/components/general';
  import { UserMenu } from '$lib/components/layout';
  import {
    Settings,
    Home,
    Image,
    // Network,
    // Users,
    // LockKeyhole,
    // Swords,
    // LineChart,
    // Table,
    // Gamepad2,
    Layout,
    Menu
  } from 'lucide-svelte';
  import { hasPermissions, isDatePast, tooltip } from '$lib/utils';
  import { Avatar } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import { popup } from '$lib/popup';
  import { devMenuCtx, showNavBar } from '$lib/stores';
  import { buildUrl } from 'osu-web.js';
  import { fade, fly } from 'svelte/transition';
  import { browser, dev } from '$app/environment';
  import { disableTabbing } from '$lib/actions';
  import type { SvelteComponent } from 'svelte';
  import type { LayoutServerData } from './$types';

  export let data: LayoutServerData;
  let showResponsiveMenu = false;
  let smScreen: boolean;
  let links: {
    tip: string;
    tipName: string;
    href: string;
    icon: typeof SvelteComponent<any>;
    class?: string;
  }[] = [];
  const tooltips = {
    dashboard: 'tooltip-dashboard',
    profile: 'tooltip-user'
  };

  onMount(() => {
    showNavBar.set(false);
    setDevMenuCtx(data);

    if (!browser) return;
    window.addEventListener('resize', isSmScreen);
  });

  onDestroy(() => {
    showNavBar.set(true);

    if (dev) {
      devMenuCtx.set({
        session: data.session,
        isUserOwner: data.isUserOwner
      });
    }

    if (!browser) return;
    window.removeEventListener('resize', isSmScreen);
  });

  function setDevMenuCtx(data: LayoutServerData) {
    if (dev) {
      devMenuCtx.set({
        session: data.session,
        isUserOwner: data.isUserOwner,
        staffMember: data.staffMember,
        tournament: data.tournament
      });
    }
  }

  function isSmScreen() {
    smScreen = window.innerWidth <= 640;
  }

  function toggleResponsiveMenu() {
    showResponsiveMenu = !showResponsiveMenu;
  }

  $: {
    const baseRoles: typeof data.staffMember.permissions = ['host', 'debug', 'manage_tournament'];
    const shownLinks: typeof links = [
      {
        href: '',
        icon: Home,
        tip: 'Home',
        tipName: 'tooltip-home'
      }
    ];

    if (hasPermissions(data.staffMember, baseRoles)) {
      shownLinks.push({
        href: '/settings',
        icon: Settings,
        tip: 'Settings',
        tipName: 'tooltip-settings'
      });

      // shownLinks.push({
      //   href: '/staff',
      //   icon: LockKeyhole,
      //   tip: 'Staff Team',
      //   tipName: 'tooltip-staff'
      // });
      // shownLinks.push({
      //   href: '/format',
      //   icon: Network,
      //   tip: 'Format',
      //   tipName: 'tooltip-format',
      //   class: 'rotate-90'
      // });
    }

    if (hasPermissions(data.staffMember, baseRoles.concat(['manage_regs']))) {
      // shownLinks.push({
      //   href: '/registrations',
      //   icon: Users,
      //   tip: 'Player Regs.',
      //   tipName: 'tooltip-regs'
      // });
    }

    if (
      hasPermissions(
        data.staffMember,
        baseRoles.concat([
          'view_matches',
          'manage_matches',
          'ref_matches',
          'commentate_matches',
          'stream_matches'
        ])
      )
    ) {
      // shownLinks.push({
      //   href: '/matches',
      //   icon: Swords,
      //   tip: 'Matches',
      //   tipName: 'tooltip-matches'
      // });
    }

    if (
      hasPermissions(
        data.staffMember,
        baseRoles.concat([
          'manage_pool_structure',
          'view_pool_suggestions',
          'create_pool_suggestions',
          'delete_pool_suggestions',
          'view_pooled_maps',
          'manage_pooled_maps'
        ])
      )
    ) {
      // shownLinks.push({
      //   href: '/mappools',
      //   icon: Table,
      //   tip: 'Mappools',
      //   tipName: 'tooltip-pools'
      // });
    }

    if (
      hasPermissions(
        data.staffMember,
        baseRoles.concat(['view_feedback', 'can_playtest', 'can_submit_replays'])
      )
    ) {
      // shownLinks.push({
      //   href: '/playtest',
      //   icon: Gamepad2,
      //   tip: 'Playtest',
      //   tipName: 'tooltip-playtest'
      // });
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
      // shownLinks.push({
      //   href: '/stats',
      //   icon: LineChart,
      //   tip: 'Statistics',
      //   tipName: 'tooltip-stats'
      // });
    }

    links = shownLinks;
  }

  $: {
    setDevMenuCtx(data);
  }

  $: concluded = !!data.tournament.concludesAt && isDatePast(data.tournament.concludesAt);
</script>

{#if smScreen && showResponsiveMenu}
  <button
    class="bg-surface-backdrop-token fixed top-[41px] left-0 h-screen w-screen overflow-hidden z-[39] cursor-default"
    transition:fade={{ duration: 150 }}
    use:portal={'#sidebar'}
    on:click={toggleResponsiveMenu}
  />
{/if}
{#if !smScreen || showResponsiveMenu}
  <nav
    class="absolute top-[41px] left-0 sm:static w-48 sm:w-max h-[calc(100vh-41px)] sm:h-full line-r grid grid-rows-[auto_max-content] bg-surface-100-800-token z-40"
    transition:fly={{ duration: 150, x: -100 }}
    use:portal={'#sidebar'}
  >
    <div class="w-full flex flex-col gap-2 p-2 overflow-y-auto">
      {#each links as { href, icon, tip, tipName, class: styles }}
        <a
          href={`/m/${data.tournament.urlSlug}${href}`}
          class="btn p-2 duration-150 hover:variant-soft-primary [&>*]:pointer-events-none"
          use:popup={tooltip(tipName, 'right')}
        >
          <svelte:component this={icon} size={24} class={`duration-150 ${styles}`.trim()} />
          <span class="inline-block sm:hidden w-full text-left">{tip}</span>
        </a>
        <Tooltip
          target={tipName}
          label={tip}
          arrowBorders="border-l border-b"
          visibility="hidden sm:block"
        />
      {/each}
    </div>
    <div class="line-t p-2 flex flex-col gap-2">
      <a
        href="/dashboard"
        class="btn p-2 duration-150 hover:variant-soft-primary [&>*]:pointer-events-none"
        use:popup={tooltip(tooltips.dashboard, 'right')}
      >
        <Layout size={24} />
        <span class="inline-block sm:hidden w-full text-left">Dashboard</span>
      </a>
      <Tooltip
        target={tooltips.dashboard}
        label="Dashboard"
        arrowBorders="border-l border-b"
        visibility="hidden sm:block"
      />
      <button
        class="btn duration-150 p-2 hover:variant-soft-primary"
        use:popup={{
          event: 'click',
          placement: 'right-end',
          target: 'tournament-user-menu',
          middleware: {
            offset: 24
          }
        }}
      >
        <Avatar
          src={buildUrl.userAvatar(data.session.osu.id)}
          rounded="rounded-md"
          width="w-6"
          border="border-white border-[3px]"
        />
        <span class="inline-block sm:hidden w-full text-left">Profile</span>
      </button>
      <UserMenu session={data.session} popupName="tournament-user-menu" />
    </div>
  </nav>
{/if}
<div class="w-full flex line-b bg-surface-100-800-token" use:portal={'#header'}>
  <div class="flex sm:hidden justify-center line-r">
    <button
      class="px-2 hover:bg-surface-50-900-token duration-150 [&>*]:duration-150 [&>*]:active:scale-[1.15]"
      on:click={toggleResponsiveMenu}
    >
      <Menu size={24} />
    </button>
  </div>
  <div id="page-title" class="line-r w-52 flex items-center px-4 font-bold text-lg" />
  <div id="breadcrumbs" class="py-2 px-4 overflow-x-auto overflow-y-hidden" />
</div>
<div class="relative z-[9]" use:disableTabbing={() => concluded}>
  {#if concluded}
    <div class="absolute top-0 left-0 w-full h-full bg-surface-backdrop-token z-10"></div>
    <div class="relative z-[11] w-full p-4 text-center bg-primary-backdrop-token line-b mb-4">
      The tournament has concluded, you can no longer make any changes.
    </div>
  {/if}
  <slot />
</div>
