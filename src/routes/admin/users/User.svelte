<script lang="ts">
  import { Discord } from '$components/icons';
  import { X } from 'lucide-svelte';
  import { buildUrl } from 'osu-web.js';
  import { scale } from 'svelte/transition';
  import { trpc } from '$lib/trpc';
  import { page } from '$app/stores';
  import { displayError, toastSuccess } from '$lib/utils';
  import type { DiscordUser, OsuUser, User } from '$db';
  import type { ToastStore } from '@skeletonlabs/skeleton';

  export let user: Pick<typeof User.$inferSelect, 'id' | 'admin' | 'approvedHost'> & {
    banned: boolean;
    osu: Pick<typeof OsuUser.$inferSelect, 'osuUserId' | 'username'>;
    discord: Pick<typeof DiscordUser.$inferSelect, 'discordUserId' | 'username'>;
  };
  export let type: 'admin' | 'host' | 'banned' | 'owner';
  export let users: Record<'admins' | 'banned' | 'hosts' | 'owners', (typeof user)[]>;
  export let toast: ToastStore;
  export let isCurrentUserTheOwner: boolean;
  let hovering = false;

  function onMouseEnter() {
    hovering = true;
  }

  function onMouseLeave() {
    hovering = false;
  }

  async function onAction() {
    if (type === 'admin') {
      await removeAdmin();
    } else if (type === 'host') {
      await dissaproveHost();
    }
  }

  async function removeAdmin() {
    try {
      await trpc($page).users.updateUser.mutate({
        userId: user.id,
        data: {
          admin: false
        }
      });
    } catch (err) {
      displayError(toast, err);
    }

    users.admins = users.admins.filter(({ id }) => id !== user.id);
    users = Object.assign({}, users);

    toastSuccess(toast, 'Removed admin successfully');
  }

  async function dissaproveHost() {
    try {
      await trpc($page).users.updateUser.mutate({
        userId: user.id,
        data: {
          approvedHost: false
        }
      });
    } catch (err) {
      displayError(toast, err);
    }

    users.hosts = users.hosts.filter(({ id }) => id !== user.id);
    users = Object.assign({}, users);

    toastSuccess(toast, 'Disapproved host successfully');
  }

  async function unbanUser() {

  }
</script>

<div class="flex items-center p-2 gap-2 card w-72" role="presentation" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
  <img src={buildUrl.userAvatar(user.osu.osuUserId)} alt="user pfp" width={48} height={48} class="rounded-md" />
  <div class="overflow-hidden w-40">
    <a href={buildUrl.user(user.osu.osuUserId)} class="font-medium truncate block hover:opacity-75 duration-150">{user.osu.username}</a>
    <div class="flex gap-1 items-center">
      <Discord w={12} h={12} class="fill-black dark:fill-white" />
      <a href={`https://discordapp.com/users/${user.discord.discordUserId}`} class="truncate text-sm hover:opacity-75 duration-150">{user.discord.username}</a>
    </div>
  </div>
  {#if hovering && type !== 'owner' && (isCurrentUserTheOwner || !isCurrentUserTheOwner && type !== 'admin')}
    <div class="w-max" transition:scale={{ duration: 150, start: 0.5, opacity: 0 }}>
      <button class="btn-icon variant-filled-error" on:click={onAction}>
        <X size={24} />
      </button>
    </div>
  {/if}
</div>