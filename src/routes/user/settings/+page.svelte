<script lang="ts">
  import * as f from '$lib/form-validation';
  import Session from './Session.svelte';
  import { Checkbox } from '$components/form';
  import { SEO, FormHandler } from '$components/general';
  import { Backdrop, Modal } from '$components/layout';
  import { Osu, Discord } from '$components/icons';
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { createForm, loading } from '$stores';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { Copy, Eye, EyeOff, RotateCcw, Pencil } from 'lucide-svelte';
  import { displayError, toastSuccess } from '$lib/utils';
  import { slide } from 'svelte/transition';
  import { invalidate } from '$app/navigation';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let showChangeDiscordPrompt = false;
  let showGenerateApiKeyPrompt = false;
  let viewApiKey = false;
  const privacyForm = createForm(
    {
      publicDiscord: f.boolean(),
      publicStaffHistory: f.boolean(),
      publicPlayerHistory: f.boolean()
    },
    privacyFormInitialValues()
  );
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
    loading.set(true);

    try {
      await trpc($page).users.resetApiKey.mutate();
    } catch (err) {
      displayError(toast, err);
    }

    await invalidate('reload:user_settings');
    loading.set(false);

    showGenerateApiKeyPrompt = false;
    toastSuccess(toast, 'Generated new API key successfully');
  }

  function privacyFormInitialValues() {
    return {
      publicDiscord: data.user.settings.publicDiscord,
      publicStaffHistory: data.user.settings.publicStaffHistory,
      publicPlayerHistory: data.user.settings.publicPlayerHistory
    };
  }

  async function updatePrivacySettings() {
    const { publicDiscord, publicPlayerHistory, publicStaffHistory } =
      privacyForm.getFinalValue($privacyForm);
    loading.set(true);

    try {
      await trpc($page).users.updateSelf.mutate({
        settings: {
          publicDiscord,
          publicPlayerHistory,
          publicStaffHistory
        }
      });
    } catch (err) {
      displayError(toast, err);
    }

    await invalidate('reload:user_settings');
    loading.set(false);
    privacyForm.overrideInitialValues(privacyFormInitialValues());
    toastSuccess(toast, 'Updated privacy settings successfully');
  }

  async function resetPrivacySettings() {
    privacyForm.reset();
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
    <section>
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
            <span class="text-xs xs:text-sm"
              ><strong>User ID:</strong> {data.session.discord.id}</span
            >
          </div>
          <div class="absolute top-0 right-4 h-full flex items-center">
            <button class="btn-icon variant-filled" on:click={toggleChangeDiscordPrompt}>
              <Pencil size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
    <div class="line-b my-8" />
    <section>
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
            <input
              type="text"
              class="input w-full md:w-80"
              readonly
              bind:value={data.user.apiKey}
            />
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
    </section>
    <div class="line-b my-8" />
    <section>
      <h2>Privacy</h2>
      <div class="card mt-4 grid w-full md:grid-cols-[50%_50%] gap-4 p-4">
        <Checkbox
          form={privacyForm}
          label={privacyForm.labels.publicDiscord}
          legend="Make your Discord username public on your profile?"
        />
        <Checkbox
          form={privacyForm}
          label={privacyForm.labels.publicPlayerHistory}
          legend="Make your playing history public?"
        />
        <Checkbox
          form={privacyForm}
          label={privacyForm.labels.publicStaffHistory}
          legend="Make your staffing history public?"
        />
      </div>
      <FormHandler
        hasUpdated={$privacyForm.hasUpdated}
        onUpdate={updatePrivacySettings}
        disableUpdateBtn={!($privacyForm.hasUpdated && $privacyForm.canSubmit)}
        onReset={resetPrivacySettings}
      />
    </section>
    <div class="line-b my-8" />
    <section>
      <h2>Sessions</h2>
      <p class="text-surface-600-300-token text-sm mt-2">Some details may be inaccurate.</p>
      <div class="mt-4 flex flex-col gap-2">
        {#each data.activeSessions as session}
          <div transition:slide|global={{ duration: 150 }}>
            <Session {session} {deleteSession} current={data.session.sessionId === session.id} />
          </div>
        {/each}
      </div>
    </section>
  </div>
</main>
