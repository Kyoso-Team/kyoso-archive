<script lang="ts">
  import '../app.postcss';
  import 'highlight.js/styles/atom-one-dark.css';
  import env from '$lib/env/client';
  import { buildUrl } from 'osu-web.js';
  import { goto } from '$app/navigation';
  import { form, paypal, error, upload } from '$stores';
  import { onMount } from 'svelte';
  import {
    initializeStores,
    setInitialClassState,
    AppShell,
    AppBar,
    Avatar,
    storeHighlightJs,
    storePopup,
    Modal,
    popup,
    Toast
  } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
  import { Sidebar } from '$components';
  import { modalRegistry } from '$lib/modal-registry';
  import type { Form, Error, Upload } from '$components';
  import type { PopupSettings } from '@skeletonlabs/skeleton';
  import type { LayoutServerData } from './$types';

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  export let data: LayoutServerData;
  let formComponent: typeof Form | undefined;
  let errorComponent: typeof Error | undefined;
  let uploadComponent: typeof Upload | undefined;

  const navLinks = [
    {
      href: 'dashboard',
      label: 'Dashboard'
    },
    {
      href: 'tournaments',
      label: 'Tournaments'
    },
    {
      href: 'blog',
      label: 'Blog'
    }
  ];

  const adminNavLinks = [
    {
      href: 'users',
      label: 'Users'
    },
    {
      href: 'purchases',
      label: 'Purchases'
    },
    {
      href: 'upload',
      label: 'Upload'
    }
  ];

  const navbarPopup: PopupSettings = {
    event: 'click',
    placement: 'bottom',
    target: '',
    middleware: {
      offset: 24
    }
  };

  initializeStores();

  onMount(() => {
    loadPayPalScript();
    loadHighlightJs();
    loadFormComponent();
    loadErrorComponent();
    loadUploadComponent();
  });

  async function loadPayPalScript() {
    try {
      let { loadScript } = await import('@paypal/paypal-js');
      let paypalScript = await loadScript({
        'client-id': env.PUBLIC_PAYPAL_CLIENT_ID,
        'currency': 'USD'
      });

      paypal.set(paypalScript);
    } catch (err) {
      console.error('An error ocurred while loading the PayPal SDK script');
      console.error(err);
    }
  }

  async function loadHighlightJs() {
    let hljs = await import('highlight.js');
    storeHighlightJs.set(hljs);
  }

  async function loadFormComponent() {
    let form = await import('$components/layout/Form.svelte');
    formComponent = form.default;
  }

  async function loadErrorComponent() {
    let error = await import('$components/layout/Error.svelte');
    errorComponent = error.default;
  }

  async function loadUploadComponent() {
    let upload = await import('$components/layout/Upload.svelte');
    uploadComponent = upload.default;
  }

  function onLogoutClick() {
    goto('/auth/logout');
  }
</script>

<svelte:head>
  {@html `<script>(${setInitialClassState.toString()})();</script>`}
</svelte:head>
<Modal components={modalRegistry} />
<Toast />
<AppShell regionPage="relative" slotPageHeader="sticky top-0 z-10">
  <svelte:fragment slot="header">
    <AppBar padding="py-3 px-6">
      <svelte:fragment slot="lead">
        <nav class="flex items-center gap-2">
          <a href="/">
            <img src={`${$page.url.origin}/logo-hybrid.svg`} alt="logo-hybrid" class="mr-4 h-7" />
          </a>
          {#if data.user && data.user.isAdmin}
            <button
              class="btn hover:variant-soft-primary"
              use:popup={{ ...navbarPopup, target: 'adminPopup' }}>Admin</button
            >
            <div class="card absolute left-4 top-[5rem] w-52 py-2" data-popup="adminPopup">
              <nav class="flex flex-col gap-1 px-2">
                {#each adminNavLinks as { href, label }}
                  <a
                    href={`/admin/${href}`}
                    class="btn justify-start py-1 hover:variant-soft-primary">{label}</a
                  >
                {/each}
              </nav>
            </div>
          {/if}
          {#each navLinks as { href, label }}
            <a href={`/${href}`} class="btn hover:variant-soft-primary">{label}</a>
          {/each}
        </nav>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <div>
          {#if data.user}
            <div use:popup={{ ...navbarPopup, target: 'avatarPopup' }}>
              <Avatar
                src={buildUrl.userAvatar(data.user.osuUserId)}
                width="w-10"
                cursor="cursor-pointer"
              />
            </div>
            <div class="card absolute right-4 top-[5rem] w-52 py-2" data-popup="avatarPopup">
              <section class="flex flex-col px-6">
                <div class="font-bold">{data.user.username}</div>
                <div class="text-sm">{data.user.discordTag}</div>
              </section>
              <nav class="mt-2 flex flex-col gap-1 px-2">
                <a
                  href={`/user/${data.user.id}`}
                  class="btn justify-start py-1 hover:variant-soft-primary">Profile</a
                >
                <a href="/user/settings" class="btn justify-start py-1 hover:variant-soft-primary"
                  >Settings</a
                >
                <button
                  on:click={onLogoutClick}
                  class="btn justify-start py-1 hover:variant-soft-primary">Logout</button
                >
              </nav>
            </div>
          {:else}
            <a href="/auth/login" class="variant-filled-primary btn">Login</a>
          {/if}
        </div>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <Sidebar />
  </svelte:fragment>
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
    >
      <svelte:component this={errorComponent} />
    </div>
  {/if}
  <slot />
</AppShell>
