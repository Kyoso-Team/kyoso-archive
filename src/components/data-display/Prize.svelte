<script lang="ts">
  import { format, tooltip } from '$lib/utils';
  import { popup } from '@skeletonlabs/skeleton';
  import {
    TrophyIcon,
    MedalIcon,
    BadgeIcon,
    BannerIcon,
    HeartIcon,
    MoneyIcon,
    AdditionIcon,
    Tooltip
  } from '$components';
  import type { dbPrize, dbPrizeCash } from '$db/schema';
  import type { InferSelectModel } from 'drizzle-orm';

  const badgeStyles = 'badge variant-ghost !bg-surface-900 h-7';
  const spanStyles = 'text-white font-black text-base tracking-wide block relative';
  export let prize: Omit<InferSelectModel<typeof dbPrize>, 'tournamentId'> & {
    cash: Omit<InferSelectModel<typeof dbPrizeCash>, 'inPrizeId'> | null;
  };
  let tooltips = {
    trophy: `prize-trophy-${prize.id}`,
    medal: `prize-medal-${prize.id}`,
    badge: `prize-badge-${prize.id}`,
    banner: `prize-banner-${prize.id}`,
    supporter: `prize-osu-supporter-${prize.id}`,
    cash: `prize-cash-${prize.id}`,
    items: `prize-items-${prize.id}`
  };
</script>

<div class="card relative flex w-64 flex-col p-2 px-4">
  <slot name="menu" />
  <div class="mb-2 text-center">
    <h3
      class={prize.placements?.[0] === 1
        ? 'text-yellow-300'
        : prize.placements?.[0] === 2
        ? 'text-gray-300'
        : prize.placements?.[0] === 3
        ? 'text-orange-300'
        : ''}
    >
      {format.placements(prize.placements)} Place
    </h3>
  </div>
  <div class="flex flex-wrap items-center justify-center gap-1">
    {#if prize.trophy}
      <span class={`${badgeStyles} w-[52px]`} use:popup={tooltip(tooltips.trophy)}>
        <TrophyIcon h={18} styles="fill-white" />
      </span>
      <Tooltip target={tooltips.trophy} label="Physical trophy" />
    {/if}
    {#if prize.medal}
      <span class={`${badgeStyles} w-[52px]`} use:popup={tooltip(tooltips.medal)}>
        <MedalIcon h={22} styles="fill-white" />
      </span>
      <Tooltip target={tooltips.medal} label="Physical medal" />
    {/if}
    {#if prize.badge}
      <span class={`${badgeStyles} w-[52px]`} use:popup={tooltip(tooltips.badge)}>
        <BadgeIcon h={20} styles="fill-white" />
      </span>
      <Tooltip target={tooltips.badge} label="Profile badge" />
    {/if}
    {#if prize.banner}
      <span class={`${badgeStyles} w-[52px]`} use:popup={tooltip(tooltips.banner)}>
        <BannerIcon h={24} styles="fill-white" />
      </span>
      <Tooltip target={tooltips.banner} label="Profile banner" />
    {/if}
    {#if prize.monthsOsuSupporter || 0 > 0}
      <span class={`${badgeStyles} w-[72px]`} use:popup={tooltip(tooltips.supporter)}>
        <span class={`${spanStyles} -mr-1`}>{prize.monthsOsuSupporter}</span>
        <HeartIcon h={18} styles="fill-white" />
      </span>
      <Tooltip
        target={tooltips.supporter}
        label={`${prize.monthsOsuSupporter} months of osu! supporter`}
      />
    {/if}
    {#if prize.cash && prize.cash.value > 0}
      <span class={`${badgeStyles} w-20`} use:popup={tooltip(tooltips.cash)}>
        <span class={`${spanStyles} -mr-3`}>
          {prize.cash.value}{prize.cash.metric === 'percent' ? '%' : ''}
        </span>
        <MoneyIcon h={22} styles="fill-white" />
      </span>
      <Tooltip
        target={tooltips.cash}
        label={prize.cash.metric === 'percent'
          ? `${prize.cash.value}% of the prize pool (${prize.cash.currency})`
          : `${prize.cash.value} ${prize.cash.currency}`}
      />
    {/if}
    {#if prize.additionalItems.length > 0}
      <span class={`${badgeStyles} w-[52px]`} use:popup={tooltip(tooltips.items)}>
        <AdditionIcon h={20} styles="fill-white" />
      </span>
      <Tooltip target={tooltips.items} label={format.listArray(prize.additionalItems)} />
    {/if}
  </div>
</div>
