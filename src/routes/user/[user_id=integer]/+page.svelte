<script lang="ts">
  import Ban from './Ban.svelte';
  import KyosoBadges from './KyosoBadges.svelte';
  import BanUserForm from './BanUserForm.svelte';
  import RevokeBanForm from './RevokeBanForm.svelte';
  import { Discord, OsuCatch, OsuMania, OsuStandard, OsuTaiko } from '$lib/components/icons';
  import { Tooltip, SEO } from '$lib/components/general';
  import { Backdrop, Modal } from '$lib/components/layout';
  import { buildUrl } from 'osu-web.js';
  import { displayError, formatDate, formatNumber, toastSuccess, tooltip } from '$lib/utils';
  import { popup } from '$lib/popup';
  import { loading } from '$lib/stores';
  import { trpc } from '$lib/clients';
  import { page } from '$app/stores';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { invalidate } from '$app/navigation';
  import type { SvelteComponent } from 'svelte';
  import type { TRPCRouterOutputs } from '$lib/types';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let showBanUserModal = false;
  let showRevokeBanModal = false;
  let showBanUserForm = false;
  let showRevokeBanForm = false;
  let procedure:
    | keyof Pick<
        TRPCRouterOutputs['users'],
        'makeAdmin' | 'removeAdmin' | 'makeApprovedHost' | 'removeApprovedHost'
      >
    | undefined;
  let kyosoBadges: {
    label: string;
    description: string;
    tooltipName: string;
    variant: string;
    show: boolean;
  }[] = [];
  let rankings: {
    label: string;
    tooltipName: string;
    rank: number | null;
    icon: typeof SvelteComponent<any>;
  }[] = [];
  const toast = getToastStore();

  function viewAsAdmin(
    user: typeof data.user
  ): user is Extract<typeof data.user, { viewAsAdmin: true }> {
    return user.viewAsAdmin;
  }

  function viewAsCurrent(
    user: typeof data.user
  ): user is Extract<typeof data.user, { isCurrent: true }> {
    return user.isCurrent;
  }

  function viewAsPublicDiscord(
    user: typeof data.user
  ): user is Extract<typeof data.user, { settings: { publicDiscord: true } }> {
    return user.settings.publicDiscord;
  }

  async function updateUser() {
    if (!procedure) return;
    loading.set(true);

    try {
      await trpc($page).users[procedure].mutate({
        userId: data.user.id
      });
    } catch (err) {
      displayError(toast, err);
    }

    await invalidate('reload:user');
    procedure = undefined;
    loading.set(false);
    toastSuccess(toast, 'Updated user successfully');
  }

  function makeUserAdmin() {
    procedure = 'makeAdmin';
  }

  function removeUserAdmin() {
    procedure = 'removeAdmin';
  }

  function makeUserApprovedHost() {
    procedure = 'makeApprovedHost';
  }

  function removeUserApprovedHost() {
    procedure = 'removeApprovedHost';
  }

  function toggleUpdateUserPrompt() {
    procedure = undefined;
  }

  function toggleShowBanUserModal() {
    showBanUserModal = !showBanUserModal;
  }

  function toggleShowRevokeBanModal() {
    showRevokeBanModal = !showRevokeBanModal;
  }

  function toggleShowBanUserForm() {
    showBanUserForm = !showBanUserForm;
    showBanUserModal = false;
  }

  function toggleShowRevokeBanForm() {
    showRevokeBanForm = !showRevokeBanForm;
    showRevokeBanModal = false;
  }

  $: kyosoBadges = [
    {
      label: 'Owner',
      description: 'Owner of Kyoso',
      tooltipName: 'tooltip-owner',
      variant: 'variant-soft-indigo',
      show: data.user.owner
    },
    {
      label: 'Admin',
      description: 'Website admin',
      tooltipName: 'tooltip-admin',
      variant: 'variant-soft-blue',
      show: data.user.admin
    },
    {
      label: 'Host',
      description: 'Approved host',
      tooltipName: 'tooltip-host',
      variant: 'variant-soft-teal',
      show: data.user.approvedHost
    },
    {
      label: 'Banned',
      description: 'Banned from using Kyoso services',
      tooltipName: 'tooltip-banned',
      variant: 'variant-soft-red',
      show: !!data.user.activeBan
    }
  ];
  $: rankings = [
    {
      label: 'osu! standard global rank',
      tooltipName: 'tooltip-standard-rank',
      rank: data.user.osu.globalStdRank,
      icon: OsuStandard
    },
    {
      label: 'osu! taiko global rank',
      tooltipName: 'tooltip-taiko-rank',
      rank: data.user.osu.globalTaikoRank,
      icon: OsuTaiko
    },
    {
      label: 'osu! catch global rank',
      tooltipName: 'tooltip-catch-rank',
      rank: data.user.osu.globalCatchRank,
      icon: OsuCatch
    },
    {
      label: 'osu! mania global rank',
      tooltipName: 'tooltip-mania-rank',
      rank: data.user.osu.globalManiaRank,
      icon: OsuMania
    }
  ];
