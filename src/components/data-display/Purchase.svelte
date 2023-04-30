<script lang="ts">
  import { format, tooltip } from '$lib/utils';
  import { Avatar } from '@skeletonlabs/skeleton';
  import { buildUrl } from 'osu-web.js';
  import { popup } from '@skeletonlabs/skeleton';
  import { Tooltip } from '$components';
  import type { TournamentService } from '@prisma/client';

  export let purchase: {
    id: number;
    purchasedAt: Date;
    cost: number;
    paypalOrderId: string;
    services: TournamentService[];
    purchasedBy?: {
      id: number;
      osuUsername: string;
      osuUserId: number;
    } | null;
    forTournament?: {
      id: number;
      name: string;
      acronym: string;
    } | null
  };

  let tournamentNameTooltipTarget = `tournament-name-in-purchase-${purchase.id}`;
</script>

<div class="card bg-surface-backdrop-token p-4 w-64 md:w-96">
  <!-- TODO: Handle case where purchasedBy is undefined -->
  {#if purchase.purchasedBy}
    <div class="grid grid-cols-[auto] md:grid-cols-[auto_auto]">
      <div class="mr-2 hidden md:block">
        <Avatar
          src={buildUrl.userAvatar(purchase.purchasedBy.osuUserId)}
          rounded="rounded-md"
          width="w-12"
        />
      </div>
      <div>
        <a href={buildUrl.user(purchase.purchasedBy.osuUserId)}>{purchase.purchasedBy.osuUsername}</a> made a purchase of {format.price(purchase.cost)} for
        {' '}
        {#if purchase.forTournament}
          <a
            href={`/tournament/${purchase.forTournament.id}`}
            use:popup={tooltip(tournamentNameTooltipTarget)}
          >{purchase.forTournament.acronym}</a>
          <Tooltip
            target={tournamentNameTooltipTarget}
            label={purchase.forTournament.name}
          />
          <div class="text-xs text-center card variant-filled p-2 whitespace-nowrap" data-popup='tournament-name'>
            {purchase.forTournament.name}
            <div class="arrow variant-filled" />
          </div>
        {:else}
          <span
            class="text-primary-500"
            use:popup={tooltip(tournamentNameTooltipTarget)}
          >???</span>
          <Tooltip
            target={tournamentNameTooltipTarget}
            label="This tournament is deleted"
          />
        {/if}
        {' '}
        on {format.date(purchase.purchasedAt)}.
      </div>
    </div>
  {/if}
  <div class="font-bold mt-2">Services Purchased</div>
  <div class="mb-2 flex gap-2 flex-wrap">
    {#each purchase.services as service}
      <span class="badge variant-filled-tertiary">{service}</span>
    {/each}
  </div>
  <span class="text-sm">PayPal Order ID: {purchase.paypalOrderId}</span>
</div>
