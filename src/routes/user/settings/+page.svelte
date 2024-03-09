<script lang="ts">
  import Session from './Session.svelte';
  import { SEO } from '$components/general';
  import { Backdrop, Modal } from '$components/layout';
  import { Osu, Discord } from '$components/icons';
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Copy, Eye, EyeOff } from 'lucide-svelte';
  import { displayError, toastSuccess } from '$lib/utils';
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

    toastSuccess(toast, 'New API key generated successfully');
    showGenerateApiKeyPrompt = false;
  }

  async function deleteSession(sessionId: number) {
    try {
      await trpc($page).users.expireSession.mutate({
        sessionId
      });
    } catch (err) {
      displayError(toast, err);
    }

    data.activeSessions = data.activeSessions.filter((session) => session.id !== sessionId);
    data = Object.assign({}, data);

    toastSuccess(toast, 'Session deleted successfully');
  }
</script>

<SEO page={$page} title="User Settings" description="User settings" noIndex />
{#if showChangeDiscordPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Change Discord Account</span>
      <p>Are you sure you want to change the Discord account linked to Kyoso profile?</p>
      <div class="actions">
        <a class="btn variant-filled-primary" href={`/api/auth/change_discord?redirect_uri=${encodeURI($page.url.toString())}`}>Change Discord</a>
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
        <p>Are you sure you want to generate a new API key? This will make the current one obsolete (unusuable), which means you'll need to replace the current key in any code base or project that has it with the new one.</p>
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
  <div class="w-full max-w-[56rem]">
    <h1>User Settings</h1>
    <div class="line-b mt-4 mb-8" />
    <h2>Linked Accounts</h2>
    <p class="mt-2">The accounts linked to your Kyoso profile.</p>
    <div class="flex gap-4 mt-4 flex-wrap">
      <div class="card p-4 w-full sm:w-[calc(50%-0.5rem)] flex items-center">
        <div class="mr-2">
          <Osu w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <strong class="text-lg">{data.session.osu.username}</strong>
          <span class="text-sm"><strong>User ID:</strong> {data.session.osu.id}</span>
        </div>
      </div>
      <div class="card p-4 w-full sm:w-[calc(50%-0.5rem)] flex items-center">
        <div class="mr-2">
          <Discord w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <strong class="text-lg">{data.session.discord.username}</strong>
          <span class="text-sm"><strong>User ID:</strong> {data.session.discord.id}</span>
        </div>
      </div>
    </div>
    <div class="my-4 flex justify-start sm:justify-end">
      <button class="btn variant-filled-primary" on:click={toggleChangeDiscordPrompt}>Change Discord</button>
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
      <div class="p-4 card flex flex-col relative">
        <div class="flex gap-2 flex-wrap">
          {#if viewApiKey}
            <input type="text" class="input w-full xs:w-72" readonly bind:value={data.user.apiKey} />
          {:else}
            <input type="password" class="input w-full xs:w-72" readonly bind:value={data.user.apiKey} />
          {/if}
          <div class="flex gap-2">
            <button class="btn-icon variant-filled" on:click={toggleApiKeyVisibility}>
              {#if viewApiKey}
                <EyeOff size={24} />
              {:else}
                <Eye size={24} />
              {/if}
            </button>
            <button class="btn-icon variant-filled" on:click={copyApiKey}>
              <Copy size={24} />
            </button>
          </div>
        </div>
        <div>
          <button class="btn variant-filled-primary mt-4 md:mt-0 md:absolute md:top-4 md:right-4" on:click={toggleGenerateApiKeyPrompt}>
            Generate New Key
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
    <p class="dark:text-zinc-300 text-zinc-700 text-sm mt-4">Some details may be inaccurate.</p>
    <div class="mt-2 flex flex-col">
      {#each data.activeSessions as session}
        <Session {session} {deleteSession} current={data.session.sessionId === session.id} />
      {/each}
    </div>
  </div>
</main>
