<script lang="ts">
  import Session from './Session.svelte';
  import { Copy, Eye, EyeOff, Pencil, RotateCcw } from 'lucide-svelte';
  import { slide } from 'svelte/transition';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { trpc } from '$lib/clients';
  import { Checkbox } from '$lib/components/form';
  import { SEO, Note } from '$lib/components/general';
  import { Discord, Osu } from '$lib/components/icons';
  import { Backdrop, Modal } from '$lib/components/layout';
  import * as f from '$lib/form/validation';
  import { createForm, createToggle, loading, toast } from '$lib/stores';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  const showChangeDiscordPrompt = createToggle(false);
  const showGenerateApiKeyPrompt = createToggle(false);
  const showApiKey = createToggle(false);
  const privacyForm = createForm(
    {
      publicDiscord: f.boolean(),
      publicStaffHistory: f.boolean(),
      publicPlayerHistory: f.boolean()
    },
    privacyFormInitialValues()
  );
  const labels = privacyForm.labels;

  async function copyApiKey() {
    await navigator.clipboard.writeText(data.user.apiKey || '');
    toast.success('API key copied to clipboard');
  }

  async function generateApiKey() {
    loading.set(true);
    await trpc($page).users.resetApiKey.mutate().catch(toast.errorCatcher);

    await invalidate('reload:user_settings');
    showGenerateApiKeyPrompt.set(false);
    toast.success('Generated new API key successfully');
  }

  function privacyFormInitialValues() {
    return data.user.settings;
  }

  async function updatePrivacySettings() {
    loading.set(true);
    const { publicDiscord, publicPlayerHistory, publicStaffHistory } =
      privacyForm.getFinalValue($privacyForm);

    await trpc($page)
      .users.updateSelf.mutate({
        settings: {
          publicDiscord,
          publicPlayerHistory,
          publicStaffHistory
        }
      })
      .catch(toast.errorCatcher);

    await invalidate('reload:user_settings');
    privacyForm.overrideInitialValues(privacyFormInitialValues());
    toast.success('Updated privacy settings successfully');
  }

  async function resetPrivacySettings() {
    privacyForm.reset();
  }

  async function deleteSession(sessionId: number) {
    loading.set(true);
    await trpc($page)
      .users.expireSession.mutate({
        sessionId
      })
      .catch(toast.errorCatcher);

    data.activeSessions = data.activeSessions.filter((session) => session.id !== sessionId);
    data = Object.assign({}, data);
    toast.success('Session deleted successfully');
  }
</script>

<SEO page={$page} title="User Settings" description="Update your user settings" noIndex />
{#if $showChangeDiscordPrompt}
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
        <button class="btn variant-filled" on:click={showChangeDiscordPrompt.false$}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if $showGenerateApiKeyPrompt}
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
        <button class="btn variant-filled" on:click={showGenerateApiKeyPrompt.false$}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
<main class="main justify-center">
  <div class="page-content">
    <h1>User Settings</h1>
    <div class="line-b" />
    <section>
      <h2>Linked Accounts</h2>
      <p>The accounts linked to your Kyoso profile.</p>
      <div class="gap-2 grid 2md:w-[calc(100%-1rem)] 2md:grid-cols-[50%_50%]">
        <div class="card flex items-center relative">
          <div class="mr-4">
            <Osu w={48} h={48} class="fill-black dark:fill-white" />
          </div>
          <div class="flex flex-col">
            <strong class="text-lg">{data.session.osu.username}</strong>
            <span class="text-xs xs:text-sm"><strong>User ID:</strong> {data.session.osu.id}</span>
          </div>
        </div>
        <div class="card flex items-center relative">
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
            <button class="btn-icon variant-filled" on:click={showChangeDiscordPrompt.toggle}>
              <Pencil size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
    <div class="line-b" />
    <section>
      <h2>API Key</h2>
      <p>
        <!-- TODO: Link anchor to docs-->
        This key allows you to make requests to the <a href="/" class="link">Kyoso API</a>.
        {#if data.user.apiKey}
          <strong class="text-error-500">DO NOT SHARE THIS KEY WITH ANYONE.</strong>
        {:else}
          <span>Start by creating your first key.</span>
        {/if}
      </p>
      {#if data.user.apiKey}
        <div class="card flex max-2sm:flex-col relative">
          {#if $showApiKey}
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
            <button class="btn-icon variant-filled" on:click={showApiKey.toggle}>
              {#if $showApiKey}
                <EyeOff size={20} />
              {:else}
                <Eye size={20} />
              {/if}
            </button>
            <button class="btn-icon variant-filled" on:click={copyApiKey}>
              <Copy size={20} />
            </button>
            <button class="btn-icon variant-filled-primary" on:click={showGenerateApiKeyPrompt.true$}>
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      {:else}
        <div>
          <button class="btn variant-filled-primary" on:click={showGenerateApiKeyPrompt.true$}>
            Generate Key
          </button>
        </div>
      {/if}
    </section>
    <div class="line-b" />
    <section>
      <h2>Privacy</h2>
      <p>Control the visibility and obtainability of certain details about your profile.</p>
      <div class="card flex flex-col">
        <Checkbox
          form={privacyForm}
          label={labels.publicDiscord}
          legend="Public Discord username?"
        >
          If enabled, everyone will be able to see your Discord username on your profile; otherwise, only you, website admins and tournament hosts and admins will be able to see it.
        </Checkbox>
        <Checkbox
          form={privacyForm}
          label={labels.publicPlayerHistory}
          legend="Public player history?"
        >
          If enabled, everyone will be able to see your player history on your profile; otherwise, only you will be able to see it.
        </Checkbox>
        <Checkbox
          form={privacyForm}
          label={labels.publicStaffHistory}
          legend="Public staff history?"
        >
          If enabled, everyone will be able to see your player history on your profile; otherwise, only you will be able to see it.
        </Checkbox>
      </div>
      <div class="mt-4 relative">
        <div class="flex w-full gap-2">
          <button class="btn variant-filled-primary" disabled={!($privacyForm.hasUpdated && $privacyForm.canSubmit)} on:click={updatePrivacySettings}
            >Update</button
          >
          <button
            class="btn variant-filled hidden 2md:block"
            disabled={!$privacyForm.hasUpdated}
            on:click={resetPrivacySettings}
          >
            Reset
          </button>
        </div>
        <div class="absolute -top-[9px] right-0">
          <Note type="warning" show={$privacyForm.hasUpdated}>
            You have unsaved changes.
          </Note>
        </div>
      </div>
    </section>
    <div class="line-b" />
    <section>
      <h2>Sessions</h2>
      <p>A list of sessions that are currently active. Some details about them may be inaccurate.</p>
      <div class="flex flex-col gap-2">
        {#each data.activeSessions as session}
          <div transition:slide|global={{ duration: 150 }}>
            <Session {session} {deleteSession} current={data.session.sessionId === session.id} />
          </div>
        {/each}
      </div>
    </section>
  </div>
</main>
