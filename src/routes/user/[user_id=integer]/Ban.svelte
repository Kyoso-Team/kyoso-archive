<script lang="ts">
  import { formatDate, formatTime } from '$lib/format';
  import type { PageServerData } from './$types';

  export let ban: NonNullable<PageServerData['user']['activeBan']>;
  export let showUsers: boolean;

  function viewAsAdmin(
    _ban: PageServerData['user']['activeBan']
  ): _ban is Extract<PageServerData['user']['activeBan'], { issuedBy: any }> {
    return showUsers;
  }
</script>

<div class="card bg-surface-200-700-token p-4">
  <p><strong class="text-error-500">Ban reason:</strong> {ban.banReason}</p>
  {#if ban.revokeReason}
    <p class="mt-2">
      <strong class="text-primary-500 mt-2">Revoke reason:</strong>
      {ban.revokeReason}
    </p>
  {/if}
  <p class="text-sm text-surface-600-300-token mt-2">
    <span>
      Issued at {formatDate(ban.issuedAt, 'shortened')}, {formatTime(ban.issuedAt)}
      {#if viewAsAdmin(ban)}
        by <a href={`/user/${ban.issuedBy.id}`} class="underline">{ban.issuedBy.username}</a>
      {/if}
    </span>
    {#if ban.revokedAt}
      -
      <span>Revoked at {formatDate(ban.revokedAt, 'shortened')}, {formatTime(ban.revokedAt)}</span>
      {#if viewAsAdmin(ban) && ban.revokedBy}
        by <a href={`/user/${ban.revokedBy.id}`} class="underline">{ban.revokedBy.username}</a>
      {/if}
    {:else if ban.liftAt}
      -
      <span>Lifted at {formatDate(ban.liftAt, 'shortened')}, {formatTime(ban.liftAt)}</span>
    {/if}
  </p>
</div>
