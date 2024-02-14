<script lang="ts">
  import { AppBar, Avatar, popup } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';
  import { page } from '$app/stores';
  import type { Session } from '$types';
  import type { PopupSettings } from '@skeletonlabs/skeleton';

  export let user: Session | undefined;

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

  const adminNavLinks = [
    {
      href: 'users',
      label: 'Users'
    },
    {
      href: 'purchases',
      label: 'Purchases'
    },
    {
      href: 'upload',
      label: 'Upload'
    }
  ];
  
  const navbarPopup: PopupSettings = {
    event: 'click',
    placement: 'bottom',
    target: '',
    middleware: {
      offset: 24
    }
  };
</script>

<AppBar padding="py-3 px-6">
  <svelte:fragment slot="lead">
    <nav class="flex items-center gap-2">
      <a href="/">
        <img src={`${$page.url.origin}/logo-hybrid.svg`} alt="logo-hybrid" class="mr-4 h-7" />
      </a>
      {#if user?.isAdmin}
        <button
          class="btn hover:variant-soft-primary"
          use:popup={{ ...navbarPopup, target: 'adminPopup' }}>Admin</button
        >
        <div class="card absolute left-4 top-[5rem] w-52 py-2" data-popup="adminPopup">
          <nav class="flex flex-col gap-1 px-2">
            {#each adminNavLinks as { href, label }}
              <a href={`/admin/${href}`} class="btn justify-start py-1 hover:variant-soft-primary"
                >{label}</a
              >
            {/each}
          </nav>
        </div>
      {/if}
      {#each navLinks as { href, label }}
        <a href={`/${href}`} class="btn hover:variant-soft-primary">{label}</a>
      {/each}
    </nav>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <div>
      {#if user}
        <div use:popup={{ ...navbarPopup, target: 'avatarPopup' }}>
          <Avatar src={buildUrl.userAvatar(user.osu.id)} width="w-10" cursor="cursor-pointer" />
        </div>
        <div class="card absolute right-4 top-[5rem] w-52 py-2" data-popup="avatarPopup">
          <section class="flex flex-col px-6">
            <div class="font-bold">{user.osu.username}</div>
            <div class="text-sm">{user.discord.username}</div>
          </section>
          <nav class="mt-2 flex flex-col gap-1 px-2">
            <a
              href={`/user/${user.userId}`}
              class="btn justify-start py-1 hover:variant-soft-primary">Profile</a
            >
            <a href="/user/settings" class="btn justify-start py-1 hover:variant-soft-primary"
              >Settings</a
            >
            <a
              href={`/api/auth/logout?redirect_uri=${encodeURI($page.url.toString())}`}
              class="btn justify-start py-1 hover:variant-soft-primary">Log Out</a
            >
          </nav>
        </div>
      {:else}
        <a
          href={`/api/auth/login?redirect_uri=${encodeURI($page.url.toString())}`}
          class="variant-filled-primary btn">Log In</a
        >
      {/if}
    </div>
  </svelte:fragment>
</AppBar>
