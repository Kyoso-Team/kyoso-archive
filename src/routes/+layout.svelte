<script lang="ts">
  import '../app.postcss';
  import 'highlight.js/styles/atom-one-dark.css';
  import { NavBar } from '$components/layout';
  //import { form, error, upload } from '$stores';
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
  //import { Sidebar } from '$components';
  //import type { Form, Error, Upload } from '$components';
  import type { LayoutServerData } from './$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  export let data: LayoutServerData;
  //let formComponent: typeof Form | undefined;
  //let errorComponent: typeof Error | undefined;
  //let uploadComponent: typeof Upload | undefined;

  initializeStores();

  onMount(() => {
    loadHighlightJs();
    // loadFormComponent();
    // loadErrorComponent();
    // loadUploadComponent();
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
    <NavBar session={data.session} />
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
  {#if data.testingEnv}
    <div class="fixed bottom-0 left-0 w-screen p-2 font-medium h-max text-sm bg-warning-500 border-warning-900 border-t-2 text-black opacity-25 text-center z-[100]">
      <span class="sm:inline-block hidden">This is a test build of Kyoso. Any data stored here is subject to be completely wiped. Do not share any differences between this build and the production version of this site, unless given permission.</span>
      <span class="inline-block sm:hidden">This is a test build of Kyoso.</span>
    </div>
  {/if}
  <slot />
</AppShell>
