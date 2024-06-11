<script lang="ts">
  import Session from './Session.svelte';
  import { SEO } from '$components/general';
  import { Backdrop, Modal } from '$components/layout';
  import { Osu, Discord } from '$components/icons';
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { loading } from '$stores';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Copy, Eye, EyeOff, RotateCcw, Pencil } from 'lucide-svelte';
  import { displayError, toastSuccess } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import type { PageServerData } from './$types';
  import type { TRPCRouter } from '$types';

  export let data: PageServerData;
  let showChangeDiscordPrompt = false;
  let showGenerateApiKeyPrompt = false;
  let viewApiKey = false;
  const toast = getToastStore();

  function toggleChangeDiscordPrompt() {
    showChangeDiscordPrompt = !showChangeDiscordPrompt;
  }

  function toggleGenerateApiKeyPrompt() {
    showGenerateApiKeyPrompt = !showGenerateApiKeyPrompt;
  }

  function toggleApiKeyVisibility() {
    viewApiKey = !viewApiKey;
  }

  async function copyApiKey() {
    await navigator.clipboard.writeText(data.user.apiKey || '');
    toastSuccess(toast, 'API key copied to clipboard');
  }

  async function generateApiKey() {
    let user!: TRPCRouter['users']['updateSelf'];

    loading.set(true);

    try {
      user = await trpc($page).users.updateSelf.mutate();
    } catch (err) {
      displayError(toast, err);
    }

    data.user = {
      ...data.user,
      apiKey: user.apiKey
    };
    data = Object.assign({}, data);

    showGenerateApiKeyPrompt = false;
    loading.set(false);
    toastSuccess(toast, 'New API key generated successfully');
  }

  async function deleteSession(sessionId: number) {
    loading.set(true);

    try {
      await trpc($page).users.expireSession.mutate({
        sessionId
      });
    } catch (err) {
      displayError(toast, err);
    }
    
    data.activeSessions = data.activeSessions.filter((session) => session.id !== sessionId);
    data = Object.assign({}, data);

    loading.set(false);
    toastSuccess(toast, 'Session deleted successfully');
  }
</script>

<SEO page={$page} title="User Settings" description="Update your user settings" noIndex />
{#if showChangeDiscordPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Change Discord Account</span>
      <p>Are you sure you want to change the Discord account linked to Kyoso profile?</p>
      <div class="actions">
        <a
          class="btn variant-filled-primary"
          href={`/api/auth/change_discord?redirect_uri=${encodeURI($page.url.toString())}`}
          >Change Discord</a
        >
        <button class="btn variant-filled" on:click={toggleChangeDiscordPrompt}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showGenerateApiKeyPrompt}
  <Backdrop>
    <Modal>
      {#if data.user.apiKey}
        <span class="title">Generate New API Key</span>
        <p>
          Are you sure you want to generate a new API key? This will make the current one obsolete
          (unusuable), which means you'll need to replace the current key in any code base or
          project that has it with the new one.
        </p>
      {:else}
        <span class="title">Generate An API Key</span>
        <p>Are you sure you want to generate an API key?</p>
      {/if}
      <div class="actions">
        <button class="btn variant-filled-primary" on:click={generateApiKey}>Generate</button>
        <button class="btn variant-filled" on:click={toggleGenerateApiKeyPrompt}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
<main class="main flex justify-center">
  <div class="w-full max-w-5xl">
    <h1>User Settings</h1>
    <div class="line-b mt-4 mb-8" />
    <h2>Linked Accounts</h2>
    <p class="mt-2">The accounts linked to your Kyoso profile.</p>
    <div class="gap-4 mt-4 grid 2md:w-[calc(100%-1rem)] 2md:grid-cols-[50%_50%]">
      <div class="card p-4 w-full flex items-center relative">
        <div class="mr-4">
          <Osu w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <strong class="text-lg">{data.session.osu.username}</strong>
          <span class="text-xs xs:text-sm"><strong>User ID:</strong> {data.session.osu.id}</span>
        </div>
      </div>
      <div class="card p-4 w-full flex items-center relative">
        <div class="mr-4">
          <Discord w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <strong class="text-lg">{data.session.discord.username}</strong>
          <span class="text-xs xs:text-sm"><strong>User ID:</strong> {data.session.discord.id}</span
          >
        </div>
        <div class="absolute top-0 right-4 h-full flex items-center">
          <button class="btn-icon variant-filled" on:click={toggleChangeDiscordPrompt}>
            <Pencil size={20} />
          </button>
        </div>
      </div>
    </div>
    <div class="line-b my-8" />
    <h2>API Key</h2>
    <p class="mt-2 mb-4">
      <!-- TODO: Link anchor to docs-->
      This key allows you to make requests to the <a href="/" class="link">Kyoso API</a>.
      {#if data.user.apiKey}
        <span class="text-error-500">DO NOT SHARE THIS KEY WITH ANYONE.</span>
      {:else}
        <span>Start by creating your first key.</span>
      {/if}
    </p>
    {#if data.user.apiKey}
      <div class="p-4 card flex max-2sm:flex-col gap-4 relative">
        {#if viewApiKey}
          <input type="text" class="input w-full md:w-80" readonly bind:value={data.user.apiKey} />
        {:else}
          <input
            type="password"
            class="input w-full md:w-80"
            readonly
            bind:value={data.user.apiKey}
          />
        {/if}
        <div class="flex gap-2 md:absolute md:top-0 md:right-4 h-full items-center">
          <button class="btn-icon variant-filled" on:click={toggleApiKeyVisibility}>
            {#if viewApiKey}
              <EyeOff size={20} />
            {:else}
              <Eye size={20} />
            {/if}
          </button>
          <button class="btn-icon variant-filled" on:click={copyApiKey}>
            <Copy size={20} />
          </button>
          <button class="btn-icon variant-filled-primary" on:click={toggleGenerateApiKeyPrompt}>
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    {:else}
      <button class="btn variant-filled-primary" on:click={toggleGenerateApiKeyPrompt}>
        Generate Key
      </button>
    {/if}
    <div class="line-b my-8" />
    <h2>Sessions</h2>
    <p class="text-surface-600-300-token text-sm">Some details may be inaccurate.</p>
    <div class="mt-4 flex flex-col gap-2">
      {#each data.activeSessions as session}
        <div transition:slide|global={{ duration: 150 }}>
          <Session {session} {deleteSession} current={data.session.sessionId === session.id} />
        </div>
      {/each}
    </div>
  </div>
</main>
