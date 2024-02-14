<script lang="ts">
  import { portal } from 'svelte-portal';
  import { SEO } from '$components/general';
  import { Osu, Discord } from '$components/icons';
  // import { trpc } from '$trpc/client';
  import { page } from '$app/stores';
  import { fade, fly } from 'svelte/transition';
  import type { PageServerData } from './$types';

  export let data: PageServerData;
  let openChangeDiscordPrompt = false;

  function toggleChangeDiscordPrompt() {
    openChangeDiscordPrompt = !openChangeDiscordPrompt;
  }
</script>

<SEO page={$page} title="User Settings - Kyoso" description="User settings" noIndex />
{#if openChangeDiscordPrompt}
  <div class="backdrop z-20 flex justify-center items-center" use:portal transition:fade={{ duration: 150 }}>
    <div class="modal" transition:fly={{ duration: 150, y: 100 }}>
      <span class="title">Change Discord Account</span>
      <p>Are you sure you want to change the Discord account linked to Kyoso profile?</p>
      <div class="actions">
        <a class="btn variant-filled-primary" href={`/api/auth/change_discord?redirect_uri=${encodeURI($page.url.toString())}`}>Change Discord</a>
        <button class="btn variant-filled" on:click={toggleChangeDiscordPrompt}>Cancel</button>
      </div>
    </div>
  </div>
{/if}
<div class="m-8 flex justify-center">
  <div class="w-[48rem]">
    <h1>User Settings</h1>
    <h2>Accounts</h2>
    <p>The accounts linked to your Kyoso profile.</p>
    <div class="flex gap-4 mt-4">
      <div class="card p-4 w-96 flex items-center">
        <div class="mr-2">
          <Osu w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-lg font-medium">{data.user.osu.username}</span>
          <span class="text-sm"><span class="font-medium">User ID:</span> {data.user.osu.id}</span>
        </div>
      </div>
      <div class="card p-4 w-96 flex items-center">
        <div class="mr-2">
          <Discord w={48} h={48} class="fill-black dark:fill-white" />
        </div>
        <div class="flex flex-col">
          <span class="text-lg font-medium">{data.user.discord.username}</span>
          <span class="text-sm"><span class="font-medium">User ID:</span> {data.user.discord.id}</span>
        </div>
      </div>
    </div>
    <div class="my-2 flex justify-end">
      <button class="btn btn-sm variant-filled-primary" on:click={toggleChangeDiscordPrompt}>Change Discord</button>
    </div>
  </div>
</div>
