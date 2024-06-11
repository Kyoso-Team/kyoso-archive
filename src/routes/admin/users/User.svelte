<script lang="ts">
  import { Discord } from '$components/icons';
  import { X, Search } from 'lucide-svelte';
  import { buildUrl } from 'osu-web.js';
  import { scale } from 'svelte/transition';
  import type createContextStore from './store';
  import type { PageServerData } from './$types';

  export let user: PageServerData['users'][number];
  export let type: 'admin' | 'host' | 'banned' | 'owner';
  export let isCurrentUserTheOwner: boolean;
  export let ctx: ReturnType<typeof createContextStore>;
  let hovering = false;

  function onMouseEnter() {
    hovering = true;
  }

  function onMouseLeave() {
    hovering = false;
  }

  function onAction() {
    ctx.setSelectedUser(user);

    if (type === 'admin') {
      ctx.toggleShowChangeAdminStatusPrompt();
    } else {
      ctx.toggleShowChangeHostStatusPrompt();
    }
  }

  async function onLookupUser() {
    await ctx.lookupUser(user.id);
  }

  $: showRemoveBtn =
    hovering &&
    type !== 'owner' &&
    type !== 'banned' &&
    (isCurrentUserTheOwner || (!isCurrentUserTheOwner && type !== 'admin'));
  $: showSearchBtn = hovering && $ctx.ctrl;
</script>

<div
  class="flex items-center p-2 gap-2 card w-full"
  role="presentation"
  on:mouseenter={onMouseEnter}
  on:mouseleave={onMouseLeave}
>
  <img
    src={buildUrl.userAvatar(user.osu.osuUserId)}
    alt="user pfp"
    width={48}
    height={48}
    class="rounded-md"
  />
  <div class="overflow-hidden w-[calc(100%-43px)]">
    <a
      href={buildUrl.user(user.osu.osuUserId)}
      class="font-medium truncate block hover:opacity-75 duration-150 w-max">{user.osu.username}</a
    >
    <div class="flex gap-1 items-center">
      <Discord w={12} h={12} class="fill-black dark:fill-white min-h-3 min-w-3" />
      <a
        href={`https://discordapp.com/users/${user.discord.discordUserId}`}
        class="truncate text-sm hover:opacity-75 duration-150 w-max">{user.discord.username}</a
      >
    </div>
  </div>
  {#if showRemoveBtn || showSearchBtn}
    <div
      class="w-[43px] h-[43px] relative"
      transition:scale={{ duration: 150, start: 0.5, opacity: 0 }}
    >
      {#if showSearchBtn}
        <button
          class="btn-icon variant-filled absolute right-0 top-0"
          transition:scale={{ duration: 150, start: 0.5, opacity: 0 }}
          on:click={onLookupUser}
        >
          <Search size={20} />
        </button>
      {:else if showRemoveBtn}
        <button
          class="btn-icon variant-filled-error absolute right-0 top-0"
          transition:scale={{ duration: 150, start: 0.5, opacity: 0 }}
          on:click={onAction}
        >
          <X size={20} />
        </button>
      {/if}
    </div>
  {/if}
</div>
