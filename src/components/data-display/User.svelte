<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';

  export let data: {
    user: {
      id: number
      isAdmin: boolean
      isRestricted: boolean
      osuUserId: number
      osuUsername: string
      discordUsername: string
      discordDiscriminator: number
      showDiscordTag: boolean
      country: {
        name: string,
        code: string
      }
    };
    options?: {
      forceShowDiscord?: boolean
    };
  };
</script>

<div class="card w-64 p-4 bg-surface-backdrop-token">
  <div class="grid grid-cols-4 gap-0">
    <div class="row-span-2">
      <Avatar
        src={buildUrl.userAvatar(data.user.osuUserId)}
        rounded="rounded-md"
        width="w-12"
      />
    </div>
    <div class="col-span-2 flex">
      <a href={buildUrl.user(data.user.osuUserId)} target="_blank"
        >{data.user.osuUsername}</a
      >
      <img
        class="h-4 ml-1"
        src={buildUrl.custom(`images/flags/${data.user.country.code}.png`)}
        alt={`Flag of ${data.user.country.name}`}
      >
    </div>
    <div class="col-span-1">
    </div>
    <div class="col-span-3">
      {#if data.user.showDiscordTag || data.options?.forceShowDiscord}
        {data.user.discordUsername}#{data.user.discordDiscriminator}
      {/if}
    </div>
    <div class="mt-2 col-span-4 row-span-4">
      {#if data.user.isAdmin}
        <span class="badge variant-filled-secondary mx-auto">Kyoso Admin</span>
      {/if}
      {#if data.user.isRestricted}
        <span class="badge variant-filled-error mx-auto">Restricted</span>
      {/if}
    </div>
  </div>
</div>
