<script lang="ts">
  import KyosoBadges from './KyosoBadges.svelte';
  import { Discord, OsuCatch, OsuMania, OsuStandard, OsuTaiko } from '$components/icons';
  import { Tooltip } from '$components/general';
  import { buildUrl } from 'osu-web.js';
  import { formatDate, formatNumber, tooltip } from '$lib/utils';
  import { popup } from '$lib/popup';
  import type { PageServerData } from './$types';
  import type { AnyComponent } from '$types';

  export let data: PageServerData;
  const kyosoBadges: {
    label: string;
    description: string;
    tooltipName: string;
    variant: string;
    show: boolean;
  }[] = [{
    label: 'Owner',
    description: 'Owner of Kyoso',
    tooltipName: 'tooltip-owner',
    variant: 'variant-soft-indigo',
    show: data.user.owner
  }, {
    label: 'Admin',
    description: 'Website admin',
    tooltipName: 'tooltip-admin',
    variant: 'variant-soft-blue',
    show: data.user.admin
  }, {
    label: 'Host',
    description: 'Approved host',
    tooltipName: 'tooltip-host',
    variant: 'variant-soft-teal',
    show: data.user.approvedHost
  }, {
    label: 'Banned',
    description: 'Banned from using Kyoso services',
    tooltipName: 'tooltip-banned',
    variant: 'variant-soft-red',
    show: !!data.user.activeBan
  }];
  // NOTE: Update later with other ruleset rankings
  const rankings: {
    label: string;
    tooltipName: string;
    rank: number | null;
    icon: AnyComponent;
  }[] = [{
    label: 'osu! standard global rank',
    tooltipName: 'tooltip-standard-rank',
    rank: data.user.osu.globalStdRank,
    icon: OsuStandard
  }, {
    label: 'osu! taiko global rank',
    tooltipName: 'tooltip-taiko-rank',
    rank: data.user.osu.globalTaikoRank,
    icon: OsuTaiko
  }, {
    label: 'osu! catch global rank',
    tooltipName: 'tooltip-catch-rank',
    rank: data.user.osu.globalCatchRank,
    icon: OsuCatch
  }, {
    label: 'osu! mania global rank',
    tooltipName: 'tooltip-mania-rank',
    rank: data.user.osu.globalManiaRank,
    icon: OsuMania
  }];

  function viewAsAdmin(user: typeof data.user): user is Extract<typeof data.user, { viewAsAdmin: true; }> {
    return user.viewAsAdmin;
  }

  function viewAsCurrent(user: typeof data.user): user is Extract<typeof data.user, { isCurrent: true; }> {
    return user.isCurrent;
  }

  function viewAsPublicDiscord(user: typeof data.user): user is Extract<typeof data.user, { settings: { publicDiscord: true; }; }> {
    return user.settings.publicDiscord;
  }
</script>

<main class="main flex justify-center">
  <div class="w-full max-w-5xl">
    <h1>User Profile</h1>
    <div class="line-b mt-4 mb-8" />
    <section>
      <div class="card p-4 flex flex-col gap-4">
        <div class="flex gap-4">
          <div>
            <div class="card bg-surface-200-700-token overflow-hidden w-max">
              <img
                src={buildUrl.userAvatar(data.user.osu.osuUserId)}
                alt="user-pfp"
                width={96}
                height={96}
                class="max-2sm:w-20 max-2sm:h-20"
              />
            </div>
          </div>
          <div class="flex flex-col">
            <div class="flex gap-4 items-center">
              <h2 class="text-xl font-medium leading-7">
                <a class="hover:text-primary-500 duration-150" href={buildUrl.user(data.user.osu.osuUserId)}>{data.user.osu.username}</a>
              </h2>
              <div class="gap-1 h-max hidden md:flex">
                <KyosoBadges {kyosoBadges} />
              </div>
            </div>
            {#if viewAsAdmin(data.user) || viewAsCurrent(data.user) || viewAsPublicDiscord(data.user)}
              <div class="flex gap-1 items-center text-sm">
                <Discord w={16} h={16} class="fill-surface-600 dark:fill-surface-300" />
                <span class="block text-surface-600-300-token">{data.user.discord.username}</span>
              </div>
            {/if}
            <div class="flex gap-1 md:gap-2 mt-1 items-center flex-wrap">
              <button class="cursor-default" use:popup={tooltip('tooltip-country')}>
                <img
                  src={`https://osuflags.omkserver.nl/${data.user.country.code}.png`}
                  alt="country-flag"
                  width={24}
                  height={24}
                />
              </button>
              <Tooltip target="tooltip-country" label={data.user.country.name} visibility="block md:hidden" />
              <KyosoBadges {kyosoBadges} class="flex md:hidden" responsive />
              <span class="hidden md:block">{data.user.country.name}</span>
            </div>
          </div>
        </div>
        {#if data.user.badges.length > 0}
          <div class="line-b" />
          <div class="flex flex-wrap gap-2">
            {#each data.user.badges as { awardedAt, description, imgFileName }, i}
              <button class="cursor-default [&>*]:pointer-events-none" use:popup={tooltip(`tooltip-badge-${i.toString()}`)}>
                <img
                  src={imgFileName}
                  alt={description}
                  width={86}
                  height={40}
                />
              </button>
              <Tooltip target={`badge-${i.toString()}`} label={description || ''}>
                <span class="text-primary-500 block">{formatDate(awardedAt, 'full')}</span>
              </Tooltip>
            {/each}
          </div>
        {/if}
        <div class="line-b" />
        <div class="grid 2sm:grid-cols-2 2md:grid-cols-4 gap-2">
          {#if data.user.osu.restricted}
            <div class="card variant-soft-error 2md:col-span-4 p-2 font-medium text-center">
              This user is restricted on osu!
            </div>
          {/if}
          {#each rankings as { label, tooltipName, rank, icon }}
            <button class="card bg-surface-200-700-token p-4 text-lg w-full cursor-default flex gap-2 items-center [&>*]:pointer-events-none" use:popup={tooltip(tooltipName)}>
              <svelte:component this={icon} size={32} />
              {rank ? `#${formatNumber(rank)}` : '-'}
            </button>
            <Tooltip target={tooltipName} {label} />
          {/each}
        </div>
        <div class="line-b" />
        <div class="flex gap-2 flex-wrap">
          <span class="block badge variant-soft-surface">Joined on {formatDate(data.user.registeredAt, 'full')}</span>
          {#if viewAsAdmin(data.user)}
            <span class="block badge variant-soft-surface">Updated API data on {formatDate(data.user.updatedApiDataAt, 'full')}</span>
          {/if}
        </div>
      </div>
    </section>
    <div class="line-b my-8" />
  </div>
</main>
