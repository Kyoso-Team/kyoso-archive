<script lang="ts">
  import '../app.postcss';
  import { NavBar, Backdrop } from '$components/layout';
  import { showNavBar, loading } from '$stores';
  import {
    initializeStores,
    setInitialClassState,
    AppShell,
    storePopup,
    Toast
  } from '@skeletonlabs/skeleton';
  import { Loader2 } from 'lucide-svelte';
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import type { LayoutServerData } from './$types';
  import type { AnyComponent } from '$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  export let data: LayoutServerData;
  let devMenuComponent: AnyComponent;

  onMount(async () => {
    if (!data.isDevEnv) return;
    devMenuComponent = (await import('$components/layout/DevMenu.svelte')).default;
  });
</script>

{#if data.isDevEnv && devMenuComponent !== undefined}
  <svelte:component this={devMenuComponent} session={data.session} isUserOwner={data.isUserOwner} />
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
<AppShell slotPageHeader="sticky top-0 z-10" slotSidebarLeft="z-10">
  <svelte:fragment slot="header">
    {#if $showNavBar}
      <NavBar session={data.session} />
    {/if}
    <div id="header" class="h-max" />
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <div id="sidebar" class="h-full" />
  </svelte:fragment>
  <slot />
</AppShell>
