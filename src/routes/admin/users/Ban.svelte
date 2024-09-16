<script lang="ts">
  import { Search } from 'lucide-svelte';
  import { formatDate, formatTime } from '$lib/utils';
  import type { TRPCRouterOutputs } from '$lib/types';
  import type createContextStore from './store';

  export let active = false;
  export let ban: TRPCRouterOutputs['users']['getUser']['bans'][number];
  export let ctx: ReturnType<typeof createContextStore>;
</script>

<div class="card p-4 bg-surface-200-700-token w-full">
  <p>
    Ban of
    <span class="text-error-500">
      ID {ban.id.toString()}
    </span>
    was
    <span class="text-error-500">
      issued at {formatDate(ban.issuedAt, 'shortened')} - {formatTime(ban.issuedAt)}
    </span>
    by
    <button class="chip mb-1 py-1 variant-filled" on:click={() => ctx.lookupUser(ban.issuedBy.id)}>
      <span>
        <Search size={12} />
      </span>
      <span>{ban.issuedBy.username}</span>
    </button>.
    {#if active}
      This ban is set to be
      <span class="text-error-500">
        {ban.liftAt
          ? `lift at ${formatDate(ban.liftAt, 'shortened')} - ${formatTime(ban.liftAt)}`
          : 'permanent'}
      </span>.
    {:else}
      This ban was
      {#if ban.revokeReason && ban.revokedAt && ban.revokedBy}
        set to be
        <span class="text-error-500">
          {ban.liftAt
            ? `lifted at ${formatDate(ban.liftAt, 'shortened')} - ${formatTime(ban.liftAt)}`
            : 'permanent'}
        </span>
        but was
        <span class="text-error-500"
          >revoked at {formatDate(ban.revokedAt, 'shortened')} - {formatTime(ban.revokedAt)}</span
        >
        by
        <button
          class="chip mb-1 py-1 variant-filled"
          on:click={() => ctx.lookupUser(ban.revokedBy?.id || 0)}
        >
          <span>
            <Search size={12} />
          </span>
          <span>{ban.revokedBy.username}</span>
        </button>.
      {:else if ban.liftAt}
        <span class="text-error-500"
          >lifted at {formatDate(ban.liftAt, 'shortened')} - {formatTime(ban.liftAt)}</span
        >.
      {/if}
    {/if}
  </p>
  <p class="mt-4"><strong>Ban reason: </strong>{ban.banReason}</p>
  {#if ban.revokeReason}
    <p class="mt-2"><strong>Revoke reason: </strong>{ban.revokeReason}</p>
  {/if}
</div>
