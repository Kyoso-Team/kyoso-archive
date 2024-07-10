<script lang="ts">
  import UserMenu from './UserMenu.svelte';
  import { Bell } from 'lucide-svelte';
  import { AppBar, Avatar, popup } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';
  import { page } from '$app/stores';
  import { KyosoHybrid } from '$components/icons';
  import { Menu } from 'lucide-svelte';
  import type { AuthSession } from '$types';

  export let session: AuthSession | undefined;
  export let unreadNotificationCount: number;
  const navLinks = [
    {
      href: 'dashboard',
      label: 'Dashboard'
    },
    {
      href: 'tournaments',
      label: 'Tournaments'
    },
    {
      href: 'blog',
      label: 'Blog'
    }
  ];
</script>

<AppBar padding="py-3 px-6 line-b">
  <svelte:fragment slot="lead">
    <nav class="flex items-center gap-2">
      <a href="/" class="mr-4 duration-150 hover:opacity-75">
        <KyosoHybrid h={28} class="fill-black dark:fill-white" />
      </a>
      <div class="gap-2 hidden md:flex">
        {#if session?.admin}
          <a href="/admin" class="btn hover:variant-soft-primary">Admin</a>
        {/if}
        {#each navLinks as { href, label }}
          <a href={`/${href}`} class="btn hover:variant-soft-primary">{label}</a>
        {/each}
      </div>
      <div class="block md:hidden">
        <button
          class="btn-icon variant-soft-surface"
          use:popup={{
            event: 'click',
            placement: 'bottom',
            target: 'responsive-links',
            middleware: {
              offset: 24
            }
          }}
        >
          <Menu size={24} class="stroke-white" />
        </button>
      </div>
      <div class="card absolute p-2 shadow-md" data-popup="responsive-links">
        <!-- Without this container, flex-col doesn't work -->
        <div class="flex gap-2 flex-col">
          {#if session?.admin}
            <a href="/admin" class="btn hover:variant-soft-primary">Admin</a>
          {/if}
          {#each navLinks as { href, label }}
            <a href={`/${href}`} class="btn hover:variant-soft-primary">{label}</a>
          {/each}
        </div>
      </div>
    </nav>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <div class="flex justify-center gap-2">
      {#if session}
        <button class="relative btn-icon hover:variant-soft-primary">
          {#await unreadNotificationCount}
            <span class="hidden" />
          {:then count}
            <span class="badge absolute top-0 right-0 tracking-tighter z-[2] variant-filled-primary rounded-full w-6 h-6">
              {count > 9 ? '9+' : count}
            </span>
          {/await}
          <Bell size={24} class="stroke-black fill-black dark:stroke-white dark:fill-white !ml-0" />
        </button>
        <button
          use:popup={{
            event: 'click',
            placement: 'bottom-end',
            target: 'main-user-menu',
            middleware: {
              offset: 24
            }
          }}
        >
          <Avatar src={buildUrl.userAvatar(session.osu.id)} width="w-10" cursor="cursor-pointer" />
        </button>
        <UserMenu popupName="main-user-menu" {session} />
      {:else}
        <a
          href={`/api/auth/login?redirect_uri=${encodeURI($page.url.toString())}`}
          class="variant-filled-primary btn">Log In</a
        >
      {/if}
    </div>
  </svelte:fragment>
</AppBar>
