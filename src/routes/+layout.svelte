<script lang="ts">
  import '../app.postcss';
  import { NavBar } from '$components/layout';
  import { showNavBar } from '$stores';
  import { onDestroy, onMount } from 'svelte';
  import {
    initializeStores,
    setInitialClassState,
    AppShell,
    storePopup,
    Toast,
    modeCurrent,
    setModeUserPrefers,
    setModeCurrent
  } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { browser } from '$app/environment';
  import type { LayoutServerData } from './$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  export let data: LayoutServerData;

  onMount(() => {
    if (!browser || !data.isDevEnv) return;
    window.addEventListener('keydown', onDevShortcut);
  });

  onDestroy(() => {
    if (!browser || !data.isDevEnv) return;
    window.removeEventListener('keydown', onDevShortcut);
  });

  function onDevShortcut(e: KeyboardEvent) {
    if (!e.ctrlKey || !e.shiftKey) return;

    switch (e.key) {
      case '!':
        break;
      case '@':
        toggletheme();
        break;
      default:
        break;
    }
  }

  function toggletheme() {
    $modeCurrent = !$modeCurrent;
		setModeUserPrefers($modeCurrent);
		setModeCurrent($modeCurrent);
  }
</script>

<svelte:head>
  {@html `<\u{73}cript nonce="%sveltekit.nonce%">(${setInitialClassState.toString()})();</script>`}
</svelte:head>
<Toast position="bl" />
<AppShell regionPage="relative" slotPageHeader="sticky top-0 z-10">
  <svelte:fragment slot="header">
    {#if $showNavBar}
      <NavBar session={data.session} />
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <div id="sidebar" class="h-full" />
  </svelte:fragment>
  <slot />
</AppShell>
