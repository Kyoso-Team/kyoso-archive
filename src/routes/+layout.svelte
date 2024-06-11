<script lang="ts">
  import '../app.postcss';
  import { NavBar, Backdrop, Modal } from '$components/layout';
  import { showNavBar, loading } from '$stores';
  import { onDestroy, onMount } from 'svelte';
  import {
    initializeStores,
    setInitialClassState,
    AppShell,
    storePopup,
    Toast,
    modeCurrent,
    setModeUserPrefers,
    setModeCurrent,
    getToastStore
  } from '@skeletonlabs/skeleton';
  import { Loader2 } from 'lucide-svelte';
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';
  import { displayError } from '$lib/utils';
  import type { LayoutServerData } from './$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
  initializeStores();

  export let data: LayoutServerData;
  let showImpersonateUserModal = false;
  let impersonateUserInput: number | null;
  const toast = getToastStore();

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
        toggleShowImpersonateUserModal();
        break;
      case '@':
        toggletheme();
        break;
      default:
        break;
    }
  }

  function toggleShowImpersonateUserModal() {
    showImpersonateUserModal = !showImpersonateUserModal;
  }

  async function impersonateUser() {
    let resp!: Response;

    loading.set(true);

    try {
      resp = await fetch(`/api/auth/impersonate?redirect_uri=${encodeURI($page.url.toString())}`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: impersonateUserInput
        })
      });
    } catch (err) {
      displayError(toast, err);
    }

    if (!resp.ok) {
      displayError(toast, await resp.json());
    }

    location.reload();
  }

  function toggletheme() {
    $modeCurrent = !$modeCurrent;
    setModeUserPrefers($modeCurrent);
    setModeCurrent($modeCurrent);
  }
</script>

{#if showImpersonateUserModal}
  <Backdrop zIndex="z-40">
    <Modal>
      <span class="title">Impersonate User</span>
      {#if data.session?.realUser}
        <p class="mb-2 text-warning-500">
          You're currently impersonating a user. Click "End Session" to go back to being yourself.
        </p>
      {/if}
      <p>
        Input the Kyoso user ID of the user you want to impersonate. Can be any user registered in
        the databse (except banned users).
      </p>
      <input type="number" class="input mt-2" bind:value={impersonateUserInput} />
      <div class="actions">
        <button
          class="btn variant-filled-primary"
          disabled={!impersonateUserInput}
          on:click={impersonateUser}>Impersonate</button
        >
        {#if data.session?.realUser}
          <a
            class="btn variant-filled-error"
            href={`/api/auth/logout?redirect_uri=${encodeURI(
              `${$page.url.origin}/api/auth/login?redirect_uri=${encodeURI($page.url.toString())}`
            )}`}>End Session</a
          >
        {/if}
        <button class="btn variant-filled" on:click={toggleShowImpersonateUserModal}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
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