</script>

<SEO
  page={$page}
  title={`${data.user.osu.username} - User Profile`}
  description={`User profile and information for ${data.user.osu.username} on osu!`}
/>
{#if procedure}
  <Backdrop>
    <Modal>
      <span class="title"
        >{procedure.includes('make') ? 'Make' : 'Remove'}
        {procedure.includes('Admin') ? 'Admin' : 'Approved Host'}</span
      >
      <p>
        Are you sure you want to update this user and {procedure.includes('make')
          ? 'grant them additional permissions'
          : 'remove some of their permissions'}?
      </p>
      <div class="actions">
        <button class="btn variant-filled-primary" on:click={updateUser}>Update</button>
        <button class="btn variant-filled" on:click={toggleUpdateUserPrompt}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showBanUserModal}
  <Backdrop>
    <Modal>
      <span class="title">Ban User</span>
      <p>
        Are you sure you want to ban this user? This will deny the user from accessing any of
        Kyoso's services and causes many other destructive actions tied to this user.
      </p>
      <div class="actions">
        <button class="btn variant-filled-error" on:click={toggleShowBanUserForm}>Next</button>
        <button class="btn variant-filled" on:click={toggleShowBanUserModal}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showRevokeBanModal}
  <Backdrop>
    <Modal>
      <span class="title">Revoke Ban</span>
      <p>
        Are you sure you want to revoke this user's ban? This will grant the user access to Kyoso's
        services again.
      </p>
      <div class="actions">
        <button class="btn variant-filled-error" on:click={toggleShowRevokeBanForm}>Next</button>
        <button class="btn variant-filled" on:click={toggleShowBanUserModal}>Cancel</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if showBanUserForm}
  <Backdrop>
    <BanUserForm issuedToUserId={data.user.id} bind:show={showBanUserForm} />
  </Backdrop>
{/if}
{#if showRevokeBanForm}
  <Backdrop>
    <RevokeBanForm banId={data.user.activeBan?.id || 0} bind:show={showRevokeBanForm} />
  </Backdrop>
{/if}
<main class="main flex justify-center">
  <div class="w-full max-w-5xl">
    <h1>User Profile</h1>
    <div class="line-b mt-4 mb-8" />
    <section>
      <div class="card p-4 flex flex-col gap-4">
        <div class="flex gap-4">
          <div>
            <div class="card bg-surface-200-700-token overflow-hidden w-max">
              <img
                src={buildUrl.userAvatar(data.user.osu.osuUserId)}
                alt="user-pfp"
                width={96}
                height={96}
                class="max-2sm:w-20 max-2sm:h-20"
              />
            </div>
          </div>
          <div class="flex flex-col">
            <div class="flex gap-4 items-center">
              <h3>
                <a
                  class="hover:text-primary-500 duration-150"
                  href={buildUrl.user(data.user.osu.osuUserId)}>{data.user.osu.username}</a
                >
              </h3>
              <div class="gap-1 h-max hidden md:flex">
                <KyosoBadges {kyosoBadges} />
              </div>
            </div>
            {#if viewAsAdmin(data.user) || viewAsCurrent(data.user) || viewAsPublicDiscord(data.user)}
              <div class="flex gap-1 items-center text-sm">
                <Discord w={16} h={16} class="fill-surface-600 dark:fill-surface-300" />
                <span class="block text-surface-600-300-token">{data.user.discord.username}</span>
              </div>
            {/if}
            <div class="flex gap-1 md:gap-2 mt-1 items-center flex-wrap">
              <button class="cursor-default" use:popup={tooltip('tooltip-country')}>
                <img
                  src={`https://osuflags.omkserver.nl/${data.user.country.code}.png`}
                  alt="country-flag"
                  width={24}
                  height={24}
                />
              </button>
              <Tooltip
                target="tooltip-country"
                label={data.user.country.name}
                visibility="block md:hidden"
              />
              <KyosoBadges {kyosoBadges} class="flex md:hidden" responsive />
              <span class="hidden md:block">{data.user.country.name}</span>
            </div>
          </div>
        </div>
        {#if data.user.badges.length > 0}
          <div class="line-b" />
          <div class="flex flex-wrap gap-2">
            {#each data.user.badges as { awardedAt, description, imgFileName }, i}
              <button
                class="cursor-default [&>*]:pointer-events-none"
                use:popup={tooltip(`tooltip-badge-${i.toString()}`)}
              >
                <img
                  src={`https://assets.ppy.sh/profile-badges/${imgFileName}`}
                  alt={description}
                  width={86}
                  height={40}
                />
              </button>
              <Tooltip target={`badge-${i.toString()}`} label={description || ''}>
                <span class="text-primary-500 block">{formatDate(awardedAt, 'full')}</span>
              </Tooltip>
            {/each}
          </div>
        {/if}
        <div class="line-b" />
        <div class="grid 2sm:grid-cols-2 2md:grid-cols-4 gap-2">
          {#if data.user.osu.restricted}
            <div class="card variant-soft-error 2md:col-span-4 p-2 font-medium text-center">
              This user is restricted on osu!
            </div>
          {/if}
          {#each rankings as { label, tooltipName, rank, icon }}
            <button
              class="card bg-surface-200-700-token p-4 text-lg w-full cursor-default flex gap-2 items-center [&>*]:pointer-events-none"
              use:popup={tooltip(tooltipName)}
            >
              <svelte:component this={icon} size={32} />
              {rank ? `#${formatNumber(rank)}` : '-'}
            </button>
            <Tooltip target={tooltipName} {label} />
          {/each}
        </div>
        <div class="line-b" />
        <div class="flex gap-2 flex-wrap">
          <span class="block badge variant-soft-surface"
            >Joined on {formatDate(data.user.registeredAt, 'full')}</span
          >
          {#if viewAsAdmin(data.user)}
            <span class="block badge variant-soft-surface"
              >Updated API data on {formatDate(data.user.updatedApiDataAt, 'full')}</span
            >
          {/if}
        </div>
        {#if !data.user.owner && (data.isSessionUserOwner || data.session?.admin) && !data.user.activeBan}
          <div class="line-b" />
          <div class="flex gap-2 flex-wrap">
            {#if data.isSessionUserOwner}
              {#if data.user.admin}
                <button class="btn variant-filled-error" on:click={removeUserAdmin}
                  >Remove Admin</button
                >
              {:else}
                <button class="btn variant-filled" on:click={makeUserAdmin}>Make Admin</button>
              {/if}
            {/if}
            {#if data.user.approvedHost}
              <button class="btn variant-filled-error" on:click={removeUserApprovedHost}
                >Remove Approved Host</button
              >
            {:else}
              <button class="btn variant-filled" on:click={makeUserApprovedHost}
                >Make Approved Host</button
              >
            {/if}
          </div>
        {/if}
      </div>
    </section>
    <div class="line-b my-8" />
    <section>
      <h2>Bans</h2>
      <div class="card p-4 flex flex-col gap-4 mt-4">
        {#if data.user.pastBans.length === 0 && !data.user.activeBan}
          <span class="text-surface-600-300-token">This user hasn't been banned before.</span>
        {:else}
          {#if data.user.activeBan}
            <span class="text-lg font-medium block">Current Ban</span>
            <Ban ban={data.user.activeBan} showUsers={data.user.viewAsAdmin} />
            <div>
              <button class="btn variant-filled-error" on:click={toggleShowRevokeBanModal}
                >Revoke Ban</button
              >
            </div>
          {/if}
          {#if data.user.activeBan && data.user.pastBans.length > 0}
            <div class="line-b" />
          {/if}
          {#each data.user.pastBans as ban}
            <Ban {ban} showUsers={data.user.viewAsAdmin} />
          {/each}
        {/if}
        {#if data.user.viewAsAdmin && !data.user.activeBan}
          <div>
            <button class="btn variant-filled-error" on:click={toggleShowBanUserModal}
              >Ban User</button
            >
          </div>
        {/if}
      </div>
    </section>
  </div>
</main>
