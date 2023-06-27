<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';

  export let user: {
    id: number;
    isAdmin: boolean;
    isRestricted: boolean;
    osuUserId: number;
    osuUsername: string;
    discordUsername: string;
    discordDiscriminator: string;
    showDiscordTag: boolean;
    country: {
      name: string;
      code: string;
    };
  };
  export let forceShowDiscord: boolean = false;
</script>

<div class="card w-64 p-4 bg-surface-backdrop-token sm:w-72">
  <div class="grid grid-cols-[max-content_1fr_1fr_1fr] gap-0">
    <div class="row-span-2 mr-2 max-w-min">
      <Avatar src={buildUrl.userAvatar(user.osuUserId)} rounded="rounded-md" width="w-12" />
    </div>
    <div class="col-span-2 flex items-center">
      <a href={buildUrl.user(user.osuUserId)} target="_blank">{user.osuUsername}</a>
      <img
        class="ml-2 h-4"
        src={buildUrl.custom(`images/flags/${user.country.code}.png`)}
        alt={`Flag of ${user.country.name}`}
      />
    </div>
    <div class="col-span-3 text-sm">
      {#if user.showDiscordTag || forceShowDiscord}
        {user.discordUsername}#{user.discordDiscriminator}
      {/if}
    </div>
    <div class="col-span-4 row-span-4 mt-2">
      {#if user.isAdmin}
        <span class="badge variant-filled-secondary mx-auto">Admin</span>
      {/if}
      {#if user.isRestricted}
        <span class="variant-filled-error badge mx-auto">Restricted</span>
      {/if}
    </div>
  </div>
</div>
