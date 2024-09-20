<script lang="ts">
  import { LightSwitch } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { Discord } from '$lib/components/icons';
  import type { AuthSession } from '$lib/types';

  export let session: AuthSession;
  export let popupName: string;
</script>

<div class="card absolute w-60 py-2 shadow-md z-[29]" data-popup={popupName}>
  <div class="flex flex-col px-6">
    <span class="font-medium truncate">{session.osu.username}</span>
    <span class="text-sm flex gap-1 items-center">
      <Discord w={16} h={16} class="fill-black dark:fill-white" />
      <span class="truncate">{session.discord.username}</span>
    </span>
  </div>
  <nav class="mt-2 flex flex-col gap-1 px-2">
    <a href={`/user/${session.userId}`} class="btn justify-start py-1 hover:variant-soft-primary"
      >Profile</a
    >
    <a href="/user/settings" class="btn justify-start py-1 hover:variant-soft-primary">Settings</a>
    <a
      href={`/api/auth/logout?redirect_uri=${encodeURI($page.url.toString())}`}
      class="btn justify-start py-1 hover:variant-soft-primary">Log Out</a
    >
    <div class="my-1 ml-5 flex">
      <span>Theme</span>
      <div class="w-full flex justify-end mr-5">
        <LightSwitch rounded="rounded-full" />
      </div>
    </div>
  </nav>
</div>
