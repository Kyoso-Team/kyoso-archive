<script lang="ts">
  // NOTE: Page needs to be slightly reworked after this PR gets merged: https://github.com/sveltejs/kit/pull/11810
  import User from './User.svelte';
  import BanUserForm from './BanUserForm.svelte';
  import RevokeBanForm from './RevokeBanForm.svelte';
  import LookedUpUser from './LookedUpUser.svelte';
  import createContextStore from './store';
  import { SEO } from '$components/general';
  import { Backdrop, Modal } from '$components/layout';
  import { page } from '$app/stores';
  import { displayError, formatNumber, toastError, toastSuccess } from '$lib/utils';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { onDestroy, onMount } from 'svelte';
  import { loading } from '$stores';
  import { trpc } from '$lib/clients';
  import { invalidate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Search } from 'lucide-svelte';
  import type { PageServerData } from './$types';
  import type { TRPCRouterIO } from '$types';

  export let data: PageServerData;
  let users: Record<'admins' | 'banned' | 'hosts' | 'owners', PageServerData['users']> = {
    admins: [],
    banned: [],
    hosts: [],
    owners: []
  };
  let userTypes: {
    typeLabel: string;
    type: 'admin' | 'host' | 'banned' | 'owner';
    description: string;
    nonFoundDescription: string;
    users: PageServerData['users'];
  }[] = [];
  let search: string | undefined;
  let searchBy = 'username';
  const toast = getToastStore();
  const ctx = createContextStore(toast, data.ownerId, data.isCurrentUserTheOwner);

  onMount(() => {
    if (!browser) return;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });

  function onKeyDown(e: KeyboardEvent) {
    if (!e.ctrlKey) return;
    ctx.changeCtrlStatus(true);
  }

  function onKeyUp() {
    ctx.changeCtrlStatus(false);
  }

  async function changeAdminStatus(userId: number, admin: boolean) {
    loading.set(true);

    try {
      await trpc($page).users.updateUser.mutate({
        userId,
        data: {
          admin
        }
      });
    } catch (err) {
      displayError(toast, err);
    }

    await invalidate($page.url.pathname);
    loading.set(false);

    ctx.toggleShowChangeAdminStatusPrompt();
    toastSuccess(toast, `${admin ? 'Granted' : 'Removed'} admin successfully`);

    if ($page.state.adminUsersPage?.lookedUpUser) {
      await ctx.lookupUser($page.state.adminUsersPage.lookedUpUser.id);
    }
  }

  async function changeHostStatus(userId: number, approvedHost: boolean) {
    loading.set(true);

    try {
      await trpc($page).users.updateUser.mutate({
        userId,
        data: {
          approvedHost
        }
      });
    } catch (err) {
      displayError(toast, err);
    }

    await invalidate($page.url.pathname);
    loading.set(false);

    ctx.toggleShowChangeHostStatusPrompt();
    toastSuccess(toast, `${approvedHost ? 'Approved' : 'Disapproved'} host successfully`);

    if ($page.state.adminUsersPage?.lookedUpUser) {
      await ctx.lookupUser($page.state.adminUsersPage.lookedUpUser.id);
    }
  }

  async function onSearchKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    await onSearch();
  }

  async function onSearch() {
    if (!search) return;

    let user: TRPCRouterIO['users']['searchUser'];
    loading.set(true);

    try {
      user = await trpc($page).users.searchUser.query({
        search,
        searchBy
      });
    } catch (err) {
      displayError(toast, err);
    }

    loading.set(false);

    if (!user) {
      toastError(toast, 'User not found');
      return;
    }

    await ctx.lookupUser(user.id);
  }

  function sortUser(a: PageServerData['users'][number], b: PageServerData['users'][number]) {
    return a.osu.username.localeCompare(b.osu.username);
  }

  $: {
    users = {
      owners: data.users.filter(({ osu }) => osu.osuUserId === data.ownerId),
      admins: data.users
        .filter(({ admin, osu }) => admin && osu.osuUserId !== data.ownerId)
        .sort(sortUser),
      hosts: data.users
        .filter(({ approvedHost, osu }) => approvedHost && osu.osuUserId !== data.ownerId)
        .sort(sortUser),
      banned: data.users.filter(({ banned }) => banned).sort(sortUser)
    };
  }

  $: {
    userTypes = [
      {
        typeLabel: 'Owner',
        type: 'owner',
        description: 'The website owner.',
        nonFoundDescription: '',
        users: users.owners
      },
      {
        typeLabel: 'Admins',
        type: 'admin',
        description: `All ${data.counts.admin} users with administrative permissions.`,
        nonFoundDescription: 'No users have administrative permissions.',
        users: users.admins
      },
      {
        typeLabel: 'Approved Hosts',
        type: 'host',
        description: `All ${data.counts.host} users who are approved to be able to create (and therefore, host) tournaments.`,
        nonFoundDescription:
          'No users are approved to be able to create (and therefore, host) tournaments.',
        users: users.hosts
      },
      {
        typeLabel: 'Banned Users',
        type: 'banned',
        description: `All ${data.counts.banned} users who are banned from using Kyoso and can no longer log in.`,
        nonFoundDescription: 'No users are currently banned.',
        users: users.banned
      }
    ];
  }

  $: {
    if (!$page.state.adminUsersPage?.lookedUpUser) {
      ctx.setShowLookedUpUser(false);
    }
  }
