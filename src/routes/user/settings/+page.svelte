<script lang="ts">
  import { SEO } from '$components/general';
  import { Backdrop, Modal } from '$components/layout';
  import { Osu, Discord } from '$components/icons';
  import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Copy, Eye, EyeOff } from 'lucide-svelte';
  import { TRPCClientError } from '@trpc/client';
  import { toastError, toastSuccess } from '$lib/utils';
  import type { Router } from '$trpc/router';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let openChangeDiscordPrompt = false;
  let regenerateApiKeyPrompt = false;
  let viewApiKey = false;
  const toast = getToastStore();

  function toggleChangeDiscordPrompt() {
    openChangeDiscordPrompt = !openChangeDiscordPrompt;
  }

  function toggleRegenerateApiKeyPrompt() {
    regenerateApiKeyPrompt = !regenerateApiKeyPrompt;
  }

  function toggleApiKeyVisibility() {
    viewApiKey = !viewApiKey;
  }

  async function copyApiKey() {
    await navigator.clipboard.writeText(data.user.apiKey);
    toastSuccess(toast, 'API key copied to clipboard');
  }

  async function regenerateApiKey() {
    let user!: Router['users']['updateSelf']['_def']['_output_out'];

    try {
      user = await trpc($page).users.updateSelf.mutate();
    } catch (err) {
      if (err instanceof TRPCClientError) {
        toastError(toast, err.message);
      } else {
        toastError(toast, 'An unknown error ocurred');
      }

      return;
    }

    data.user = {
      ...data.user,
      apiKey: user.apiKey
    };
    data = Object.assign({}, data);

    toastSuccess(toast, 'New API key generated successfully');
    regenerateApiKeyPrompt = false;
  }
</script>

<SEO page={$page} title="User Settings - Kyoso" description="User settings" noIndex />
{#if openChangeDiscordPrompt}
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
{#if regenerateApiKeyPrompt}
  <Backdrop>
    <Modal>
      <span class="title">Generate New API Key</span>
      <p>Are you sure you want to generate a new API key? This will make the current one obsolete (unusuable), which means you'll need to replace the current key in any code base or project that has it with the new one.</p>
      <div class="actions">
        <button class="btn variant-filled-primary" on:click={regenerateApiKey}>Generate</button>
        <button class="btn variant-filled" on:click={toggleRegenerateApiKeyPrompt}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
<div class="m-12 flex justify-center">
  <div class="w-[48rem]">
    <h1>User Settings</h1>
    <div class="border-b border-surface-700 mt-4 mb-8" />
    <h2>Accounts</h2>
    <p class="mt-2">The accounts linked to your Kyoso profile.</p>
    <div class="flex gap-4 mt-4 flex-wrap">
      <div class="card p-4 w-full sm:w-[calc(50%-0.5rem)] flex items-center">
        <div class="mr-2">
          <Osu w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-lg font-medium">{data.user.osu.username}</span>
          <span class="text-sm"><span class="font-medium">User ID:</span> {data.user.osu.id}</span>
        </div>
      </div>
      <div class="card p-4 w-full sm:w-[calc(50%-0.5rem)] flex items-center">
        <div class="mr-2">
          <Discord w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-lg font-medium">{data.user.discord.username}</span>
          <span class="text-sm"><span class="font-medium">User ID:</span> {data.user.discord.id}</span>
        </div>
      </div>
    </div>
    <div class="my-4 flex justify-start sm:justify-end">
      <button class="btn variant-filled-primary" on:click={toggleChangeDiscordPrompt}>Change Discord</button>
    </div>
    <div class="border-b border-surface-700 my-8" />
    <h2>API Key</h2>
    <!-- TODO: Link anchor to docs-->
    <p class="mt-2">This key allows you to make requests to the <a href="/" class="link">Kyoso API</a>. <span class="text-error-500">DO NOT SHARE THIS KEY WITH ANYONE.</span></p>
    <div class="mt-4 p-4 card flex flex-col relative">
      <div class="flex gap-2">
        {#if viewApiKey}
          <input type="text" class="input w-72" readonly bind:value={data.user.apiKey} />
        {:else}
          <input type="password" class="input w-72" readonly bind:value={data.user.apiKey} />
        {/if}
        <button class="btn-icon variant-filled-secondary" on:click={toggleApiKeyVisibility}>
          {#if viewApiKey}
            <EyeOff size={20} class="stroke-white dark:stroke-black" />
          {:else}
            <Eye size={20} class="stroke-white dark:stroke-black" />
          {/if}
        </button>
        <button class="btn-icon variant-filled-secondary" on:click={copyApiKey}>
          <Copy size={20} class="stroke-white dark:stroke-black" />
        </button>
      </div>
      <div>
        <button class="btn variant-filled-primary mt-4 md:mt-0 md:absolute md:top-4 md:right-4" on:click={toggleRegenerateApiKeyPrompt}>
          Generate New Key
        </button>
      </div>
    </div>
  </div>
</div>
