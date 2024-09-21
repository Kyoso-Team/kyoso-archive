<script lang="ts">
  import '../app.postcss';
  import { Loader2 } from 'lucide-svelte';
  import { arrow, autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
  import {
    AppShell,
    getToastStore,
    initializeStores,
    setInitialClassState,
    storePopup,
    Toast
  } from '@skeletonlabs/skeleton';
  import { inject } from '@vercel/analytics';
  import { onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { dev } from '$app/environment';
  import { page } from '$app/stores';
  import { Backdrop, NavBar } from '$lib/components/layout';
  import { createSSEListener } from '$lib/sse';
  import { devMenuCtx, loading, showNavBar } from '$lib/stores';
  import { toastError, toastNotify } from '$lib/utils';
  import type { DevMenu } from '$lib/components/layout';
  import type { SSEConnectionData, SSEConnections } from '$lib/types';
  import type { LayoutServerData } from './$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();
  inject({ mode: dev ? 'development' : 'production' });

  export let data: LayoutServerData;
  let unmountNotificationListener: (() => void) | undefined;
  let unreadNotificationCount: number | undefined;
  const toast = getToastStore();
  let devMenuComponent: typeof DevMenu;

  onMount(async () => {
    unmountNotificationListener = createSSEListener<SSEConnections['notifications']>(
      '/api/notifications',
      {
        error: (err) => toastError(toast, err),
        new_notification: onNewNotification,
        notification_count: onNotificationCount
      }
    );

    await mountDevMenu();
  });

  onDestroy(() => {
    unmountNotificationListener?.();
  });

  function onNewNotification(
    notification: SSEConnectionData<SSEConnections['notifications'], 'new_notification'>
  ) {
    if (unreadNotificationCount !== undefined) {
      unreadNotificationCount++;
    }

    toastNotify(toast, notification.message);
  }

  function onNotificationCount(
    count: SSEConnectionData<SSEConnections['notifications'], 'notification_count'>
  ) {
    unreadNotificationCount = count;
  }

  async function mountDevMenu() {
    if (!dev) return;

    devMenuComponent = (await import('$lib/components/layout/DevMenu.svelte')).default;

    if (!$page.url.pathname.includes('/m/')) {
      devMenuCtx.set({
        session: data.session,
        isUserOwner: data.isUserOwner
      });
    }
  }
</script>

{#if dev && devMenuComponent !== undefined}
  <svelte:component this={devMenuComponent} />
{/if}
<svelte:head>
  {@html `<\u{73}cript nonce="%sveltekit.nonce%">(${setInitialClassState.toString()})();</script>`}
</svelte:head>
{#if $loading}
  <Backdrop zIndex="z-[100]">
    <div transition:fly={{ duration: 150, y: 50 }}>
      <Loader2 size={64} class="dark:stroke-white stroke-black animate-spin" />
    </div>
  </Backdrop>
{/if}
<Toast position="bl" />
<AppShell slotPageHeader="sticky top-0 z-[11]" slotSidebarLeft="z-[9]">
  <svelte:fragment slot="header">
    {#if $showNavBar}
      <NavBar session={data.session} {unreadNotificationCount} />
    {/if}
    <div id="header" class="h-max" />
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <div id="sidebar" class="h-full" />
  </svelte:fragment>
  <slot />
</AppShell>
