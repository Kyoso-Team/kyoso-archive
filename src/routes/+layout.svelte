<script lang="ts">
  import '../app.postcss';
  import 'highlight.js/styles/atom-one-dark.css';
  import { NavBar } from '$components/layout';
  import { showNavBar } from '$stores';
  import { onMount } from 'svelte';
  import {
    initializeStores,
    setInitialClassState,
    AppShell,
    storeHighlightJs,
    storePopup,
    Toast
  } from '@skeletonlabs/skeleton';
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import type { LayoutServerData } from './$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  export let data: LayoutServerData;

  initializeStores();

  onMount(() => {
    loadHighlightJs();
  });

  async function loadHighlightJs() {
    const hljs = await import('highlight.js');
    storeHighlightJs.set(hljs);
  }

  // async function loadFormComponent() {
  //   const form = await import('$components/layout/Form.svelte');
  //   formComponent = form.default;
  // }

  // async function loadErrorComponent() {
  //   const error = await import('$components/layout/Error.svelte');
  //   errorComponent = error.default;
  // }

  // async function loadUploadComponent() {
  //   const upload = await import('$components/layout/Upload.svelte');
  //   uploadComponent = upload.default;
  // }
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
  <!--
  {#if $form && formComponent}
    <div class="bg-surface-backdrop-token fixed inset-0 z-20 h-screen w-screen">
      <svelte:component this={formComponent} />
    </div>
  {/if}
  {#if $upload && uploadComponent}
    <div
      class="bg-surface-backdrop-token fixed inset-0 z-20 flex h-screen w-screen items-center justify-center"
    >
      <svelte:component this={uploadComponent} />
    </div>
  {/if}
  {#if $error && errorComponent}
    <div
      class="bg-surface-backdrop-token fixed inset-0 z-30 flex h-screen w-screen items-center justify-center"
session>
      <svelte:component this={errorComponent} />
    </div>
  {/if}
  -->
  <slot />
</AppShell>
