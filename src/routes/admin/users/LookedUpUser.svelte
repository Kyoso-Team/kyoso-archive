<script lang="ts">
  import Ban from './Ban.svelte';
  import Session from './Session.svelte';
  import { Loader2, X } from 'lucide-svelte';
  import { buildUrl } from 'osu-web.js';
  import { fly } from 'svelte/transition';
  import { page } from '$app/stores';
  import { Discord, Osu } from '$lib/components/icons';
  import { formatDate, formatNumber, formatTime } from '$lib/format';
  import type createContextStore from './store';
  import type { Context } from './store';

  export let ctx: ReturnType<typeof createContextStore>;
  const now = new Date().getTime();

  async function onBanUser(user: Context['issueBanTo']) {
    ctx.setIssueBanTo(user);
    ctx.toggleShowBanUserForm();
  }

  async function onRevokeBan(ban: Context['banToRevoke']) {
    ctx.setBanToRevoke(ban);
    ctx.toggleShowRevokeBanForm();
  }

  $: user = $page.state.adminUsersPage?.lookedUpUser;
  $: activeBan = user?.bans.find(
    ({ liftAt, revokedAt }) =>
      (!liftAt && !revokedAt) || (liftAt && liftAt.getTime() > now && !revokedAt)
  );
  $: pastBans = (user?.bans || []).filter(({ id }) => id !== activeBan?.id);
  $: ctx.setSelectedUser(user);

  function close() {
    ctx.setShowLookedUpUser(false);
    history.back();
  }
</script>

<div class="info-modal" transition:fly={{ duration: 150, y: 100 }}>
  <button class="close-btn" on:click={close}>
    <X />
  </button>
  {#if !user}
    <div class="flex justify-center w-full">
      <Loader2 size={48} class="dark:stroke-white stroke-black animate-spin" />
    </div>
  {:else}
    <h2>User Information</h2>
    <div class="flex gap-4 mt-4 flex-wrap">
      <div class="flex flex-col items-center w-full sm:w-auto">
        <img
          src={buildUrl.userAvatar(user.osu.osuUserId)}
          alt="user pfp"
          width={96}
          height={96}
          class="rounded-md"
        />
        <div class="flex flex-col mt-2 gap-1">
          {#if user.owner}
            <span class="badge variant-filled-success">Site Owner</span>
          {/if}
          {#if user.admin}
            <span class="badge variant-filled-primary">Site Admin</span>
          {/if}
          {#if user.approvedHost}
            <span class="badge variant-filled">Approved Host</span>
          {/if}
          {#if activeBan}
            <span class="badge variant-filled-error">Banned</span>
          {/if}
        </div>
      </div>
      <div class="flex flex-col">
        <span class="text-lg"><strong>User ID: </strong>{user.id.toString()}</span>
        <div class="mt-2 flex flex-col gap-2 sm:gap-0">
          <div class="flex flex-col sm:block">
            <strong>Registered at:</strong>
            <span
              >{formatDate(user.registeredAt, 'shortened')} - {formatTime(user.registeredAt)}</span
            >
          </div>
          <div class="flex flex-col sm:block">
            <strong>Updated API data at:</strong>
            <span
              >{formatDate(user.updatedApiDataAt, 'shortened')} - {formatTime(
                user.updatedApiDataAt
              )}</span
            >
          </div>
          <div class="flex flex-col sm:block">
            <strong>Global osu! STD rank:</strong>
            <span>{user.osu.globalStdRank ? `#${formatNumber(user.osu.globalStdRank)}` : '-'}</span>
          </div>
        </div>
        {#if user.osu.restricted}
          <span class="badge mt-2 variant-filled-error w-max">Restricted on osu!</span>
        {/if}
        <div class="flex gap-2 mt-4 sm:mt-2 px-2 py-1">
          <img
            src={`https://osuflags.omkserver.nl/${user.country.code}.png`}
            alt="country flag"
            width={24}
            height={24}
          />
          <span>{user.country.name}</span>
        </div>
        <a
          href={buildUrl.user(user.osu.osuUserId)}
          class="flex py-1 px-2 items-center gap-2 rounded-md duration-150 hover:bg-zinc-700/10 dark:hover:bg-zinc-300/10 w-max"
        >
          <Osu w={20} h={20} class="dark:fill-white fill-black" />
          <span>{user.osu.username}</span>
        </a>
        <a
          href={`https://discordapp.com/users/${user.discord.discordUserId}`}
          class="flex py-1 px-2 items-center gap-2 rounded-md duration-150 hover:bg-zinc-700/10 dark:hover:bg-zinc-300/10 w-max"
        >
          <Discord w={20} h={20} class="dark:fill-white fill-black" />
          <span>{user.discord.username}</span>
        </a>
      </div>
    </div>
    {#if !user.owner && !activeBan}
      <div class="flex gap-2 flex-wrap mt-4">
        {#if $ctx.isCurrentUserTheOwner}
          {#if user.admin}
            <button
              class="btn variant-filled-error"
              on:click={ctx.toggleShowChangeAdminStatusPrompt}>Remove Admin</button
            >
          {:else}
            <button class="btn variant-filled" on:click={ctx.toggleShowChangeAdminStatusPrompt}
              >Grant Admin</button
            >
          {/if}
        {/if}
        {#if user.approvedHost}
          <button class="btn variant-filled-error" on:click={ctx.toggleShowChangeHostStatusPrompt}
            >Disapprove Host</button
          >
        {:else}
          <button class="btn variant-filled" on:click={ctx.toggleShowChangeHostStatusPrompt}
            >Approve Host</button
          >
        {/if}
      </div>
    {/if}
    <h2 class="mt-8">Bans</h2>
    {#if user.bans.length === 0}
      <p class="mt-2">This user hasn't been banned before.</p>
    {:else}
      {#if activeBan}
        <strong class="inline-block mt-4">Current Ban</strong>
        <div class="my-4">
          <Ban {ctx} ban={activeBan} active />
        </div>
        <button class="btn variant-filled-error w-max" on:click={() => onRevokeBan(activeBan)}
          >Revoke Ban</button
        >
      {/if}
      {#if pastBans.length > 0}
        <strong class="inline-block mt-4">Past Bans</strong>
        <div class="flex flex-col gap-4 mt-4">
          {#each pastBans as ban}
            <Ban {ctx} {ban} />
          {/each}
        </div>
      {/if}
    {/if}
    {#if !activeBan && user.osu.osuUserId !== $ctx.ownerId}
      <button class="btn variant-filled-error w-max mt-4" on:click={() => onBanUser(user)}
        >Ban User</button
      >
    {/if}
    <h2 class="mt-8">Sessions</h2>
    <strong class="inline-block mt-4">Active</strong>
    {#if user.sessions.active.length === 0}
      <p class="mt-2">This user has no active sessions.</p>
    {:else}
      <div class="mt-4 flex flex-col gap-2">
        {#each user.sessions.active as session}
          <Session {session} />
        {/each}
      </div>
    {/if}
    <strong class="inline-block mt-4">Expired</strong>
    {#if user.sessions.expired.length === 0}
      <p class="mt-2">This user has no expired sessions.</p>
    {:else}
      <p class="text-sm dark:text-zinc-300/75 text-zinc-700/75">
        Only showing the last 30 expired sessions.
      </p>
      <div class="mt-4 flex flex-col gap-2">
        {#each user.sessions.expired as session}
          <Session {session} />
        {/each}
      </div>
    {/if}
  {/if}
</div>
