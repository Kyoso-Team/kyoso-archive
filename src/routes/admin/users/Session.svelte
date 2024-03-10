<script lang="ts">
  import { formatDate, formatTime } from '$lib/utils';
  import type { TRPCRouter } from '$types';

  export let session: TRPCRouter['users']['getUser']['sessions']['active'][number];
</script>

<div class="card dark:bg-surface-900 bg-surface-200 p-4 flex flex-col">
  <div>
    <strong>Session ID:</strong> {session.id.toString()}
  </div>
  <div>
    <strong>Signed in:</strong> {formatDate(session.createdAt)} - {formatTime(session.createdAt)}
  </div>
  <div>
    <strong>Last active at:</strong> {formatDate(session.lastActiveAt)} - {formatTime(session.lastActiveAt)}
  </div>
</div>