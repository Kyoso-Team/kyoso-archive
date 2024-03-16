<script lang="ts">
  import { Backdrop, Modal } from '$components/layout';
  import { Info, X } from 'lucide-svelte';
  import { formatDate, formatTime } from '$lib/utils';
  import type { Session } from '$db';

  export let session: Pick<
    typeof Session.$inferSelect,
    'id' | 'createdAt' | 'ipAddress' | 'lastActiveAt' | 'ipMetadata'
  > & {
    browser: Partial<{
      name: string;
      version: string;
    }>;
    os: Partial<{
      name: string;
      version: string;
    }>;
  };
  export let current: boolean;
  export let deleteSession: (sessionId: number) => Promise<void>;
  let showMore = false;
  let showEndSessionPrompt = false;

  function toggleShowMore() {
    showMore = !showMore;
  }

  function toggleEndSessionPrompt() {
    showEndSessionPrompt = !showEndSessionPrompt;
  }

  async function onDeleteSession() {
    await deleteSession(session.id);
    showEndSessionPrompt = false;
  }
</script>

{#if showMore}
  <Backdrop>
    <Modal>
      <button class="close-btn" on:click={toggleShowMore}>
        <X />
      </button>
      <span class="title">Session Info</span>
      <ul class="list-disc pl-4">
        <li><strong>Session ID:</strong> {session.id.toString()}</li>
        <li>Signed in using...</li>
        <ul class="my-2 list-disc pl-8">
          <li><strong>IP:</strong> {session.ipAddress}</li>
          <li>
            <strong>Browser:</strong>
            {session.browser.name && session.browser.version
              ? `${session.browser.name} ${session.browser.version}`
              : 'Unknown'}
          </li>
          <li>
            <strong>OS:</strong>
            {session.os.name && session.os.version
              ? `${session.os.name} ${session.os.version}`
              : 'Unknown'}
          </li>
        </ul>
        <li>
          <strong>Signed in:</strong>
          {formatDate(session.createdAt)} - {formatTime(session.createdAt)}
        </li>
        <li>
          <strong>Last active:</strong>
          {current
            ? 'Now'
            : `${formatDate(session.lastActiveAt)} - ${formatTime(session.lastActiveAt)}`}
        </li>
      </ul>
    </Modal>
  </Backdrop>
{/if}
{#if showEndSessionPrompt}
  <Backdrop>
    <Modal>
      <span class="title">End Session</span>
      <p>
        Are you sure you want to end this session? You'll be signed out of the respective device and
        browser.
      </p>
      <div class="actions">
        <button class="btn variant-filled-error" on:click={onDeleteSession}>End Session</button>
        <button class="btn variant-filled" on:click={toggleEndSessionPrompt}>Close</button>
      </div>
    </Modal>
  </Backdrop>
{/if}
<div class="card p-4 xs:grid xs:grid-cols-2 flex flex-wrap">
  <div class="flex flex-col">
    <span class="font-medium text-lg inline-block relative max-w-max">
      {#if current}
        <span class="badge variant-soft-secondary top-[2px] absolute -right-16">Current</span>
      {/if}
      {session.ipAddress}
    </span>
    <span class="dark:text-zinc-300 text-zinc-700 text-xs">
      {session.ipMetadata.city}, {session.ipMetadata.region}, {session.ipMetadata.country}
    </span>
  </div>
  <div class="flex gap-2 xs:justify-end mt-4 xs:mt-0 w-full">
    <button class="btn-icon variant-filled" on:click={toggleShowMore}>
      <Info size={24} />
    </button>
    {#if !current}
      <button class="btn-icon variant-filled-error" on:click={toggleEndSessionPrompt}>
        <X size={24} />
      </button>
    {/if}
  </div>
</div>