</script>

<SEO page={$page} title="Manage Users" description="Manage Kyoso users" noIndex />
{#if $ctx.showChangeAdminStatusPrompt && $ctx.selectedUser}
  <Backdrop zIndex="z-[21]">
    <Modal>
      {#if $ctx.selectedUser?.admin}
        <span class="title">Remove Admin</span>
        <p>Are you sure you want to remove admin permissions from this user?</p>
      {:else}
        <span class="title">Grant Admin</span>
        <p>
          Are you sure you want to grant admin permissions to this user? They'll be able to manage
          users, tournaments and more.
        </p>
      {/if}
      <div class="actions">
        <button
          class="btn variant-filled-primary"
          on:click={() => changeAdminStatus($ctx.selectedUser?.id || 0, !$ctx.selectedUser?.admin)}
        >
          {$ctx.selectedUser?.admin ? 'Remove' : 'Grant'}
        </button>
        <button class="btn variant-filled" on:click={ctx.toggleShowChangeAdminStatusPrompt}
          >Cancel</button
        >
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if $ctx.showChangeHostStatusPrompt && $ctx.selectedUser}
  <Backdrop zIndex="z-[21]">
    <Modal>
      {#if $ctx.selectedUser?.approvedHost}
        <span class="title">Disapprove Host</span>
        <p>Are you sure you want to remove tournament hosting permissions from this user?</p>
      {:else}
        <span class="title">Approve Host</span>
        <p>
          Are you sure you want to grant tournament hosting permissions to this user? They'll be
          able to host (create) tournaments.
        </p>
      {/if}
      <div class="actions">
        <button
          class="btn variant-filled-primary"
          on:click={() =>
            changeHostStatus($ctx.selectedUser?.id || 0, !$ctx.selectedUser?.approvedHost)}
        >
          {$ctx.selectedUser?.approvedHost ? 'Disapprove' : 'Approve'}
        </button>
        <button class="btn variant-filled" on:click={ctx.toggleShowChangeHostStatusPrompt}
          >Cancel</button
        >
      </div>
    </Modal>
  </Backdrop>
{/if}
{#if $ctx.showBanUserForm}
  <Backdrop zIndex="z-[21]">
    <BanUserForm {ctx} />
  </Backdrop>
{/if}
{#if $ctx.showRevokeBanForm}
  <Backdrop zIndex="z-[21]">
    <RevokeBanForm {ctx} />
  </Backdrop>
{/if}
{#if $ctx.showLookedUpUser}
  <Backdrop>
    <LookedUpUser {ctx} />
  </Backdrop>
{/if}
<main class="main flex justify-center">
  <div class="w-full max-w-5xl">
    <h1>Manage Users</h1>
    <div class="line-b mt-4 mb-8" />
    <h2>Users</h2>
    <p class="my-4">
      There {data.counts.total === 1 ? 'is 1 user' : `are ${formatNumber(data.counts.total)} users`}
      registered to Kyoso. Use the search bar below if you wish to look one up using either their osu!
      username, osu! user ID, Discord user ID or Kyoso user ID. Hold the
      <span class="badge variant-filled">Ctrl</span> key when hovering over users to search them up.
    </p>
    <div
      class="gap-2 flex flex-col md:grid md:grid-cols-[calc(60%-0.5rem)_40%] lg:grid-cols-[calc(70%-0.5rem)_30%]"
    >
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
        <div class="input-group-shim h-[42px]">
          <Search size={20} />
        </div>
        <input
          type="search"
          placeholder="Search user..."
          bind:value={search}
          on:keypress={onSearchKeyDown}
        />
        <button
          class="btn variant-filled-primary rounded-l-none"
          disabled={!search}
          on:click={onSearch}>Search</button
        >
      </div>
      <div class="input-group input-group-divider grid-cols-[auto_1fr]">
        <div class="input-group-shim h-[42px]">Search By</div>
        <select class="input text-sm py-1 px-2" bind:value={searchBy}>
          <option value="username">osu! Username</option>
          <option value="osu">osu! User ID</option>
          <option value="discord">Discord User ID</option>
          <option value="kyoso">Kyoso User ID</option>
        </select>
      </div>
    </div>
    {#each userTypes as { description, nonFoundDescription, type, typeLabel, users: userList }}
      <div class="line-b my-8" />
      <h2>{typeLabel}</h2>
      {#if userList.length === 0}
        <p class="mt-2">{nonFoundDescription}</p>
      {:else}
        <p class="mt-2">{description}</p>
        <div
          class="gap-2 mt-4 grid sm:w-[calc(100%-0.5rem)] sm:grid-cols-[50%_50%] lg:w-[calc(100%-1rem)] lg:grid-cols-[33.33%_33.34%_33.33%] 2lg:w-[calc(100%-1.5rem)] 2lg:grid-cols-[25%_25%_25%_25%]"
        >
          {#each userList as user}
            <User {ctx} {user} {type} isCurrentUserTheOwner={data.isCurrentUserTheOwner} />
          {/each}
        </div>
      {/if}
    {/each}
  </div>
</main>
