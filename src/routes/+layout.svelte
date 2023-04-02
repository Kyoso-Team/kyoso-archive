<script lang="ts">
  import '../theme.css';
  import '@skeletonlabs/skeleton/styles/all.css';
  import env from '$lib/env/client';
  import { setInitialClassState } from '@skeletonlabs/skeleton';
  import { AppShell, AppBar, Avatar } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';
  import { goto } from '$app/navigation';
  import type { LayoutServerData } from './$types';

  export let data: LayoutServerData;
  let showUserMenu = false;
  const authUrl = buildUrl.authRequest(env.PUBLIC_OSU_CLIENT_ID, env.PUBLIC_OSU_REDIRECT_URI, [
    'identify',
    'public'
  ]);
  const navLinks = [
    {
      href: 'dashboard',
      label: 'Dashboard'
    },
    {
      href: 'tournaments',
      label: 'Tournaments'
    }
  ];

  async function onLogoutClick() {
    goto('/auth/logout');
  }

  function onUserAvatarClick() {
    showUserMenu = !showUserMenu;
  }
</script>

<svelte:head>
  {@html `<script>(${setInitialClassState.toString()})();</script>`}
</svelte:head>
<AppShell>
  <svelte:fragment slot="header">
    <AppBar padding="p-3">
      <svelte:fragment slot="lead">
        <nav class="flex gap-2">
          {#each navLinks as { href, label }}
            <a href={`/${href}`} class="btn hover:variant-soft-primary">{label}</a>
          {/each}
        </nav>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <div>
          {#if data.user}
            <div>
              <Avatar
                on:click={onUserAvatarClick}
                src={buildUrl.userAvatar(data.user.osuUserId)}
                width="w-10"
                cursor="cursor-pointer"
              />
              {#if showUserMenu}
                <div class="card absolute top-[5rem] right-4 w-52 py-2">
                  <section class="flex flex-col px-6">
                    <div class="font-bold">{data.user.username}</div>
                    <div class="text-sm">{data.user.discordTag}</div>
                  </section>
                  <nav class="mt-2 flex flex-col gap-1 px-2">
                    <a
                      href={`/user/${data.user.id}`}
                      class="btn justify-start py-1 hover:variant-soft-primary">Profile</a
                    >
                    <a
                      href="/user/settings"
                      class="btn justify-start py-1 hover:variant-soft-primary">Settings</a
                    >
                    <button
                      on:click={onLogoutClick}
                      class="btn justify-start py-1 hover:variant-soft-primary">Logout</button
                    >
                  </nav>
                </div>
              {/if}
            </div>
          {:else}
            <a href={authUrl} class="btn variant-filled-primary">Login</a>
          {/if}
        </div>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <slot />
</AppShell>
