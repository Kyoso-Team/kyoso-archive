<script lang="ts">
  import { formatDate, formatTime } from '$lib/utils';
  import type { TRPCRouter } from '$types';

  export let session: TRPCRouter['users']['getUser']['sessions']['active'][number];
</script>

<div class="card bg-surface-200-700-token p-4 flex flex-col gap-2 sm:gap-0">
  <div class="flex flex-col sm:block">
    <strong>Session ID:</strong> <span>{session.id.toString()}</span>
  </div>
  <div class="flex flex-col sm:block">
    <strong>Signed in:</strong>
    <span>{formatDate(session.createdAt, 'shortened')} - {formatTime(session.createdAt)}</span>
  </div>
  <div class="flex flex-col sm:block">
    <strong>Last active at:</strong>
    <span>{formatDate(session.lastActiveAt, 'shortened')} - {formatTime(session.lastActiveAt)}</span
    >
  </div>
</div>
